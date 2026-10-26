"""Simple JSON result saver for NLP analysis."""

import json
from datetime import datetime
from pathlib import Path

def save_results(results, source_file):
    """Save analysis results to JSON file in results folder."""
    results_dir = Path("results")
    results_dir.mkdir(exist_ok=True)
    
    # Generate filename
    source_name = Path(source_file).stem
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = results_dir / f"{source_name}_analysis_{timestamp}.json"
    
    # Add basic metadata and save
    output_data = {
        "source_file": source_file,
        "processed_at": datetime.now().isoformat(),
        **results
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    return str(output_path)