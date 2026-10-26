"""
Fresh NLP Layer - Clean and Simple
"""
from .simple_extractor import extractor
from .result_writer import save_results

def extract(text: str, use_openai: bool = False, llm_model: str = "gpt-4o-mini", llm_provider: str = "openai") -> dict:
    """Extract claims, premises and assumptions from text."""
    if use_openai:
        try:
            from .llm_extractor import LLMExtractor
            print(f"🤖 Using LLM provider: {llm_provider} ({llm_model})")
            extractor_instance = LLMExtractor(model=llm_model, provider=llm_provider)
            return extractor_instance.extract(text)
        except ImportError as e:
            raise ValueError(f"LLM provider package not installed: {e}")
        except Exception as e:
            error_msg = f"{llm_provider.capitalize()} model '{llm_model}' is currently not available. Please try a different model or provider."
            print(f"❌ {error_msg}")
            raise Exception(error_msg + f" Error: {str(e)}")
    
    return extractor.extract(text)

def extract_and_save(text: str, source_file: str, use_openai: bool = False, llm_model: str = "gpt-4o-mini", llm_provider: str = "openai") -> tuple:
    """Extract and save results to JSON file."""
    results = extract(text, use_openai=use_openai, llm_model=llm_model, llm_provider=llm_provider)
    output_path = save_results(results, source_file)
    return results, output_path

__all__ = ['extract', 'extract_and_save']