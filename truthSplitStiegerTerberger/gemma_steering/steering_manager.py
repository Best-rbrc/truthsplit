"""
Gemma Steering Manager

Manages Gemma-2B model with SAE-based steering for worldview analysis.
Provides dynamic feature discovery and improved prompting based on gemmaLoad.py style.
"""

import torch
import os
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import sys

# Add parent directory for imports
sys.path.append(str(Path(__file__).parent.parent))

try:
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from sae_lens import SAE
    from huggingface_hub import login
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("transformers/sae-lens not available - Gemma steering disabled")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class GemmaSteeringManager:
    """
    Manages Gemma-2B model with SAE-based steering for worldview analysis.
    Uses dynamic feature discovery and improved prompting.

    By default, the SAE is both *trained on* and *hooked into* the same layer.
    However, for experimentation you can choose:
      - one layer to load the SAE from (sae_layer_index)
      - a different layer to actually register the forward hook on (hook_layer_index)
    """
    
    def __init__(
        self,
        hf_token: str = None,
        model_id: str = "google/gemma-2b",
        sae_layer_index: int = 6,
        hook_layer_index: Optional[int] = None,
        device: str = "auto",
    ):
        """
        Initialize Gemma model and SAE for steering.
        
        Args:
            hf_token: HuggingFace token (or use HUGGING_FACE_KEY env var)
            model_id: Model identifier
            sae_layer_index: Layer index where the SAE was trained / should read activations
            hook_layer_index: Layer index where the steering hook is actually registered.
                              If None, defaults to sae_layer_index.
            device: Device to load model on
        """
        if not TRANSFORMERS_AVAILABLE:
            raise RuntimeError("transformers and sae-lens packages required for Gemma steering")
        
        # Get HuggingFace token
        self.hf_token = hf_token or os.getenv('HUGGING_FACE_KEY')
        if not self.hf_token:
            raise ValueError("HUGGING_FACE_KEY not found in environment variables")
        
        self.model_id = model_id
        self.sae_layer_index = sae_layer_index
        # Allow steering hook to be placed on a different layer than the SAE
        self.hook_layer_index = hook_layer_index if hook_layer_index is not None else sae_layer_index
        self.device = device
        
        # Initialize model and SAE (lazy loading)
        self.model = None
        self.tokenizer = None
        self.sae = None
        self._initialized = False
        
        # Active hooks storage
        self.active_hooks = []
    
    def _get_model_device(self):
        """
        Get the device where model inputs should be placed.
        Works correctly even when model is split across multiple devices via device_map="auto".
        This fix prevents 'lm_head.weight' errors in production/web server environments.
        """
        if not self._initialized:
            raise RuntimeError("Model not initialized. Call initialize() first.")
        
        if self.model is None:
            raise RuntimeError("Model is None. Cannot determine device.")
        
        try:
            # Try to get device attribute (works for models loaded without device_map)
            if hasattr(self.model, 'device') and self.model.device is not None:
                return self.model.device
        except (AttributeError, RuntimeError):
            pass
        
        try:
            # For models with device_map="auto", get device from first parameter
            # This handles cases where model is split across multiple devices
            return next(self.model.parameters()).device
        except (StopIteration, RuntimeError) as e:
            # Fallback: try to get device from lm_head (output layer)
            try:
                if hasattr(self.model, 'lm_head') and hasattr(self.model.lm_head, 'weight'):
                    return self.model.lm_head.weight.device
            except (AttributeError, RuntimeError):
                pass
            
            # Last resort: try to infer from config
            if hasattr(self, 'device') and self.device and self.device != "auto":
                import torch
                return torch.device(self.device)
            
            # Default fallback (should not happen in normal operation)
            import torch
            return torch.device('cpu')
    
    def initialize(self):
        """Lazy initialization of model and SAE"""
        if self._initialized:
            return
        
        print("Initializing Gemma-2B model and SAE...")
        
        try:
            # Login to HuggingFace
            login(self.hf_token)
            
            # Load tokenizer and model
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                device_map=self.device,
                dtype=torch.bfloat16,
                token=self.hf_token
            )
            print(f"[GemmaSteering] Gemma-2B loaded - Hidden size: {self.model.config.hidden_size}")
            
            # Load SAE - force CPU device since sae-lens doesn't support MPS properly.
            # The SAE is small enough that CPU is fine for encoding/decoding.
            sae_device = "cpu"
            sae_release = "gemma-2b-res-jb"
            sae_id = f"blocks.{self.sae_layer_index}.hook_resid_post"
            print(f"[GemmaSteering] Loading SAE from release '{sae_release}' with id '{sae_id}' "
                  f"at layer {self.sae_layer_index} on device {sae_device}...")
            self.sae = SAE.from_pretrained(
                release=sae_release,
                sae_id=sae_id,
                device=sae_device
            )
            print(f"[GemmaSteering] SAE loaded - d_sae={self.sae.cfg.d_sae}, d_in={self.sae.cfg.d_in}")
            
            # Validate dimensions
            if self.sae.cfg.d_in != self.model.config.hidden_size:
                raise ValueError(
                    f"[GemmaSteering] SAE expects {self.sae.cfg.d_in} dims but model has {self.model.config.hidden_size}"
                )
            
            self._initialized = True
            print("[GemmaSteering] Gemma steering manager initialized successfully")
            
        except Exception as e:
            print(f"Failed to initialize Gemma steering: {e}")
            raise
    
    def create_steering_hook(self, feature_indices: List[int], amplification: float = 2.5):
        """
        Create a steering hook that amplifies specific SAE features.
        
        Args:
            feature_indices: List of feature indices to amplify
            amplification: Amplification factor (default 2.5)
        
        Returns:
            Hook function
        """
        if not self._initialized:
            self.initialize()
        
        print(f"[GemmaSteering] Creating steering hook on layer {self.hook_layer_index} "
              f"for {len(feature_indices)} features with amplification {amplification}")
        
        def steering_hook(module, input, output):
            """Hook function that applies steering"""
            if isinstance(output, tuple):
                hidden = output[0]
            else:
                hidden = output
            
            hidden = hidden.detach()
            original_device = hidden.device
            
            # Move to SAE device (CPU) for encoding
            hidden_cpu = hidden.to(self.sae.device)
            
            # Encode to features
            features = self.sae.encode(hidden_cpu)
            
            # Amplify specified features
            for idx in feature_indices:
                if idx < features.shape[-1]:
                    features[..., idx] *= amplification
            
            # Decode back to hidden states
            steered_hidden = self.sae.decode(features)
            
            # Move back to original device (MPS)
            steered_hidden = steered_hidden.to(original_device).to(hidden.dtype)
            
            # Return in same format as input
            if isinstance(output, tuple):
                return (steered_hidden,) + output[1:]
            return steered_hidden
        
        return steering_hook
    
    def generate_with_steering(
        self,
        prompt: str,
        feature_indices: List[int],
        amplification: float = 2.5,
        max_new_tokens: int = 250,
        temperature: float = 0.8,
        do_sample: bool = True,
        top_p: float = 0.9,
        top_k: int = 50,
        repetition_penalty: float = 1.2,
        no_repeat_ngram_size: int = 4,
    ) -> str:
        """
        Generate text with steering applied.
        
        Args:
            prompt: Input prompt
            feature_indices: Feature indices to amplify
            amplification: Amplification factor
            max_new_tokens: Maximum tokens to generate
            temperature: Generation temperature
            do_sample: Whether to use sampling
            top_p: Nucleus sampling parameter
            top_k: Top-k sampling parameter
            repetition_penalty: Repetition penalty factor
            no_repeat_ngram_size: N-gram size to avoid repeating
        
        Returns:
            Generated text
        """
        if not self._initialized:
            print("[GemmaSteering] generate_with_steering called before initialization - initializing now")
            self.initialize()
        
        print(f"[GemmaSteering] generate_with_steering: amplification={amplification}, "
              f"features={len(feature_indices)}, max_new_tokens={max_new_tokens}")
        
        # If amplification is 0 or very close to 0, skip steering and use baseline generation
        if amplification <= 0.01:
            print("[GemmaSteering] Amplification <= 0.01 - skipping steering and using baseline generation")
            return self.generate_without_steering(
                prompt=prompt,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=do_sample,
                top_p=top_p,
                top_k=top_k,
                repetition_penalty=repetition_penalty,
                no_repeat_ngram_size=no_repeat_ngram_size,
            )
        
        # Create steering hook
        steering_hook_fn = self.create_steering_hook(feature_indices, amplification)
        
        # Register hook (can be different from SAE layer for experimentation)
        hook_layer = self.hook_layer_index
        hook_handle = self.model.model.layers[hook_layer].register_forward_hook(
            steering_hook_fn
        )
        self.active_hooks.append(hook_handle)
        print(f"[GemmaSteering] Steering hook registered on layer {hook_layer}")
        
        try:
            # Tokenize and generate
            model_device = self._get_model_device()
            inputs = self.tokenizer(prompt, return_tensors="pt").to(model_device)
            
            with torch.no_grad():
                print(f"[GemmaSteering] Starting steered generation (max_new_tokens={max_new_tokens})")
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=0.7,  # Lower temperature for more focused responses
                    do_sample=True,
                    top_p=0.95,  # Slightly higher for more diversity
                    top_k=40,  # Lower top_k for more focused sampling
                    repetition_penalty=1.15,  # Slightly lower to allow natural repetition
                    no_repeat_ngram_size=3,  # Smaller n-gram to allow natural flow
                    pad_token_id=self.tokenizer.eos_token_id,
                )
            print("[GemmaSteering] Steered generation finished")
            
            # Decode output
            result = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Remove prompt prefix only if there is substantial new content
            if result.startswith(prompt):
                suffix = result[len(prompt):]
                if suffix.strip():
                    result = suffix.strip()
            
            return result
            
        finally:
            # Remove hook
            hook_handle.remove()
            if hook_handle in self.active_hooks:
                self.active_hooks.remove(hook_handle)
            print("[GemmaSteering] Steering hook removed and cleaned up")
    
    def generate_without_steering(
        self,
        prompt: str,
        max_new_tokens: int = 250,
        temperature: float = 0.8,
        do_sample: bool = True,
        top_p: float = 0.9,
        top_k: int = 50,
        repetition_penalty: float = 1.2,
        no_repeat_ngram_size: int = 4,
    ) -> str:
        """Generate text without steering (baseline)"""
        if not self._initialized:
            self.initialize()
        
        model_device = self._get_model_device()
        inputs = self.tokenizer(prompt, return_tensors="pt").to(model_device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=0.7,
                do_sample=True,
                top_p=0.95,
                top_k=40,
                repetition_penalty=1.15,
                no_repeat_ngram_size=3,
                pad_token_id=self.tokenizer.eos_token_id,
            )
        
        result = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        if result.startswith(prompt):
            suffix = result[len(prompt):]
            if suffix.strip():
                result = suffix.strip()
        
        return result
    
    def _capture_activation_vectors(self, prompts: List[str]) -> Optional[np.ndarray]:
        """Capture average SAE activations for a list of prompts."""
        if not prompts:
            return None
        
        if not self._initialized:
            print("[GemmaSteering] _capture_activation_vectors called before initialization - initializing now")
            self.initialize()
        
        print(f"[GemmaSteering] Capturing activation vectors for {len(prompts)} prompt(s)")
        layer_activations: List[torch.Tensor] = []
        
        def capture_hook(module, input, output):
            hidden = output[0] if isinstance(output, tuple) else output
            layer_activations.append(hidden.detach().to(self.sae.device))
            return output
        
        # Always capture activations at the SAE layer (where the SAE was trained)
        hook = self.model.model.layers[self.sae_layer_index].register_forward_hook(capture_hook)
        feature_vectors = []
        
        try:
            for prompt in prompts:
                if not prompt:
                    continue
                layer_activations.clear()
                model_device = self._get_model_device()
                inputs = self.tokenizer(prompt, return_tensors="pt").to(model_device)
                with torch.no_grad():
                    print(f"[GemmaSteering] Running model forward pass for activation capture (prompt length={len(prompt)})")
                    _ = self.model(**inputs)
                if layer_activations:
                    hidden = layer_activations[0]
                    features = self.sae.encode(hidden)
                    avg_features = features.mean(dim=1).squeeze().detach().cpu().numpy()
                    feature_vectors.append(avg_features)
        finally:
            hook.remove()
            print("[GemmaSteering] Activation capture hook removed")
        
        if not feature_vectors:
            return None
        
        return np.mean(feature_vectors, axis=0)
    
    def _build_worldview_prompts(self, profile: Dict[str, Any], claim_text: str) -> List[str]:
        """Construct worldview-specific prompts using claim context."""
        worldview_name = profile.get('display_name', profile.get('worldview_id', 'Worldview'))
        trimmed_claim = claim_text.strip()
        
        prompts = [
            f"From a {worldview_name} perspective, analyze the claim: {trimmed_claim}",
            f"As a thinker within the {worldview_name} worldview, respond to the claim: {trimmed_claim}",
            f"The {worldview_name} worldview explains the claim: {trimmed_claim}",
        ]
        
        core_values = profile.get('core_values', [])[:2]
        for value in core_values:
            value_name = value.get('name', 'core value')
            prompts.append(
                f"{worldview_name} reasoning, emphasizing {value_name}, about the claim: {trimmed_claim}"
            )
        
        principles = profile.get('assumed_principles', [])[:1]
        for principle in principles:
            principle_name = principle.get('name', 'principle')
            prompts.append(
                f"Guided by the {worldview_name} principle of {principle_name}, interpret the claim: {trimmed_claim}"
            )
        
        return prompts
    
    def _build_neutral_prompts(self, claim_text: str) -> List[str]:
        """Construct neutral prompts for baseline comparison."""
        trimmed_claim = claim_text.strip()
        return [
            f"Provide an objective analysis of the claim: {trimmed_claim}",
            f"Discuss the claim without ideological perspective: {trimmed_claim}",
            f"Summarize the claim neutrally: {trimmed_claim}",
        ]
    
    def discover_features_for_claim(self, worldview_id: str, profile: Dict[str, Any],
                                    claim_text: str, num_features: int = 20) -> List[int]:
        """
        Discover steering features tailored to a specific claim and worldview.
        No caching - always recomputes for each call.
        
        Args:
            worldview_id: Worldview identifier
            profile: Worldview profile dictionary
            claim_text: Claim text to analyze
            num_features: Number of features to discover
        
        Returns:
            List of feature indices to amplify
        """
        if not claim_text:
            return []
        
        print(f"\n[GemmaSteering] Extracting steering features for worldview '{worldview_id}'")
        print(f"  Claim snippet: {claim_text[:80]!r}")
        
        # Build prompts
        worldview_prompts = self._build_worldview_prompts(profile, claim_text)
        neutral_prompts = self._build_neutral_prompts(claim_text)
        
        print("\n  Worldview-specific prompts:")
        for p in worldview_prompts:
            print(f"   - {p}")
        
        print("\n  Neutral prompts:")
        for p in neutral_prompts:
            print(f"   - {p}")
        
        # Capture activations
        worldview_activation = self._capture_activation_vectors(worldview_prompts)
        neutral_activation = self._capture_activation_vectors(neutral_prompts)
        
        if worldview_activation is None or neutral_activation is None:
            print(f"\n  Unable to compute activations for worldview '{worldview_id}'")
            return []
        
        # Compute difference vector
        diff_vector = worldview_activation - neutral_activation
        
        # Build per-feature info: (index, worldview_value, neutral_value, diff)
        feature_info = []
        for idx in range(len(diff_vector)):
            w_val = float(worldview_activation[idx])
            n_val = float(neutral_activation[idx])
            d_val = float(diff_vector[idx])
            feature_info.append((idx, w_val, n_val, d_val))
        
        # Sort by difference magnitude (worldview - neutral), descending
        feature_info.sort(key=lambda x: x[3], reverse=True)
        top = feature_info[:num_features]
        
        print(f"\n  Top {len(top)} steering features (sorted by worldview - neutral):")
        print("    idx    worldview      neutral        diff")
        print("    ----   ----------    ----------    ----------")
        for idx, w_val, n_val, d_val in top:
            print(f"    {idx:4d}   {w_val:10.4f}    {n_val:10.4f}    {d_val:10.4f}")
        
        # Only return the indices (what generate_with_steering needs)
        feature_indices = [idx for idx, _, _, _ in top]
        
        print(f"\n  Selected feature indices: {feature_indices}\n")
        return feature_indices
    
    def cleanup(self):
        """Clean up hooks and free memory"""
        for hook in self.active_hooks:
            try:
                hook.remove()
            except:
                pass
        self.active_hooks.clear()


