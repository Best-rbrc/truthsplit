# TruthSplit – Comparative Reasoning Platform

📄 **Published at ACL 2026 (System Demonstrations Track)**
*TruthSplit: Revealing Conditional Validity in Arguments Through Multi-Worldview Comparative Reasoning*
[aclanthology.org/2026.acl-demo.64](https://aclanthology.org/2026.acl-demo.64/) · [arXiv](https://arxiv.org/abs/2606.09251)

Developed at the University of St. Gallen (HSG). See the paper for the full author list.

## Overview

TruthSplit is an AI-powered comparative reasoning platform that reveals how different ideological worldviews interpret the same arguments differently. Instead of determining "right" or "wrong," the system highlights **conditional validity** – showing how conclusions make sense given specific premises and conceptual frameworks.

### Core Question

*Why do people arrive at radically different conclusions from the same facts?*

### Answer

Disagreement often stems not from flawed reasoning, but from:
- Different underlying assumptions
- Distinct value priorities
- Alternative conceptual frameworks
- Varying definitions of key terms

## Key Features

- **Multi-Modal Analysis**: Supports both local NLP models and cloud-based LLM reasoning
- **Worldview Comparison**: Analyze arguments through multiple ideological lenses simultaneously
- **Gemma Steering**: Advanced activation steering for worldview-specific reasoning (optional)
- **Interactive Frontend**: Modern React-based web interface with rich visualizations
- **RESTful API**: Complete backend API for programmatic access
- **Docker Deployment**: Production-ready containerized deployment
- **News Integration**: Analyze real-world news articles from NewsAPI

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Plotly.js** and **Recharts** for visualizations
- **Three.js** for 3D visualizations

### Backend
- **Python 3.12**
- **Flask** REST API server
- **OpenRouter** unified LLM API (supports Claude, GPT, Gemini, etc.)
- **Transformers** (HuggingFace) for local NLP models
- **Sentence-BERT** for semantic matching
- **BART-large-MNLI** for consistency testing
- **Gemma-2B** with SAE steering (optional)

### Infrastructure
- **Docker** and **Docker Compose** for containerization
- **Nginx** for frontend serving
- **JSON** for data persistence

## Project Structure

```
BachelorProjektStiegerTerberger/
├── truthSplitStiegerTerberger/     # Main project code
│   ├── api_server.py               # Flask REST API server
│   ├── comparative_reasoning/     # Core analysis pipeline
│   │   ├── pipeline.py             # Main orchestration
│   │   ├── consistency_tester.py   # NLI-based consistency testing
│   │   ├── claim_linker.py         # Semantic concept linking
│   │   ├── llm_reasoning_engine.py  # LLM worldview analysis
│   │   └── local_divergence_analyzer.py  # Local divergence analysis
│   ├── nlp/                        # NLP extraction layer
│   │   └── nlp_layer/               # Claim/premise extraction
│   ├── llm/                        # LLM provider abstraction
│   │   ├── provider_factory.py    # Provider factory
│   │   ├── openrouter_provider.py  # OpenRouter integration
│   │   └── prompt_templates.py     # LLM prompt templates
│   ├── gemma_steering/              # Gemma activation steering
│   │   ├── steering_manager.py     # SAE-based steering
│   │   └── analyzer.py             # Worldview analyzer
│   ├── structured_knowledge_layer/  # Worldview profiles
│   │   ├── profile_loader.py       # Profile management
│   │   ├── profiles/json/          # JSON worldview definitions
│   │   └── vectors/                # Factor scores CSV
│   ├── frontend/                    # React frontend application
│   │   ├── src/
│   │   │   ├── pages/              # Main pages (Landing, Analyze, Results)
│   │   │   ├── components/         # React components
│   │   │   ├── services/            # API service layer
│   │   │   └── utils/               # Utility functions
│   │   ├── Dockerfile              # Frontend container
│   │   └── nginx.conf              # Nginx configuration
│   ├── data/                        # Data storage
│   │   └── saved_analyses.json      # Persistent analysis storage
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile                  # Backend container
├── docker-compose.yml              # Docker Compose configuration
├── README.md                       # This file
└── TruthSplit_Technical_Documentation.md  # Detailed technical docs
```

## Quick Start

### Prerequisites

- **Python 3.12+**
- **Node.js 20+** and npm
- **Docker** and **Docker Compose** (for containerized deployment)
- **API Keys** (optional but recommended):
  - `OPENROUTER_API_KEY` - For LLM access via OpenRouter
  - `HUGGING_FACE_KEY` - For Gemma steering (optional)
  - `NEWS_API_KEY` - For news article analysis (optional)

### Local Development Setup

#### 1. Backend Setup

```bash
# Navigate to project directory
cd truthSplitStiegerTerberger

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
OPENROUTER_API_KEY=your-openrouter-key-here
HUGGING_FACE_KEY=your-hf-key-here  # Optional
NEWS_API_KEY=your-newsapi-key-here  # Optional
EOF

# Run API server
python api_server.py
```

The API will be available at `http://localhost:5001`

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:8080`

### Docker Deployment

```bash
# From project root
docker-compose up --build
```

This will start:
- Backend API at `http://localhost:5001`
- Frontend at `http://localhost:13998`

## API Endpoints

### Core Endpoints

- `GET /api/health` - Health check
- `POST /api/extract-claims` - Extract claims from text
- `POST /api/analyze` - Run full worldview analysis
- `GET /api/worldviews` - Get available worldviews with factor scores
- `POST /api/analyze-convergence` - Analyze convergence/divergence
- `POST /api/chat` - Chat with worldview-embodied LLM
- `GET /api/news` - Fetch news articles

### Analysis Storage

- `GET /api/analyses/<slug>` - Load saved analysis
- `PUT /api/analyses/<slug>` - Save analysis
- `DELETE /api/analyses/<slug>` - Delete analysis

See `TruthSplit_Technical_Documentation.md` for detailed API documentation.

## Available Worldviews

The system includes 6 predefined worldview profiles:

1. **Libertarian** - Individual freedom, minimal government
2. **Religious-Conservative** - Traditional values, moral order
3. **Eco-Justice** - Environmental sustainability, social equity
4. **Populist-MAGA** - National sovereignty, traditional culture
5. **Communist** - Collective ownership, class struggle
6. **Neo-Reactionary** - Traditional hierarchy, anti-modernism

Each worldview is defined by:
- Core values (weighted)
- Key definitions
- Assumed principles
- Decision frameworks
- Factor scores (for visualization)

## Usage Examples

### Basic Analysis

1. Navigate to the web interface at `http://localhost:8080`
2. Enter or upload text containing controversial claims
3. Select worldviews to compare (up to 3)
4. Choose analysis method:
   - **LLM-based** (OpenRouter) - High quality, requires API key
   - **Gemma Steering** - Activation steering, requires HF token
   - **Local NLI** - Privacy-preserving, no API calls
5. View detailed results with divergence analysis

### Programmatic Access

```python
import requests

# Extract claims
response = requests.post('http://localhost:5001/api/extract-claims', json={
    'text': 'Governments should implement universal healthcare.',
    'use_openai': True
})
claims = response.json()

# Run analysis
response = requests.post('http://localhost:5001/api/analyze', json={
    'text': 'Governments should implement universal healthcare.',
    'selected_worldviews': ['libertarian', 'eco-justice'],
    'use_openai': True
})
analysis = response.json()
```

## Configuration

### Environment Variables

Create a `.env` file in `truthSplitStiegerTerberger/`:

```bash
# Required for LLM analysis
OPENROUTER_API_KEY=sk-or-v1-...

# Optional: For Gemma steering
HUGGING_FACE_KEY=hf_...

# Optional: For news analysis
NEWS_API_KEY=...

# Optional: For analysis deletion
ANALYSIS_DELETE_SECRET=your-secret-here
```

### LLM Provider Configuration

The system uses **OpenRouter** as a unified API for multiple LLM providers:

- **Claude**: `anthropic/claude-opus-4.5`, `anthropic/claude-sonnet-4.5`
- **GPT**: `openai/gpt-4o`, `openai/gpt-4o-mini`
- **Gemini**: `google/gemini-2.5-pro`, `google/gemini-2.5-flash`
- **Llama**: `meta-llama/llama-2-70b`
- And many more via OpenRouter

## Development

### Running Tests

```bash
# From project root
pytest truthSplitStiegerTerberger/tests/
```

### Code Structure

- **Backend**: Python with Flask, follows RESTful API patterns
- **Frontend**: React with TypeScript, component-based architecture
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS with shadcn/ui components

## Documentation

- **Technical Documentation**: See `TruthSplit_Technical_Documentation.md` for comprehensive technical details
- **API Documentation**: Detailed endpoint documentation in technical docs
- **Architecture**: System architecture and data flow diagrams in technical docs

## License

This project was developed as a bachelor's project at the University of St. Gallen (HSG) and published at ACL 2026.

## Authors

- Stieger
- Terberger

## Acknowledgments

Built with:
- OpenRouter for unified LLM access
- HuggingFace Transformers for local NLP
- React and shadcn/ui for the frontend
- Flask for the backend API
