"""
Prompt Templates - Single Source of Truth

All prompts defined here, adapted automatically for each LLM provider.
Edit prompts here once and they will be used across all providers.
"""

from typing import Dict, Any, List
import json


class PromptTemplates:
    """Central repository for all prompt templates"""
    
    # ==================== CLAIM EXTRACTION PROMPTS ====================
    
    @staticmethod
    def claim_extraction_system_prompt() -> str:
        """System prompt for claim extraction"""
        return """You are an expert in argument analysis. Analyze text to extract claims, premises, and assumptions with precise confidence scores."""
    
    @staticmethod
    def claim_extraction_user_prompt(text: str) -> str:
        """User prompt for extracting claims, premises, and assumptions from text"""
        return f"""Analyze the following text and extract:

1. **Claims**: Main argumentative statements or conclusions being made
2. **Premises**: Supporting evidence or reasons for the claims
3. **Assumptions**: Underlying unstated beliefs that the argument relies on

TEXT TO ANALYZE:
{text}

For each element, provide:
- A unique ID (C1, C2... for claims, P1, P2... for premises, A1, A2... for assumptions)
- The exact text of the statement
- A confidence score (0.0-1.0) indicating how certain you are this is a claim/premise/assumption
- For premises: which claim IDs they support
- For assumptions: which claim they support, their category (e.g., "value", "empirical", "logical"), and domain (e.g., "political", "economic", "ethical")

Respond with structured JSON containing your analysis."""
    
    @staticmethod
    def claim_extraction_schema() -> Dict[str, Any]:
        """JSON schema for claim extraction response"""
        return {
            "type": "object",
            "properties": {
                "claims": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "text": {"type": "string"},
                            "confidence": {"type": "number"},
                            "type": {"type": "string", "enum": ["claim"]},
                            "position": {"type": "integer"}
                        },
                        "required": ["id", "text", "confidence", "type", "position"],
                        "additionalProperties": False
                    }
                },
                "premises": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "text": {"type": "string"},
                            "confidence": {"type": "number"},
                            "type": {"type": "string", "enum": ["premise"]},
                            "position": {"type": "integer"},
                            "claim_ids": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["id", "text", "confidence", "type", "position", "claim_ids"],
                        "additionalProperties": False
                    }
                },
                "assumptions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "text": {"type": "string"},
                            "confidence": {"type": "number"},
                            "type": {"type": "string", "enum": ["assumption"]},
                            "claim_id": {"type": "string"},
                            "category": {"type": "string"},
                            "domain": {"type": "string"}
                        },
                        "required": ["id", "text", "confidence", "type", "claim_id", "category", "domain"],
                        "additionalProperties": False
                    }
                },
                "summary": {
                    "type": "object",
                    "properties": {
                        "total_claims": {"type": "integer"},
                        "total_premises": {"type": "integer"},
                        "total_assumptions": {"type": "integer"}
                    },
                    "required": ["total_claims", "total_premises", "total_assumptions"],
                    "additionalProperties": False
                }
            },
            "required": ["claims", "premises", "assumptions", "summary"],
            "additionalProperties": False
        }
    
    # ==================== WORLDVIEW ANALYSIS PROMPTS ====================
    
    @staticmethod
    def worldview_analysis_system_prompt() -> str:
        """System prompt for worldview analysis"""
        return """You are an expert in political philosophy and worldview analysis. Use the provided structured data to give precise, nuanced analysis of how different worldviews interpret claims. Respond with structured JSON."""
    
    @staticmethod
    def worldview_analysis_user_prompt(
        claim_text: str,
        consistency_text: str,
        worldview_name: str,
        core_values: List[Dict[str, Any]],
        definitions: Dict[str, Any],
        concepts_text: str
    ) -> str:
        """User prompt for analyzing a claim through a worldview lens"""
        
        core_values_json = json.dumps([
            {'name': v.get('name', ''), 'desc': v.get('desc', '')} 
            for v in core_values
        ], indent=2)
        
        definitions_json = json.dumps(definitions, indent=2) if definitions else 'None provided'
        
        return f"""Analyze this claim from a {worldview_name} worldview perspective using the structured data provided.

CLAIM: "{claim_text}"

{consistency_text}

WORLDVIEW PROFILE:
- Name: {worldview_name}
- Core values: {', '.join([v.get('name', '') for v in core_values])}
- Core value details: {core_values_json}
- Key definitions: {definitions_json}

LINKED CONCEPTS (from claim_linker):
{concepts_text if concepts_text else 'No specific concepts linked'}

Provide a comprehensive, detailed analysis of how {worldview_name} would interpret and respond to this claim. Your analysis should be thorough but accessible to non-experts.

1. **INTERPRETATION**: Write 2-3 sentences explaining how {worldview_name} interprets this claim based on their core values.

2. **POSITION**: Would they support, oppose, or be conditional about it? Clearly state the position and explain why, referencing the consistency scores as guidance.

3. **REASONING CHAIN**: Create a clear, step-by-step logical chain (3-5 steps) showing how {worldview_name} moves from their core values to their position:
   - Step 1: Start with 1-2 core values that are most relevant
   - Step 2-4: Show the logical progression - how those values lead to beliefs, which lead to interpretations
   - Final Step: State the conclusion/position
   Each step should be 1-2 sentences and clearly connect to the next.

4. **REASONING**: Write 3-5 sentences explaining how {worldview_name} reaches their position. Show the logical steps from their core values to their stance on this claim. Be clear and thorough.

5. **KEY ASSUMPTIONS**: List 3-5 key assumptions. For each: state the assumption (10-20 words), identify the related core value, and explain why it matters (1 sentence).

6. **DETAILED CONCERNS**: List 3-5 concerns in "detailed_concerns". For each: state the concern (1 sentence), explain why it matters (2-3 sentences), and identify the related core value.

7. **ALTERNATIVE APPROACH**: Describe a specific alternative approach that aligns with {worldview_name} values (2-3 sentences).

IMPORTANT: 
- Write in clear, accessible language
- The reasoning field must be 3-5 complete sentences
- The reasoning_chain must have 3-5 steps showing clear logical progression
- Provide all required fields in the schema

Respond with structured JSON containing your complete analysis."""
    
    @staticmethod
    def worldview_analysis_schema() -> Dict[str, Any]:
        """JSON schema for worldview analysis response"""
        return {
            "type": "object",
            "properties": {
                "interpretation": {
                    "type": "string",
                    "description": "How this worldview interprets the claim"
                },
                "position": {
                    "type": "string",
                    "enum": ["support", "oppose", "conditional"],
                    "description": "Whether the worldview supports, opposes, or is conditional about the claim"
                },
                "reasoning": {
                    "type": "string",
                    "description": "The logical path from worldview values to the position. MUST be at least 3 complete sentences showing the full reasoning process.",
                    "minLength": 150
                },
                "reasoning_chain": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "step_number": {
                                "type": "integer",
                                "description": "The step number in the logical chain (1, 2, 3, etc.)"
                            },
                            "description": {
                                "type": "string",
                                "description": "Clear description of this logical step (1-2 sentences)"
                            },
                            "connects_to": {
                                "type": "string",
                                "description": "What this step connects to: 'core_values', 'beliefs', 'interpretation', or 'conclusion'"
                            }
                        },
                        "required": ["step_number", "description", "connects_to"],
                        "additionalProperties": False
                    },
                    "description": "3-5 step logical chain from core values to final position"
                },
                "key_assumptions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "assumption": {
                                "type": "string",
                                "description": "A concise statement (10-20 words) representing a core belief"
                            },
                            "core_value": {
                                "type": "string",
                                "description": "The primary core value from this worldview that this assumption relates to"
                            },
                            "relevance": {
                                "type": "string",
                                "description": "Brief explanation (1 sentence) of why this assumption matters for this specific claim"
                            }
                        },
                        "required": ["assumption", "core_value", "relevance"],
                        "additionalProperties": False
                    },
                    "description": "3-5 key underlying assumptions with their associated core values and relevance"
                },
                "detailed_concerns": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "concern": {
                                "type": "string",
                                "description": "A specific concern this worldview has"
                            },
                            "explanation": {
                                "type": "string",
                                "description": "Why this concern matters and what specifically troubles this worldview"
                            },
                            "related_value": {
                                "type": "string",
                                "description": "Which core value this concern relates to (use empty string '' if not applicable)"
                            }
                        },
                        "required": ["concern", "explanation", "related_value"],
                        "additionalProperties": False
                    },
                    "description": "Detailed list of concerns with explanations"
                },
                "concerns": {
                    "type": "string",
                    "description": "Specific concerns or objections this worldview would raise"
                },
                "alternative_approach": {
                    "type": "string",
                    "description": "What alternative solution would this worldview prefer"
                }
            },
            "required": ["interpretation", "position", "reasoning", "reasoning_chain", "key_assumptions", "detailed_concerns", "concerns", "alternative_approach"],
            "additionalProperties": False
        }
    
    # ==================== DIVERGENCE ANALYSIS PROMPTS ====================
    
    @staticmethod
    def divergence_analysis_system_prompt() -> str:
        """System prompt for divergence analysis"""
        return """You analyze philosophical disagreements between worldviews with precision and depth."""
    
    @staticmethod
    def divergence_analysis_user_prompt(positions_text: str) -> str:
        """User prompt for analyzing divergence between worldviews"""
        return f"""Conduct a comprehensive, detailed analysis of the divergence between these worldviews. Provide thorough insights that explain not just WHAT they disagree on, but WHY and HOW fundamentally different their perspectives are.

{positions_text}

Provide a detailed JSON response with:

1. **SEVERITY**: "high" | "moderate" | "low"
   - Assess based on how fundamental and irreconcilable the disagreement is
   - "high": Core values in direct opposition, positions are mutually exclusive
   - "moderate": Different priorities or interpretations, but some common ground possible
   - "low": Minor differences, mostly agreement with some nuances

2. **SUMMARY**: Provide a concise summary (2-3 sentences maximum) that:
   - Explains WHY these worldviews disagree at a fundamental level
   - Identifies the root cause of the disagreement
   Use clear, accessible language. Be brief and to the point - avoid lengthy explanations.

3. **VALUE_CONFLICTS**: For each pair of worldviews that disagree, provide detailed value conflict analysis:
   - worldview1, worldview2: Names of the worldviews
   - value1, value2: The specific core values that are in conflict
   - conflict_type: "zero-sum" (mutually exclusive), "priority" (different ordering), or "definition" (same term, different meaning)
   - detailed_explanation: A clear, concise explanation (1-2 sentences) of why these values conflict and how this conflict manifests in their positions
   - impact: How this value conflict affects their overall disagreement (1 sentence)

4. **ASSUMPTION_CONFLICTS**: For each worldview, provide: worldview name, their assumptions (3-5), their position, why_conflicting (1-2 sentences), and root_belief (1 sentence).

5. **DISAGREEMENT_DIMENSIONS**: Identify 2-4 key philosophical or practical dimensions along which these worldviews differ:
   - dimension_name: E.g., "Individual vs Collective", "Authority vs Freedom", "Tradition vs Progress", "Market vs State"
   - wv1_position: First worldview's stance on this dimension (1-2 sentences)
   - wv2_position: Second worldview's stance on this dimension (1-2 sentences)
   - gap_size: "large", "medium", or "small" - how far apart they are
   - why_matters: Why this dimension is important for understanding their disagreement (1-2 sentences)

6. **COMMON_GROUND**: Identify any areas where these worldviews might agree or share similar concerns:
   - shared_concerns: What concerns or values do they share? (even if they disagree on solutions) - provide 2-3 specific items
   - potential_bridge_points: Are there any points where dialogue might be possible? (2-3 sentences explaining potential areas for constructive dialogue)

IMPORTANT: 
- Summary: 2-3 sentences maximum
- Value conflict explanations: 1-2 sentences
- Assumption conflict explanations: 1-2 sentences
- Generate ALL required fields
- Use clear, accessible language"""
    
    @staticmethod
    def divergence_analysis_schema() -> Dict[str, Any]:
        """JSON schema for divergence analysis response"""
        return {
            "type": "object",
            "properties": {
                "severity": {
                    "type": "string",
                    "enum": ["high", "moderate", "low"]
                },
                "explanation": {
                    "type": "string"
                },
                "value_conflicts": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "worldview1": {"type": "string"},
                            "worldview2": {"type": "string"},
                            "value1": {"type": "string"},
                            "value2": {"type": "string"},
                            "conflict_type": {
                                "type": "string",
                                "enum": ["zero-sum", "priority", "definition"],
                                "description": "Type of conflict: zero-sum (mutually exclusive), priority (different ordering), or definition (different meanings)"
                            },
                            "detailed_explanation": {
                                "type": "string",
                                "description": "Clear explanation (2-3 sentences) of why these values conflict and how this manifests"
                            },
                            "impact": {
                                "type": "string",
                                "description": "How this value conflict affects their overall disagreement (1-2 sentences)"
                            }
                        },
                        "required": ["worldview1", "worldview2", "value1", "value2", "conflict_type", "detailed_explanation", "impact"],
                        "additionalProperties": False
                    }
                },
                "assumption_conflicts": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "worldview": {"type": "string"},
                            "assumptions": {"type": "array", "items": {"type": "string"}},
                            "position": {"type": "string"},
                            "why_conflicting": {
                                "type": "string",
                                "description": "Detailed explanation (2-3 sentences) of why these assumptions lead to conflict"
                            },
                            "root_belief": {
                                "type": "string",
                                "description": "What fundamental belief underlies these assumptions"
                            }
                        },
                        "required": ["worldview", "assumptions", "position", "why_conflicting", "root_belief"],
                        "additionalProperties": False
                    }
                },
                "disagreement_dimensions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "dimension_name": {
                                "type": "string",
                                "description": "Name of the dimension (e.g., 'Individual vs Collective')"
                            },
                            "wv1_position": {
                                "type": "string",
                                "description": "First worldview's stance (1-2 sentences)"
                            },
                            "wv2_position": {
                                "type": "string",
                                "description": "Second worldview's stance (1-2 sentences)"
                            },
                            "gap_size": {
                                "type": "string",
                                "enum": ["large", "medium", "small"]
                            },
                            "why_matters": {
                                "type": "string",
                                "description": "Why this dimension matters for understanding their disagreement (1-2 sentences)"
                            }
                        },
                        "required": ["dimension_name", "wv1_position", "wv2_position", "gap_size", "why_matters"],
                        "additionalProperties": False
                    }
                },
                "common_ground": {
                    "type": "object",
                    "properties": {
                        "shared_concerns": {
                            "type": "string",
                            "description": "What concerns or values they share (even if they disagree on solutions)"
                        },
                        "potential_bridge_points": {
                            "type": "string",
                            "description": "Points where dialogue might be possible (1-2 sentences)"
                        }
                    },
                    "required": ["shared_concerns", "potential_bridge_points"],
                    "additionalProperties": False
                }
            },
            "required": ["severity", "explanation", "value_conflicts", "assumption_conflicts", "disagreement_dimensions", "common_ground"],
            "additionalProperties": False
        }
    
    # ==================== CONVERGENCE ANALYSIS PROMPTS ====================
    
    @staticmethod
    def convergence_analysis_system_prompt() -> str:
        """System prompt for convergence/divergence analysis"""
        return """You are an expert in comparative reasoning analysis. Your task is to identify where different worldviews' reasoning paths converge (agree) and diverge (disagree) at each step of their logical progression."""
    
    @staticmethod
    def convergence_analysis_user_prompt(claim_text: str, worldview_reasoning_data: str) -> str:
        """User prompt for analyzing convergence/divergence in reasoning chains"""
        return f"""Analyze how different worldviews reason about this claim, identifying exactly WHERE and WHY their reasoning converges or diverges at each step.

CLAIM: "{claim_text}"

WORLDVIEW REASONING CHAINS:
{worldview_reasoning_data}

For EACH STEP in the reasoning process (typically 4 steps: Core Values → Beliefs → Interpretation → Conclusion), identify:

1. **CONVERGENCE TYPE**: Does this step show "convergent", "partial", or "divergent" reasoning?
   - "convergent": Worldviews agree and reach similar conclusions at this step
   - "partial": Some overlap or shared concerns, but different interpretations or emphasis
   - "divergent": Worldviews completely disagree or take different approaches

2. **EXPLANATION**: WHY do they converge or diverge at this step? What's the fundamental reason?

3. **WORLDVIEW POSITIONS**: For each worldview, provide its worldview_id and its specific position/reasoning at this step as an array of objects

4. **SHARED ASPECT** (if partial): What do they agree on or share?

5. **DIVERGENT ASPECT** (if partial or divergent): What specifically differs?

Additionally, identify:
- **PRIMARY DIVERGENCE POINT**: Which step number (1-4) is where they FIRST fundamentally split?
- **KEY INSIGHT**: One clear sentence summarizing the core pattern of convergence/divergence

Be precise and analytical. The goal is to help users understand exactly where and why worldviews' reasoning paths separate or align.

Respond with structured JSON containing your analysis."""
    
    @staticmethod
    def convergence_analysis_schema() -> Dict[str, Any]:
        """JSON schema for convergence analysis response"""
        return {
            "type": "object",
            "properties": {
                "steps": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "step_number": {
                                "type": "integer",
                                "description": "The step number (1-4) in the reasoning chain"
                            },
                            "step_name": {
                                "type": "string",
                                "description": "Name of this step (e.g., 'Core Values', 'Beliefs', 'Interpretation', 'Conclusion')"
                            },
                            "convergence_type": {
                                "type": "string",
                                "enum": ["convergent", "partial", "divergent"],
                                "description": "Whether worldviews converge, partially overlap, or diverge at this step"
                            },
                            "explanation": {
                                "type": "string",
                                "description": "Why worldviews converge or diverge at this step (2-3 sentences)"
                            },
                            "worldview_positions": {
                                "type": "array",
                                "description": "Each worldview's specific position at this step",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "worldview_id": {
                                            "type": "string",
                                            "description": "The worldview identifier"
                                        },
                                        "position": {
                                            "type": "string",
                                            "description": "This worldview's position at this step"
                                        }
                                    },
                                    "required": ["worldview_id", "position"],
                                    "additionalProperties": False
                                }
                            },
                            "shared_aspect": {
                                "type": "string",
                                "description": "What worldviews share or agree on (if partial or convergent). Use empty string if not applicable."
                            },
                            "divergent_aspect": {
                                "type": "string",
                                "description": "What specifically differs between worldviews (if partial or divergent). Use empty string if not applicable."
                            }
                        },
                        "required": ["step_number", "step_name", "convergence_type", "explanation", "worldview_positions", "shared_aspect", "divergent_aspect"],
                        "additionalProperties": False
                    },
                    "description": "Analysis of convergence/divergence at each reasoning step"
                },
                "primary_divergence_point": {
                    "type": "integer",
                    "description": "The step number where worldviews first fundamentally diverge"
                },
                "key_insight": {
                    "type": "string",
                    "description": "One sentence summarizing the overall pattern of convergence/divergence"
                }
            },
            "required": ["steps", "primary_divergence_point", "key_insight"],
            "additionalProperties": False
        }
    
    # ==================== DISAGREEMENT CATEGORIZATION PROMPTS ====================
    
    @staticmethod
    def disagreement_categorization_system_prompt() -> str:
        """System prompt for categorizing disagreements"""
        return """You categorize philosophical disagreements concisely."""
    
    @staticmethod
    def disagreement_categorization_user_prompt(position_summary: str) -> str:
        """User prompt for categorizing types of disagreement"""
        return f"""Given these worldview positions on a claim, categorize the type of disagreement in 3-5 words:

{position_summary}

Return only the category name (e.g., "Individual vs Collective values", "Traditional vs Progressive approaches", etc.)"""
    
    # ==================== WORLDVIEW CHAT PROMPTS ====================
    
    @staticmethod
    def worldview_chat_system_prompt(worldview_profile: dict, analysis_summary: str) -> str:
        """System prompt for worldview-based chat"""
        worldview_name = worldview_profile.get('display_name', 'Unknown')
        
        # Extract core values
        core_values = worldview_profile.get('core_values', [])
        values_text = "\n".join([
            f"- {v['name']} (weight: {v['weight']}): {v['desc']}"
            for v in core_values
        ])
        
        # Extract key definitions
        definitions = worldview_profile.get('key_definitions', [])
        definitions_text = "\n".join([
            f"- {d['term']}: {d['definition']}"
            for d in definitions
        ])
        
        # Extract principles
        principles = worldview_profile.get('assumed_principles', [])
        principles_text = "\n".join([
            f"- {p['name']} (priority: {p['priority']}): {p['desc']}"
            for p in principles
        ])
        
        # Extract red lines
        red_lines = worldview_profile.get('red_lines', [])
        red_lines_text = "\n".join([f"- {rl}" for rl in red_lines])
        
        return f"""You are an AI assistant embodying the {worldview_name} worldview. Your role is to discuss the analyzed claims from this ideological perspective.

CORE VALUES:
{values_text}

KEY DEFINITIONS (how you interpret terms):
{definitions_text}

GUIDING PRINCIPLES:
{principles_text}

RED LINES (unacceptable positions):
{red_lines_text}

ANALYSIS CONTEXT:
{analysis_summary}

INSTRUCTIONS:
- Stay fully in character as a {worldview_name} thinker
- Use the core values and principles above to inform your responses
- Reference the analysis context when discussing specific claims
- Be intellectually honest and nuanced, but maintain your ideological lens
- Engage with questions about the claims, their premises, and reasoning
- You can discuss related topics that connect to the claims, but always maintain your worldview perspective
- Be respectful but firm in defending your worldview's position
- Acknowledge valid concerns while explaining why your worldview prioritizes certain values

Remember: You are not a neutral AI - you genuinely hold and advocate for {worldview_name} principles."""