# Global instance (lazy initialization)
_steering_manager: Optional[GemmaSteeringManager] = None
_steering_manager_hf_token: Optional[str] = None
_steering_manager_sae_layer: Optional[int] = None
_steering_manager_hook_layer: Optional[int] = None

def get_steering_manager(
    hf_token: str = None,
    sae_layer_index: int = 6,
    hook_layer_index: Optional[int] = None,
) -> GemmaSteeringManager:
    """
    Get or create global steering manager instance.
    
    Note: The steering manager is a singleton - once created, it's reused.
    This is memory-efficient since the model only loads once.
    """
    global _steering_manager, _steering_manager_hf_token
    global _steering_manager_sae_layer, _steering_manager_hook_layer

    # Normalize hook layer default
    effective_hook_layer = hook_layer_index if hook_layer_index is not None else sae_layer_index
    
    # If no manager exists, create one
    if _steering_manager is None:
        print(" Creating new GemmaSteeringManager instance...")
        _steering_manager = GemmaSteeringManager(
            hf_token=hf_token,
            sae_layer_index=sae_layer_index,
            hook_layer_index=effective_hook_layer,
        )
        _steering_manager_hf_token = hf_token
        _steering_manager_sae_layer = sae_layer_index
        _steering_manager_hook_layer = effective_hook_layer
    # If token or layer configuration changed, recreate
    elif (
        (hf_token and hf_token != _steering_manager_hf_token)
        or sae_layer_index != _steering_manager_sae_layer
        or effective_hook_layer != _steering_manager_hook_layer
    ):
        print(
            " Recreating GemmaSteeringManager with new configuration... "
            f"(token_changed={hf_token != _steering_manager_hf_token}, "
            f"sae_layer={sae_layer_index}, hook_layer={effective_hook_layer})"
        )
        _steering_manager.cleanup()
        _steering_manager = GemmaSteeringManager(
            hf_token=hf_token,
            sae_layer_index=sae_layer_index,
            hook_layer_index=effective_hook_layer,
        )
        _steering_manager_hf_token = hf_token
        _steering_manager_sae_layer = sae_layer_index
        _steering_manager_hook_layer = effective_hook_layer
    else:
        print(
            "  Reusing existing GemmaSteeringManager instance "
            f"(sae_layer={_steering_manager_sae_layer}, "
            f"hook_layer={_steering_manager_hook_layer})"
        )
    
    return _steering_manager

