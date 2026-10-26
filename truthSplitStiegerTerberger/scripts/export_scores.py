import json, glob, pandas as pd
from pathlib import Path

# Get the script's directory and build absolute paths
script_dir = Path(__file__).parent.parent
profiles_dir = script_dir / "structured_knowledge_layer" / "profiles" / "json"
output_dir = script_dir / "structured_knowledge_layer" / "vectors"

rows = []
for path in glob.glob(str(profiles_dir / "*.json")):
    with open(path) as f:
        data = json.load(f)
    row = {"worldview_id": data["worldview_id"]}
    row.update(data["extensions"]["factor_scores"])
    rows.append(row)

df = pd.DataFrame(rows)
output_path = output_dir / "factor_scores.csv"
df.to_csv(output_path, index=False)
print(f"✅ Exported factor scores to: {output_path}")