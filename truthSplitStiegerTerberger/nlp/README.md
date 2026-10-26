# NLP Layer - Argument Mining System

Extract claims, premises, and assumptions from text using local ML models or OpenAI API.

## 🎯 What It Does

- **Claims**: Main arguments (e.g., "We should implement AI regulation")
- **Premises**: Supporting evidence (e.g., "AI poses risks to society") 
- **Assumptions**: Underlying beliefs (e.g., "Regulation can prevent harm")

## � Quick Start

### Install & Run
```bash
pip install -r requirements.txt

# Analyze example text
python main.py --example ai

# Analyze your file
python main.py your_file.txt --save

# Interactive mode
python main.py --interactive
```

### OpenAI Integration (Optional)
```bash
# 1. Get API key from https://platform.openai.com/api-keys
# 2. Add to .env file:
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# 3. Use OpenAI for better analysis
python main.py --openai --example ai --save
```

## 📊 Output

Results saved as JSON in `results/` folder:
```json
{
  "claims": [{"id": "C1", "text": "...", "confidence": 0.9}],
  "premises": [{"id": "P1", "text": "...", "claim_ids": ["C1"]}],
  "assumptions": [{"id": "A1", "text": "...", "claim_id": "C1"}]
}
```

## 🛠 Commands

```bash
python main.py [FILE] [OPTIONS]

--example ai/debate    # Use built-in examples
--interactive         # Enter text manually  
--openai             # Use OpenAI (better quality)
--save               # Save results to JSON
--help               # Show all options
```

## ⚙️ How It Works

### Local Models (Offline)
The system uses three specialized ML models that run entirely on your machine:

1. **Claim Classifier** 
   - Pre-trained transformer model that identifies argumentative claims
   - Looks for linguistic patterns like "should", "must", "therefore"
   - Boosts confidence for modal verbs and conclusion markers
   - Filters out short sentences and transitional phrases

2. **Premise Extractor**
   - Rule-based system that finds supporting evidence
   - Analyzes ±3 sentences around each claim for context
   - Scores premises based on evidence markers (citations, numbers, "because", "studies show")
   - Links premises to their supported claims

3. **Assumption Retriever**
   - Uses sentence-transformer embeddings to match text against curated assumption bank
   - Database of 100+ common assumptions across domains (technology, governance, ethics)
   - Semantic similarity matching to find relevant unstated beliefs
   - Categories assumptions as normative, causal, empirical, or definitional

### Processing Pipeline
```
Text Input → Sentence Split → Claim Classification → Premise Extraction → Assumption Matching → JSON Output
```

### First Run Setup
- Downloads ~500MB of models automatically (Hugging Face transformers)
- Models cached locally for offline use
- No internet required after initial setup

## 🤖 Local vs OpenAI

| Feature | Local Models | OpenAI API |
|---------|--------------|------------|
| **Cost** | Free | ~$0.001 per analysis |
| **Privacy** | Complete | Sent to OpenAI |
| **Quality** | Good | Excellent |
| **Speed** | Fast (2-5s) | Moderate (5-15s) |
| **Offline** | ✅ Yes | ❌ No |

## � Python API

```python
from nlp_layer import extract, extract_and_save

# Basic analysis
results = extract("Your text here")

# With OpenAI
results = extract("Your text here", use_openai=True)

# Save to file
results, path = extract_and_save("Your text", "filename")
```

## 🚨 Troubleshooting

- **OpenAI not working**: Check API key in `.env` file, run `python test_openai.py`
- **Missing packages**: Run `pip install -r requirements.txt`
- **Memory issues**: Use `--openai` flag instead of local models

---

**Happy Argument Mining! 🎯**