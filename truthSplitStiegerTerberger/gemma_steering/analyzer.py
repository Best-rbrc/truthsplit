"""
Gemma Worldview Analyzer

High-level interface for analyzing claims from different worldview perspectives
using Gemma-2B with dynamic SAE steering.
"""

from typing import Dict, List, Any, Optional
from pathlib import Path
import sys

# Add parent directory for imports
sys.path.append(str(Path(__file__).parent.parent))

from structured_knowledge_layer.profile_loader import ProfileLoader
from .steering_manager import get_steering_manager


class GemmaWorldviewAnalyzer:
    """
    Analyzes claims from worldview perspectives using Gemma-2B steering.
    Uses dynamic feature discovery and improved prompting.

    The SAE and hook layers are configurable so that users can experiment
    with different internal layers of Gemma for steering.
    """
    
    def __init__(
        self,
        profiles_dir: str = None,
        sae_layer_index: int = 6,
        hook_layer_index: Optional[int] = None,
    ):
        """
        Initialize analyzer.
        
        Args:
            profiles_dir: Directory containing worldview profile JSON files.
                         If None, uses default location.
            sae_layer_index: Layer index where the SAE is loaded / features discovered.
            hook_layer_index: Layer index where the steering hook is actually applied.
                              If None, defaults to sae_layer_index.
        """
        if profiles_dir is None:
            # Default to standard profiles directory
            base_path = Path(__file__).parent.parent
            profiles_dir = str(base_path / "structured_knowledge_layer" / "profiles" / "json")
        
        self.profile_loader = ProfileLoader(profiles_dir)
        self.steering_manager = None
        self.sae_layer_index = sae_layer_index
        self.hook_layer_index = hook_layer_index if hook_layer_index is not None else sae_layer_index
    
    def _get_steering_manager(self):
        """Get or initialize steering manager"""
        if self.steering_manager is None:
            import os
            hf_token = os.getenv("HUGGING_FACE_KEY")
            self.steering_manager = get_steering_manager(
                hf_token=hf_token,
                sae_layer_index=self.sae_layer_index,
                hook_layer_index=self.hook_layer_index,
            )
        return self.steering_manager
    
    def analyze_claim(
        self,
        claim_text: str,
        worldview_id: str,
        amplification: float = 1.8,
        num_features: int = 20,
        max_new_tokens: int = 250,
        include_baseline: bool = True,
    ) -> Dict[str, Any]:
        """
        Analyze a claim from a specific worldview perspective.
        
        Args:
            claim_text: The claim to analyze
            worldview_id: Worldview identifier (e.g., 'libertarian', 'eco_justice')
            amplification: Steering amplification factor (default 1.8)
            num_features: Number of steering features to discover (default 20)
            max_new_tokens: Maximum tokens to generate (default 250)
            include_baseline: Whether to include baseline (unsteered) analysis
        
        Returns:
            Dictionary with:
            - 'worldview_id': Worldview identifier
            - 'claim': Claim text
            - 'baseline': Baseline analysis (if include_baseline=True)
            - 'steered': Steered analysis
            - 'feature_indices': List of feature indices used
            - 'amplification': Amplification factor used
        """
        # Get profile
        profile = self.profile_loader.get_profile(worldview_id)
        if not profile:
            available = self.profile_loader.list_profiles()
            raise ValueError(
                f"Unknown worldview_id '{worldview_id}'. "
                f"Available profiles: {', '.join(available)}"
            )
        
        display_name = profile.get("display_name", worldview_id)
        
        # Get steering manager
        steering_manager = self._get_steering_manager()
        
        # Discover features dynamically
        feature_indices = steering_manager.discover_features_for_claim(
            worldview_id=worldview_id,
            profile=profile,
            claim_text=claim_text,
            num_features=num_features,
        )
        
        # Build very simple, direct prompt (like gemmaLoad.py format)
        # Single sentence, direct question - works better for Gemma-2B
        prompt = (
            f"As a {display_name}, do you support or oppose this claim: \"{claim_text}\"? "
            f"Explain why."
        )
        
        result = {
            'worldview_id': worldview_id,
            'worldview_name': display_name,
            'claim': claim_text,
            'feature_indices': feature_indices,
            'amplification': amplification,
        }
        
        # Generate baseline if requested
        if include_baseline:
            print(f"\n[Generating baseline analysis...]")
            baseline = steering_manager.generate_without_steering(
                prompt=prompt,
                max_new_tokens=max_new_tokens,
            )
            result['baseline'] = baseline
            print(f"\n--- Baseline Analysis ---")
            print(baseline)
            print(f"--- End Baseline ---\n")
        
        # Generate steered analysis
        if feature_indices:
            # Store the actual amplification being used
            actual_amp = amplification
            print(f"\n[Generating steered analysis (amplification: {actual_amp:.2f}x)...]")
            steered = steering_manager.generate_with_steering(
                prompt=prompt,
                feature_indices=feature_indices,
                amplification=actual_amp,
                max_new_tokens=max_new_tokens,
            )
            result['steered'] = steered
            # Update stored amplification to ensure it matches what was used
            result['amplification'] = actual_amp
            print(f"\n--- Steered Analysis (amplification: {actual_amp:.2f}x) ---")
            print(steered)
            print(f"--- End Steered Analysis ---\n")
        else:
            result['steered'] = 'No features discovered for steering'
            result['warning'] = 'No steering features discovered'
            print(f"\n[WARNING] No steering features discovered for {worldview_id}")
        
        return result
    
    def analyze_multiple_claims(
        self,
        claims: List[str],
        worldview_ids: List[str],
        amplification: float = 1.8,
        worldview_amplifications: Dict[str, float] = None,
        num_features: int = 20,
        max_new_tokens: int = 250,
        include_baseline: bool = False,
    ) -> Dict[str, Any]:
        """
        Analyze multiple claims from multiple worldview perspectives.
        
        Args:
            claims: List of claim texts
            worldview_ids: List of worldview identifiers
            amplification: Default steering amplification factor (used if worldview_amplifications not provided)
            worldview_amplifications: Optional dict mapping worldview_id -> amplification value
            num_features: Number of steering features to discover
            max_new_tokens: Maximum tokens to generate
            include_baseline: Whether to include baseline analyses
        
        Returns:
            Dictionary with worldview_analyses key containing nested structure:
            {
                'worldview_id': {
                    'claim_index': {
                        'baseline': ...,
                        'steered': ...,
                        ...
                    }
                }
            }
        """
        results = {
            'worldview_analyses': {},
            'claims': claims,
            'worldview_ids': worldview_ids,
        }
        
        for worldview_id in worldview_ids:
            worldview_results = {}
            
            # Use per-worldview amplification if provided, otherwise use default
            worldview_amp = worldview_amplifications.get(worldview_id, amplification) if worldview_amplifications else amplification
            
            print(f"\n{'='*80}")
            print(f"Processing worldview: {worldview_id} (amplification: {worldview_amp:.2f})")
            print(f"{'='*80}")
            
            for claim_idx, claim_text in enumerate(claims):
                print(f"\n--- Claim {claim_idx + 1}/{len(claims)}: {claim_text[:60]}... ---")
                analysis = self.analyze_claim(
                    claim_text=claim_text,
                    worldview_id=worldview_id,
                    amplification=worldview_amp,
                    num_features=num_features,
                    max_new_tokens=max_new_tokens,
                    include_baseline=include_baseline,
                )
                worldview_results[claim_idx] = analysis
                
                # Print discovered features for this claim
                if analysis.get('feature_indices'):
                    features = analysis['feature_indices']
                    actual_amplification = analysis.get('amplification', worldview_amp)
                    print(f"\n✓ Discovered {len(features)} steering features for {worldview_id}:")
                    print(f"  Feature indices: {features[:10]}{'...' if len(features) > 10 else ''}")
                    print(f"  Amplification used: {actual_amplification:.2f}x")
            
            print(f"\n{'='*80}")
            print(f"Completed worldview: {worldview_id}")
            print(f"{'='*80}\n")
            
            results['worldview_analyses'][worldview_id] = worldview_results
        
        return results

