# TruthSplit Analysis Platform
## Comprehensive Technical Documentation

**Project**: Bachelor Projekt - TruthSplit  
**Authors**: Stieger & Terberger  
**University**: HSG (University of St. Gallen)  
**Date**: December 2024  
**Version**: 2.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [API Reference](#api-reference)
5. [Core Components](#core-components)
6. [Analysis Pipeline](#analysis-pipeline)
7. [Frontend Architecture](#frontend-architecture)
8. [Backend Architecture](#backend-architecture)
9. [LLM Integration](#llm-integration)
10. [Gemma Steering System](#gemma-steering-system)
11. [Worldview Profiles](#worldview-profiles)
12. [Deployment](#deployment)
13. [Performance & Scalability](#performance--scalability)
14. [Security Considerations](#security-considerations)
15. [Development Guide](#development-guide)

---

## 1. Executive Summary

### Project Vision

TruthSplit is an AI-powered comparative reasoning platform that reveals how different ideological worldviews interpret the same arguments differently. Instead of determining "right" or "wrong," the system highlights **conditional validity** – showing how conclusions make sense given specific premises and conceptual frameworks.

### Key Innovation

TruthSplit combines:
1. **Multi-modal NLP** - Local models for privacy, cloud LLMs for quality
2. **Structured Knowledge** - JSON-encoded worldview profiles with factor scores
3. **Advanced Reasoning** - LLM-enhanced analysis with optional activation steering
4. **Interactive Visualization** - Rich web interface with 3D visualizations and interactive charts
5. **RESTful API** - Complete programmatic access to all features

### System Capabilities

- Extract claims, premises, and assumptions from text
- Test logical consistency using NLI models
- Link claims to worldview-specific concepts
- Generate worldview-specific reasoning using LLMs
- Compare reasoning paths across multiple worldviews
- Identify divergence points and disagreement patterns
- Visualize results in multiple formats (3D space, force graphs, heatmaps)
- Chat with worldview-embodied LLMs
- Analyze news articles from NewsAPI

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React + TypeScript)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Landing    │  │   Analyze    │  │   Results    │         │
│  │    Page      │  │    Page      │  │    Page      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                │
│                            │                                    │
│                    ┌───────▼────────┐                           │
│                    │  API Client     │                           │
│                    │  (TanStack Q)  │                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Layer (Flask API)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Flask REST API Server                       │  │
│  │  • /api/extract-claims                                   │  │
│  │  • /api/analyze                                          │  │
│  │  • /api/worldviews                                      │  │
│  │  • /api/chat                                            │  │
│  │  • /api/news                                            │  │
│  │  • /api/analyses/<slug>                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Pipeline   │  │  LLM Engine  │  │ Gemma Steering│       │
│  │ Orchestrator │  │              │  │   (Optional)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   NLP Layer      │ │  Consistency     │ │  Worldview       │
│                  │ │  Testing Layer   │ │  Knowledge Base  │
│ • Local Models   │ │                  │ │                  │
│ • OpenRouter API │ │ • BART-MNLI      │ │ • JSON Profiles  │
│ • Claim Extract  │ │ • 3-Layer Test   │ │ • Factor Scores  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Data Flow

1. **User Input**: Text entered via web interface or API
2. **Claim Extraction**: NLP layer identifies claims, premises, assumptions
   - Option A: Local BART-based extraction (privacy-preserving)
   - Option B: OpenRouter LLM extraction (higher quality)
3. **Consistency Testing**: NLI model tests logical consistency
   - Layer 1: Premise → Claim logic
   - Layer 2: Claim → Worldview principles
   - Layer 3: Cross-worldview agreement
4. **Concept Linking**: Semantic matching links claims to worldview concepts
5. **Worldview Analysis**: 
   - Option A: LLM-based reasoning (OpenRouter)
   - Option B: Gemma steering (activation-based)
6. **Comparison**: System identifies divergence points
   - Option A: LLM-based divergence analysis
   - Option B: Local NLI-based divergence analysis
7. **Visualization**: Results displayed in interactive web interface

---

## 3. Technology Stack

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI framework |
| **Language** | TypeScript | 5.8.3 | Type safety |
| **Build Tool** | Vite | 7.2.2 | Fast build and dev server |
| **Routing** | React Router | 6.30.1 | Client-side routing |
| **State Management** | TanStack Query | 5.83.0 | Server state management |
| **UI Components** | shadcn/ui | Latest | Accessible component library |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **Visualizations** | Plotly.js | 3.3.0 | Interactive charts |
| **Visualizations** | Recharts | 2.15.4 | React chart library |
| **3D Graphics** | Three.js | 0.168.0 | 3D visualizations |
| **3D React** | @react-three/fiber | 8.18.0 | React renderer for Three.js |
| **PDF** | pdfjs-dist | 4.0.379 | PDF rendering |

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Language** | Python | 3.12 | Core language |
| **Web Framework** | Flask | 3.0.0 | REST API server |
| **CORS** | flask-cors | 4.0.0 | Cross-origin resource sharing |
| **LLM Provider** | OpenRouter | Latest | Unified LLM API |
| **NLP** | Transformers | 4.44.0+ | HuggingFace models |
| **PyTorch** | torch | 2.0.0+ | Deep learning backend |
| **Sentence Embeddings** | sentence-transformers | 2.2.0+ | Semantic similarity |
| **NLI** | BART-large-MNLI | Latest | Consistency testing |
| **Steering** | sae-lens | 3.0.0+ | Sparse autoencoder lens |
| **Data Processing** | pandas | 1.5.0+ | Data manipulation |
| **Numerical** | numpy | 1.20.0+ | Numerical operations |
| **ML** | scikit-learn | 1.3.0+ | Machine learning utilities |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Application containers |
| **Orchestration** | Docker Compose | Multi-container deployment |
| **Web Server** | Nginx | Frontend static file serving |
| **Data Storage** | JSON | Persistent analysis storage |

---

## 4. API Reference

### Base URL

- **Development**: `http://localhost:5001/api`
- **Production**: Configured via environment variables

### Authentication

Currently, API endpoints do not require authentication. API keys are used for external services (OpenRouter, NewsAPI) and are stored server-side in environment variables.

### Endpoints

#### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "TruthSplit API"
}
```

#### Extract Claims

```http
POST /api/extract-claims
```

**Request Body:**
```json
{
  "text": "Your text here",
  "use_openai": true,
  "llm_model": "gpt-4o-mini",
  "llm_provider": "openai"
}
```

**Response:**
```json
{
  "claims": [
    {
      "id": "C1",
      "text": "Claim text",
      "premises": ["Premise 1", "Premise 2"],
      "confidence": 0.92
    }
  ],
  "full_result": { /* Complete extraction result */ }
}
```

#### Analyze

```http
POST /api/analyze
```

**Request Body:**
```json
{
  "text": "Your text here",
  "selected_claim_ids": ["C1", "C2"],
  "selected_worldviews": ["libertarian", "eco-justice"],
  "use_openai": true,
  "use_openai_extraction": true,
  "use_local_divergence": false,
  "use_gemma_steering": false,
  "worldview_strengths": {
    "libertarian": 1.8,
    "eco-justice": 1.5
  },
  "llm_model": "gpt-4o-mini",
  "llm_provider": "openai",
  "sae_layer_index": 6,
  "hook_layer_index": 6
}
```

**Response:**
```json
{
  "base_analysis": { /* NLP extraction results */ },
  "llm_analysis": {
    "worldview_analyses": { /* Per-worldview analysis */ },
    "comparison_analysis": { /* Cross-worldview comparison */ },
    "divergence_analysis": { /* Divergence points */ }
  },
  "selected_claims": ["C1", "C2"],
  "selected_worldviews": ["libertarian", "eco-justice"]
}
```

#### Get Worldviews

```http
GET /api/worldviews
```

**Response:**
```json
{
  "worldviews": [
    {
      "id": "libertarian",
      "name": "Libertarian",
      "factors": {
        "individualism": 0.95,
        "collectivism": -0.95,
        ...
      }
    }
  ],
  "factor_columns": ["individualism", "collectivism", ...]
}
```

#### Analyze Convergence

```http
POST /api/analyze-convergence
```

**Request Body:**
```json
{
  "claim_id": "C1",
  "claim_text": "Claim text",
  "worldview_analyses": {
    "libertarian": { "reasoning_chain": [...] },
    "eco-justice": { "reasoning_chain": [...] }
  },
  "llm_provider": "openrouter",
  "llm_model": "anthropic/claude-opus-4.5"
}
```

**Response:**
```json
{
  "claim_id": "C1",
  "convergence_analysis": {
    "primary_divergence_point": 3,
    "reasoning_chains": [...],
    "convergence_score": 0.45
  }
}
```

#### Chat with Worldview

```http
POST /api/chat
```

**Request Body:**
```json
{
  "worldview_id": "libertarian",
  "message": "Why do you oppose government intervention?",
  "conversation_history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "analysis_context": {
    "claims": [...],
    "worldview_analyses": {...}
  },
  "llm_provider": "openrouter",
  "llm_model": "anthropic/claude-opus-4.5"
}
```

**Response:**
```json
{
  "response": "Assistant message text"
}
```

#### Get News

```http
GET /api/news?query=climate&category=politics
```

**Query Parameters:**
- `query` (optional): Search query
- `category` (optional): News category (business, technology, politics, health, science)

**Response:**
```json
{
  "articles": [
    {
      "id": "news-0-...",
      "title": "Article title",
      "description": "Article description",
      "content": "Article content",
      "url": "https://...",
      "source": "Source name",
      "publishedAt": "2024-12-01T...",
      "author": "Author name",
      "urlToImage": "https://..."
    }
  ],
  "totalResults": 20
}
```

#### Saved Analyses

**Get Analysis:**
```http
GET /api/analyses/<slug>
```

**Save Analysis:**
```http
PUT /api/analyses/<slug>
```

**Request Body:**
```json
{
  "analysis_result": { /* Transformed frontend analysis */ },
  "analysis_text": "Original text",
  "selected_worldviews": ["libertarian", "eco-justice"],
  "convergence_data": { /* Optional */ },
  "title": "Analysis title",
  "overwrite": false
}
```

**Delete Analysis:**
```http
DELETE /api/analyses/<slug>
```

**Headers:**
- `X-Delete-Secret: <secret>` or `?delete_secret=<secret>`

---

## 5. Core Components

### 5.1 NLP Layer (`nlp/nlp_layer/`)

**Purpose**: Extract argumentative structure from text

**Components**:

1. **OpenRouter Extractor** (`openai_extractor.py`)
   - Uses OpenRouter API with structured outputs
   - Supports multiple LLM providers (Claude, GPT, Gemini, etc.)
   - Extracts: Claims, Premises, Assumptions
   - Returns: JSON with confidence scores

2. **Local Extractor** (`simple_extractor.py`)
   - Uses HuggingFace Transformers
   - Zero-shot classification approach
   - Runs entirely on CPU
   - No external API calls

**Output Format**:
```json
{
  "claims": [
    {
      "id": "C1",
      "text": "Claim text",
      "confidence": 0.92,
      "type": "claim",
      "position": 0,
      "premises": [
        {"id": "P1", "text": "Premise text", "confidence": 0.88}
      ],
      "assumptions": [
        {"id": "A1", "text": "Assumption text", "confidence": 0.75}
      ]
    }
  ],
  "premises": [...],
  "assumptions": [...],
  "summary": {
    "total_claims": 3,
    "total_premises": 7,
    "total_assumptions": 5
  }
}
```

### 5.2 Consistency Testing Layer (`comparative_reasoning/consistency_tester.py`)

**Purpose**: Test logical consistency using NLI models

**Model**: `facebook/bart-large-mnli` (Always local)

**Three-Layer Testing**:

1. **Layer 1: Premise-Claim Logic**
   - Tests: Do premises logically support the claim?
   - Score: 0.0 (contradiction) to 1.0 (entailment)

2. **Layer 2: Worldview Internal Consistency**
   - Tests: Does claim fit worldview's core principles?
   - For each principle in worldview profile

3. **Layer 3: Cross-Worldview Agreement**
   - Tests: Do worldviews agree on this claim?
   - Returns: "strong agreement" to "strong disagreement"

**Technical Details**:
- **Device**: CPU (no GPU required)
- **Speed**: ~1-2 seconds per claim
- **Accuracy**: High (MNLI benchmark: 90%+)
- **Output**: Numerical scores (0.0-1.0) + interpretations

### 5.3 Claim Linker (`comparative_reasoning/claim_linker.py`)

**Purpose**: Match claims to worldview-specific concepts

**Technique**: Semantic similarity with sentence embeddings

**Process**:
1. Convert claim to embedding vector
2. Compare to all concepts in worldview profile
3. Return top-k matching concepts (k=3)
4. Include similarity scores

**Models Used**:
- Sentence-BERT embeddings (local)
- Cosine similarity for matching
- No API calls required

**Output**:
```python
{
  "worldview_links": {
    "libertarian": {
      "linked_concepts": [
        {
          "concept": {
            "name": "negative_liberty",
            "content": "Freedom from government interference"
          },
          "similarity": 0.87
        }
      ]
    }
  }
}
```

### 5.4 LLM Reasoning Engine (`comparative_reasoning/llm_reasoning_engine.py`)

**Purpose**: Generate nuanced worldview interpretations

**Provider**: OpenRouter (unified API for multiple LLMs)

**Key Features**:
- **Structured Outputs**: Uses JSON schema for reliable parsing
- **Low Temperature**: 0.3 for consistent reasoning
- **Rich Context**: Fed with consistency scores + linked concepts
- **Comparative Analysis**: Automatically compares across worldviews
- **Convergence Analysis**: Optional deep-dive into reasoning chains

**Analysis Per Claim Per Worldview**:
```python
{
  "interpretation": "How this worldview interprets the claim",
  "position": "support | oppose | conditional",
  "reasoning": "Logical path from values to position",
  "concerns": "Specific objections this worldview raises",
  "alternative_approach": "Preferred solution aligned with values",
  "confidence": 0.85,
  "consistency_data": {
    "premise_claim_consistency": 0.82,
    "worldview_internal_consistency": 0.88
  }
}
```

**Automatic Comparison**:
- Identifies divergence points
- Categorizes disagreement types
- Finds common patterns
- Assesses severity (high/moderate/low)

### 5.5 Local Divergence Analyzer (`comparative_reasoning/local_divergence_analyzer.py`)

**Purpose**: Analyze divergence using local NLI models (privacy-preserving)

**Technique**: NLI-based semantic comparison

**Process**:
1. Compare worldview positions using NLI
2. Identify contradiction vs. neutral vs. entailment
3. Calculate divergence scores
4. Categorize disagreement types

**Use Case**: When privacy is paramount and API costs should be avoided

### 5.6 Gemma Steering System (`gemma_steering/`)

**Purpose**: Activation-based steering for worldview-specific reasoning

**Components**:

1. **Steering Manager** (`steering_manager.py`)
   - Manages Gemma-2B model
   - Handles SAE (Sparse Autoencoder) loading
   - Creates steering hooks
   - Generates steered text

2. **Analyzer** (`analyzer.py`)
   - Discovers steering features for worldviews
   - Analyzes multiple claims
   - Transforms results to LLM format

**Technical Details**:
- **Model**: `google/gemma-2b`
- **SAE**: `gemma-2b-res-jb` release
- **Layer**: Configurable (default: layer 6)
- **Device**: Auto (supports MPS, CUDA, CPU)
- **Amplification**: Configurable per worldview (default: 1.8)

**Process**:
1. Build worldview-specific prompts
2. Capture activation vectors
3. Discover steering features (top-k by difference)
4. Apply steering hook during generation
5. Generate worldview-specific reasoning

**Advantages**:
- No API costs
- Complete privacy
- Fast inference
- Interpretable (feature-based)

**Limitations**:
- Requires HuggingFace token
- Requires GPU for best performance
- Model size: ~2B parameters

### 5.7 Worldview Knowledge Base (`structured_knowledge_layer/`)

**Structure**: JSON profiles for each worldview

**Profile Components**:
```json
{
  "id": "libertarian",
  "display_name": "Libertarian",
  "core_values": [
    {
      "name": "Individual Liberty",
      "weight": 0.95,
      "description": "Fundamental right to self-determination"
    }
  ],
  "definitions": {
    "freedom": "Absence of coercion by others",
    "rights": "Negative rights to non-interference"
  },
  "assumed_principles": [
    "Self-ownership is fundamental",
    "Voluntary exchange creates value"
  ],
  "decision_framework": {
    "primary_criterion": "Maximizes individual choice",
    "trade_offs": {
      "liberty_vs_security": "Strongly favor liberty",
      "individual_vs_collective": "Strongly favor individual"
    }
  }
}
```

**Factor Scores**: CSV file with numerical factor scores for visualization

**Current Worldviews** (6):
1. **Libertarian**: Individual freedom, minimal government
2. **Religious-Conservative**: Traditional values, moral order
3. **Eco-Justice**: Environmental sustainability, social equity
4. **Populist-MAGA**: National sovereignty, traditional culture
5. **Communist**: Collective ownership, class struggle
6. **Neo-Reactionary**: Traditional hierarchy, anti-modernism

---

## 6. Analysis Pipeline

### Complete Workflow

```python
# Step 1: Initialize Pipeline
pipeline = TruthSplitPipeline()

# Step 2: User Input
text = "Governments are stealing when they tax citizens"
use_openai_extraction = True  # or False for local
llm_provider = "openrouter"
llm_model = "anthropic/claude-opus-4.5"

# Step 3: NLP Extraction
print("Extracting claims...")
extraction = pipeline.analyze_text(
    text, 
    use_openai=use_openai_extraction,
    llm_model=llm_model,
    llm_provider=llm_provider
)
# Result: Claims, premises, assumptions identified

# Step 4: Consistency Testing (Always Local)
print("Testing consistency...")
# Already done in analyze_text, but can be called separately:
consistency = test_consistency(extraction)
# Result: 3-layer consistency scores for each claim

# Step 5: Concept Linking (Always Local)
print("Linking to worldviews...")
# Already done in analyze_text, but can be called separately:
linked = link_claims_to_worldviews(extraction)
# Result: Relevant concepts from each worldview

# Step 6: Worldview Analysis
print("Analyzing worldview reasoning...")
selected_worldviews = ["libertarian", "eco_justice"]
use_gemma = False  # or True for Gemma steering

if use_gemma:
    # Gemma steering analysis
    gemma_analyzer = GemmaWorldviewAnalyzer()
    worldview_analyses = gemma_analyzer.analyze_multiple_claims(
        claims=claim_texts,
        worldview_ids=selected_worldviews,
        amplification=1.8
    )
else:
    # LLM-based analysis
    llm_reasoner = LLMComparativeReasoner(
        llm_provider=llm_provider,
        llm_model=llm_model
    )
    worldview_analyses = llm_reasoner.analyze_worldview_reasoning(
    extraction, 
    selected_worldviews
)

# Step 7: Divergence Analysis
print("Comparing worldviews...")
if use_local_divergence:
    from comparative_reasoning.local_divergence_analyzer import analyze_divergence_local
    divergence = analyze_divergence_local(worldview_analyses, {})
else:
    divergence = llm_reasoner._identify_divergence_points(
        worldview_analyses, 
        comparison_analysis
    )

# Step 8: Visualization (Frontend)
frontend.display_results(worldview_analyses, divergence)
```

### Timing Breakdown

For a typical analysis (1 claim, 2 worldviews):

| Step | Time | Where | Notes |
|------|------|-------|-------|
| NLP Extraction (Local) | 2-5 sec | CPU | BART-based |
| NLP Extraction (OpenRouter) | 3-8 sec | Cloud | LLM-based |
| Consistency Testing | 2-3 sec | CPU | Always local |
| Concept Linking | <1 sec | CPU | Sentence-BERT |
| LLM Worldview Analysis (2 worldviews) | 5-10 sec | Cloud | OpenRouter |
| Gemma Steering (2 worldviews) | 3-6 sec | GPU/CPU | Local model |
| Divergence Analysis (LLM) | 2-4 sec | Cloud | OpenRouter |
| Divergence Analysis (Local) | 1-2 sec | CPU | NLI-based |
| **Total (Local NLP + LLM)** | **12-25 sec** | | |
| **Total (OpenRouter NLP + LLM)** | **13-30 sec** | | |
| **Total (Local NLP + Gemma)** | **8-15 sec** | | |

---

## 7. Frontend Architecture

### Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **React Router** for client-side routing
- **TanStack Query** for server state management
- **shadcn/ui** for accessible UI components
- **Tailwind CSS** for styling
- **Plotly.js** and **Recharts** for visualizations
- **Three.js** for 3D visualizations

### Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx          # Landing page
│   │   ├── Analyze.tsx           # Analysis input page
│   │   ├── Results.tsx          # Results display page
│   │   ├── About.tsx            # About page
│   │   └── NotFound.tsx          # 404 page
│   ├── components/
│   │   ├── analysis/            # Analysis-related components
│   │   │   ├── TextInput.tsx
│   │   │   ├── ClaimSelection.tsx
│   │   │   ├── WorldviewSelection.tsx
│   │   │   ├── ModeSelector.tsx
│   │   │   ├── AdvancedSettings.tsx
│   │   │   └── NewsPanel.tsx
│   │   ├── results/             # Results display components
│   │   │   ├── OverviewTab.tsx
│   │   │   ├── DetailedAnalysisTab.tsx
│   │   │   ├── DivergenceAnalysisTab.tsx
│   │   │   ├── ConvergenceFlowTab.tsx
│   │   │   ├── FactorSpace3D.tsx
│   │   │   ├── ForceGraphTab.tsx
│   │   │   ├── CorrelationHeatmap.tsx
│   │   │   ├── WorldviewSpaceTab.tsx
│   │   │   ├── ReasoningInsightsTab.tsx
│   │   │   ├── WorldviewChat.tsx
│   │   │   └── PositionBadge.tsx
│   │   └── ui/                   # shadcn/ui components
│   ├── services/                # API service layer
│   ├── utils/                   # Utility functions
│   │   ├── analysisApi.ts       # Main API client
│   │   ├── claimExtraction.ts
│   │   ├── divergenceAnalysis.ts
│   │   ├── forceGraphDataTransform.ts
│   │   └── newsApi.ts
│   ├── hooks/                   # Custom React hooks
│   │   └── useWorldviews.ts
│   ├── types/                   # TypeScript types
│   │   └── analysis.ts
│   ├── data/                    # Static data
│   │   └── worldviews.ts
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── public/                      # Static assets
├── Dockerfile                   # Frontend container
├── nginx.conf                   # Nginx configuration
├── package.json                 # Dependencies
└── vite.config.ts               # Vite configuration
```

### Key Features

1. **Multi-Page Application**
   - Landing page with project overview
   - Analysis page with text input and configuration
   - Results page with multiple visualization tabs
   - About page with project information

2. **Analysis Configuration**
   - Text input (direct or file upload)
   - Claim selection (filter specific claims)
   - Worldview selection (up to 3)
   - Mode selection (LLM, Gemma, or Local)
   - Advanced settings (LLM model, provider, steering parameters)

3. **Results Visualization**
   - **Overview Tab**: Summary metrics and position distribution
   - **Detailed Analysis**: Per-worldview, per-claim analysis
   - **Divergence Analysis**: Disagreement patterns and severity
   - **Convergence Flow**: Reasoning chain visualization
   - **3D Factor Space**: Interactive 3D worldview positioning
   - **Force Graph**: Network visualization of relationships
   - **Correlation Heatmap**: Factor correlation matrix
   - **Worldview Space**: 2D projection of worldview positions
   - **Reasoning Insights**: Key insights and patterns
   - **Worldview Chat**: Interactive chat with worldview-embodied LLM

4. **State Management**
   - TanStack Query for server state (caching, refetching)
   - React state for UI state
   - URL parameters for shareable analysis links

5. **API Integration**
   - Centralized API client with error handling
   - Request/response type safety
   - Timeout handling (30 minutes for long analyses)

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Configuration

- **Vite**: Fast HMR, optimized builds
- **TypeScript**: Strict type checking
- **ESLint**: Code quality
- **Tailwind**: JIT compilation
- **PostCSS**: CSS processing

---

## 8. Backend Architecture

### Flask API Server

**File**: `api_server.py`

**Key Features**:
- RESTful API design
- CORS enabled for frontend
- Error handling and logging
- Persistent analysis storage (JSON)
- Health checks
- Request validation

### Component Initialization

```python
# Cached global instances
pipeline = None              # TruthSplitPipeline
llm_reasoner = None          # LLMComparativeReasoner
gemma_analyzer = None        # GemmaWorldviewAnalyzer

# Lazy initialization with caching
def get_pipeline():
    global pipeline
    if pipeline is None:
        pipeline = TruthSplitPipeline()
    return pipeline
```

### Request Flow

1. **Request Validation**: Check required fields, validate types
2. **Component Initialization**: Get or create pipeline/reasoner instances
3. **Processing**: Execute analysis pipeline
4. **Response Formatting**: Format results for frontend
5. **Error Handling**: Catch exceptions, return appropriate status codes

### Data Persistence

**Storage**: JSON file at `data/saved_analyses.json`

**Format**:
```json
{
  "slug": {
    "slug": "analysis-slug",
    "title": "Analysis title",
    "analysis_result": { /* Full analysis result */ },
    "analysis_text": "Original text",
    "selected_worldviews": ["libertarian", "eco-justice"],
    "convergence_data": { /* Optional */ },
    "created_at": "2024-12-01T...",
    "updated_at": "2024-12-01T..."
  }
}
```

**Slug Validation**: 3-50 characters, lowercase letters, numbers, dash, underscore

### Error Handling

- **400 Bad Request**: Missing or invalid request data
- **404 Not Found**: Resource not found
- **409 Conflict**: Slug already exists (when overwrite=false)
- **500 Internal Server Error**: Server-side errors

All errors include descriptive error messages in JSON format.

---

## 9. LLM Integration

### OpenRouter Provider

**Purpose**: Unified API for multiple LLM providers

**Supported Providers**:
- **Anthropic**: Claude Opus, Sonnet, Haiku
- **OpenAI**: GPT-4o, GPT-4 Turbo, GPT-4o-mini
- **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash
- **Meta**: Llama 2, Llama 3
- **Mistral**: Mistral Large, Mistral 7B
- **xAI**: Grok 3, Grok 4
- **DeepSeek**: DeepSeek Chat V3
- And many more via OpenRouter

### Provider Factory

**File**: `llm/provider_factory.py`

**Functionality**:
- Creates provider instances based on provider name
- Maps short model names to OpenRouter format
- Handles API key management
- Supports model aliases

**Example**:
```python
# Short names (auto-converted)
provider = create_provider("openai", "gpt-4o")
# -> openai/gpt-4o

provider = create_provider("claude", "claude-opus-4-5-20251101")
# -> anthropic/claude-opus-4.5

# Direct OpenRouter format
provider = create_provider("openrouter", "anthropic/claude-opus-4.5")
```

### Structured Outputs

**Format**: JSON Schema

**Benefits**:
- Reliable parsing
- Type safety
- Consistent format

**Example Schema**:
```json
{
  "type": "object",
  "properties": {
    "position": {
      "type": "string",
      "enum": ["support", "oppose", "conditional"]
    },
    "reasoning": {
      "type": "string"
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    }
  },
  "required": ["position", "reasoning"]
}
```

### Prompt Templates

**File**: `llm/prompt_templates.py`

**Templates**:
- Worldview analysis prompts
- Comparison prompts
- Convergence analysis prompts
- Chat system prompts

**Features**:
- Context-aware (includes consistency scores, linked concepts)
- Worldview-specific (uses profile data)
- Structured (guides JSON output)

### Cost Estimation

**OpenRouter Pricing** (varies by model):
- **Claude Opus 4.5**: ~$0.015 per 1K input tokens, ~$0.075 per 1K output tokens
- **GPT-4o**: ~$0.005 per 1K input tokens, ~$0.015 per 1K output tokens
- **GPT-4o-mini**: ~$0.00015 per 1K input tokens, ~$0.0006 per 1K output tokens
- **Gemini 2.5 Pro**: ~$0.00125 per 1K input tokens, ~$0.005 per 1K output tokens

**Typical Usage**:
- **Claim Extraction**: ~500 tokens → $0.0001-0.01 (depending on model)
- **Per Worldview Analysis**: ~1000 tokens → $0.0003-0.03
- **Complete Analysis (3 claims, 2 worldviews)**: ~$0.002-0.2

---

## 10. Gemma Steering System

### Overview

Gemma steering uses activation-based steering to generate worldview-specific reasoning without API calls. It leverages Sparse Autoencoders (SAEs) to identify and amplify worldview-relevant features in the model's internal representations.

### Architecture

```
User Input (Claim + Worldview)
         │
         ▼
Build Worldview Prompts
         │
         ▼
Capture Activation Vectors (SAE Layer)
         │
         ▼
Discover Steering Features (Top-K by Difference)
         │
         ▼
Apply Steering Hook (Amplify Features)
         │
         ▼
Generate Text with Steering
         │
         ▼
Parse and Format Results
```

### Components

#### Steering Manager (`gemma_steering/steering_manager.py`)

**Responsibilities**:
- Model initialization (Gemma-2B)
- SAE loading and management
- Hook registration and cleanup
- Feature discovery
- Text generation

**Key Methods**:
- `initialize()`: Load model and SAE
- `discover_features_for_claim()`: Find worldview-specific features
- `generate_with_steering()`: Generate steered text
- `create_steering_hook()`: Create amplification hook

#### Analyzer (`gemma_steering/analyzer.py`)

**Responsibilities**:
- Worldview analysis orchestration
- Result transformation
- Batch processing

**Key Methods**:
- `analyze_multiple_claims()`: Analyze multiple claims for multiple worldviews
- `_analyze_single_claim_worldview()`: Single claim-worldview analysis

### Technical Details

**Model**: `google/gemma-2b`
- **Parameters**: ~2B
- **Context**: 8192 tokens
- **Precision**: bfloat16

**SAE**: `gemma-2b-res-jb` release
- **Layer**: Configurable (default: 6)
- **Device**: CPU (SAE operations)
- **Features**: ~65,536 features

**Steering Process**:
1. **Prompt Construction**: Build worldview-specific prompts
2. **Activation Capture**: Run model forward pass, capture activations at SAE layer
3. **Feature Discovery**: Compare worldview activations vs. neutral activations
4. **Feature Selection**: Select top-K features by difference magnitude
5. **Hook Application**: Register forward hook that amplifies selected features
6. **Generation**: Generate text with steering applied
7. **Cleanup**: Remove hook, parse results

**Configuration**:
- `sae_layer_index`: Layer where SAE was trained (default: 6)
- `hook_layer_index`: Layer where hook is registered (default: same as SAE layer)
- `amplification`: Amplification factor (default: 1.8)
- `num_features`: Number of features to amplify (default: 20)
- `max_new_tokens`: Maximum tokens to generate (default: 250)

### Advantages

- **Privacy**: No data sent to external APIs
- **Cost**: No API costs
- **Speed**: Fast inference (3-6 seconds per worldview)
- **Interpretability**: Feature-based steering is interpretable
- **Flexibility**: Configurable amplification per worldview

### Limitations

- **Model Size**: Requires significant memory (~4GB for model)
- **GPU Recommended**: CPU inference is slower
- **HuggingFace Token**: Required for model access
- **Quality**: May be lower than large LLMs for complex reasoning

### Usage

```python
from gemma_steering.analyzer import GemmaWorldviewAnalyzer

analyzer = GemmaWorldviewAnalyzer(
    sae_layer_index=6,
    hook_layer_index=6
)

results = analyzer.analyze_multiple_claims(
    claims=["Claim 1", "Claim 2"],
    worldview_ids=["libertarian", "eco-justice"],
    amplification=1.8,
    worldview_amplifications={
        "libertarian": 2.0,
        "eco-justice": 1.5
    },
    num_features=20,
    max_new_tokens=250
)
```

---

## 11. Worldview Profiles

### Profile Structure

Each worldview is defined in a JSON file with the following structure:

```json
{
  "id": "libertarian",
  "display_name": "Libertarian",
  "core_values": [
    {
      "name": "Individual Liberty",
      "weight": 0.95,
      "description": "Fundamental right to self-determination"
    }
  ],
  "definitions": {
    "freedom": "Absence of coercion by others",
    "rights": "Negative rights to non-interference"
  },
  "assumed_principles": [
    "Self-ownership is fundamental",
    "Voluntary exchange creates value"
  ],
  "decision_framework": {
    "primary_criterion": "Maximizes individual choice",
    "secondary_criteria": ["Minimizes coercion", "Respects property"],
    "trade_offs": {
      "liberty_vs_security": "Strongly favor liberty",
      "individual_vs_collective": "Strongly favor individual"
    }
  }
}
```

### Factor Scores

Each worldview has numerical factor scores stored in `vectors/factor_scores.csv`:

| worldview_id | individualism | collectivism | tradition | progress | ... |
|--------------|---------------|--------------|-----------|----------|-----|
| libertarian | 0.95 | -0.95 | -0.3 | 0.2 | ... |
| eco-justice | -0.2 | 0.9 | -0.1 | 0.8 | ... |

**Scale**: -1.0 to +1.0 (transformed from 0-1 in CSV)

**Usage**: 
- 3D visualization (Factor Space)
- Correlation analysis
- Worldview positioning

### Available Worldviews

1. **Libertarian**
   - Focus: Individual freedom, minimal government
   - Key Values: Liberty, property rights, voluntary exchange
   - Approach: Market solutions, decentralization

2. **Religious-Conservative**
   - Focus: Traditional values, moral order
   - Key Values: Faith, family, tradition, authority
   - Approach: Cultural preservation, subsidiarity

3. **Eco-Justice**
   - Focus: Environmental sustainability, social equity
   - Key Values: Ecological integrity, intergenerational justice
   - Approach: Systems thinking, collective action

4. **Populist-MAGA**
   - Focus: National sovereignty, traditional culture
   - Key Values: National identity, common sense, authenticity
   - Approach: Anti-elite, cultural preservation

5. **Communist**
   - Focus: Collective ownership, class struggle
   - Key Values: Equality, solidarity, workers' rights
   - Approach: Collective action, state intervention

6. **Neo-Reactionary**
   - Focus: Traditional hierarchy, anti-modernism
   - Key Values: Order, tradition, natural hierarchy
   - Approach: Anti-democratic, traditional structures

---

## 12. Deployment

### Docker Deployment

**File**: `docker-compose.yml`

**Services**:
1. **Backend** (`truthsplit-backend`)
   - Port: 5001
   - Health check: `/api/health`
   - Volumes: `./logs`, `./data`

2. **Frontend** (`truthsplit-frontend`)
   - Port: 13998 (mapped to 80 in container)
   - Depends on: Backend health check
   - Nginx serving static files

**Startup**:
```bash
docker-compose up --build
```

**Environment Variables** (`.env` file):
```bash
OPENROUTER_API_KEY=sk-or-v1-...
HUGGING_FACE_KEY=hf_...
NEWS_API_KEY=...
ANALYSIS_DELETE_SECRET=...
```

### Backend Dockerfile

**Multi-stage build**:
1. **Builder stage**: Install dependencies
2. **Production stage**: Copy dependencies and code

**Features**:
- Python 3.12-slim base
- Health check configured
- Logs and data directories created
- Non-root user (recommended for production)

### Frontend Dockerfile

**Multi-stage build**:
1. **Builder stage**: Install dependencies and build
2. **Production stage**: Nginx serving static files

**Features**:
- Node 20-alpine base
- Nginx alpine for serving
- Optimized production build
- Nginx configuration included

### Nginx Configuration

**File**: `frontend/nginx.conf`

**Features**:
- Serves static files
- API proxy to backend
- Gzip compression
- Security headers

### Production Considerations

1. **Environment Variables**: Use secrets management
2. **HTTPS**: Configure SSL/TLS
3. **Rate Limiting**: Implement API rate limiting
4. **Monitoring**: Add logging and monitoring
5. **Backup**: Backup `saved_analyses.json` regularly
6. **Scaling**: Use load balancer for multiple instances

---

## 13. Performance & Scalability

### Performance Metrics

**Local Processing** (CPU):
- Claim Extraction: 2-5 seconds per text
- Consistency Testing: 1-2 seconds per claim
- Concept Linking: <1 second

**Cloud Processing** (OpenRouter):
- Claim Extraction: 3-8 seconds per text
- Worldview Analysis: 2-5 seconds per worldview per claim
- Comparison: 2-4 seconds

**Gemma Steering** (GPU recommended):
- Feature Discovery: 2-4 seconds per worldview
- Generation: 1-2 seconds per claim
- Total: 3-6 seconds per worldview per claim

### Optimization Strategies

1. **Caching**:
   - Cache worldview profiles
   - Cache model instances
   - Cache analysis results (by text hash)

2. **Parallel Processing**:
   - Process multiple worldviews in parallel
   - Batch API requests where possible

3. **Lazy Loading**:
   - Load models on first use
   - Keep models in memory for reuse

4. **GPU Acceleration**:
   - Use GPU for Gemma steering
   - Use GPU for local NLP models (optional)

### Scalability Considerations

**Current Limitations**:
- Single-threaded Flask server
- In-memory model instances
- JSON file storage (not suitable for high concurrency)

**Scaling Options**:
1. **Horizontal Scaling**: Multiple API instances behind load balancer
2. **Database**: Replace JSON storage with database (PostgreSQL, MongoDB)
3. **Caching Layer**: Redis for analysis result caching
4. **Message Queue**: Celery for async processing
5. **Model Serving**: Dedicated model serving infrastructure

---

## 14. Security Considerations

### API Security

**Current State**:
- No authentication required
- CORS enabled for frontend
- Input validation on endpoints

**Recommendations**:
1. **Authentication**: Implement API key or OAuth
2. **Rate Limiting**: Prevent abuse
3. **Input Sanitization**: Validate and sanitize all inputs
4. **HTTPS**: Use TLS in production
5. **Secrets Management**: Use environment variables or secrets manager

### Data Privacy

**Local Processing**:
- No data sent to external services
- Complete privacy

**Cloud Processing**:
- Data sent to OpenRouter (check their privacy policy)
- Consider data retention policies

**Storage**:
- Analysis results stored in JSON file
- Consider encryption for sensitive data
- Implement access controls

### Environment Variables

**Sensitive Data**:
- API keys (OpenRouter, HuggingFace, NewsAPI)
- Delete secret for analysis deletion

**Best Practices**:
- Never commit `.env` files
- Use secrets manager in production
- Rotate keys regularly
- Use least privilege principle

---

## 15. Development Guide

### Setup Development Environment

```bash
# Backend
cd truthSplitStiegerTerberger
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Running Tests

```bash
# Backend tests
pytest truthSplitStiegerTerberger/tests/

# Frontend tests (if configured)
cd frontend
npm test
```

### Code Style

**Python**:
- Follow PEP 8
- Use type hints
- Document functions and classes

**TypeScript**:
- Use strict mode
- Follow ESLint rules
- Use meaningful variable names

### Adding New Worldviews

1. Create JSON profile in `structured_knowledge_layer/profiles/json/`
2. Add factor scores to `vectors/factor_scores.csv`
3. Test with sample claims
4. Update documentation

### Adding New Features

1. **Backend**: Add endpoint in `api_server.py`
2. **Frontend**: Add UI component and API call
3. **Testing**: Add tests for new functionality
4. **Documentation**: Update this documentation

### Debugging

**Backend**:
- Check logs in `logs/` directory
- Use Flask debug mode (development only)
- Add print statements for debugging

**Frontend**:
- Use browser DevTools
- Check Network tab for API calls
- Use React DevTools

### Common Issues

1. **Import Errors**: Check Python path and virtual environment
2. **API Errors**: Verify API keys in `.env`
3. **Model Loading**: Check HuggingFace token for Gemma
4. **CORS Errors**: Verify CORS configuration
5. **Port Conflicts**: Change ports in configuration

---

## Appendix A: File Structure

```
BachelorProjektStiegerTerberger/
├── docker-compose.yml
├── README.md
├── TruthSplit_Technical_Documentation.md
└── truthSplitStiegerTerberger/
    ├── api_server.py
    ├── requirements.txt
    ├── Dockerfile
    ├── comparative_reasoning/
    │   ├── __init__.py
    │   ├── pipeline.py
    │   ├── consistency_tester.py
    │   ├── claim_linker.py
    │   ├── llm_reasoning_engine.py
    │   └── local_divergence_analyzer.py
    ├── nlp/
    │   ├── __init__.py
    │   ├── main.py
    │   └── nlp_layer/
    │       ├── __init__.py
    │       ├── openai_extractor.py
    │       ├── simple_extractor.py
    │       ├── schemas.py
    │       └── result_writer.py
    ├── llm/
    │   ├── __init__.py
    │   ├── base_provider.py
    │   ├── provider_factory.py
    │   ├── openrouter_provider.py
    │   └── prompt_templates.py
    ├── gemma_steering/
    │   ├── __init__.py
    │   ├── steering_manager.py
    │   └── analyzer.py
    ├── structured_knowledge_layer/
    │   ├── __init__.py
    │   ├── profile_loader.py
    │   ├── profiles/
    │   │   ├── json/
    │   │   │   ├── libertarian.json
    │   │   │   ├── religious-conservative.json
    │   │   │   ├── eco-justice.json
    │   │   │   ├── populist-MAGA.json
    │   │   │   ├── communist.json
    │   │   │   └── neo-reactionary.json
    │   │   └── text/
    │   └── vectors/
    │       └── factor_scores.csv
    ├── frontend/
    │   ├── src/
    │   │   ├── pages/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── utils/
    │   │   ├── hooks/
    │   │   ├── types/
    │   │   └── data/
    │   ├── public/
    │   ├── Dockerfile
    │   ├── nginx.conf
    │   ├── package.json
    │   └── vite.config.ts
    ├── data/
    │   └── saved_analyses.json
    └── logs/
```

---

## Appendix B: Glossary

**Claim**: Main argumentative statement that takes a position

**Premise**: Supporting evidence or reasoning for a claim

**Assumption**: Unstated belief underlying an argument

**Worldview**: Coherent set of values, beliefs, and principles

**NLI (Natural Language Inference)**: AI task determining if one statement follows from another

**Consistency Score**: 0.0-1.0 measure of logical coherence

**Divergence Point**: Specific place where worldviews disagree

**Conditional Validity**: Conclusion is valid *given* certain premises

**Structured Outputs**: JSON schema-based LLM responses

**Zero-shot Classification**: ML technique for categorization without training examples

**SAE (Sparse Autoencoder)**: Neural network that learns sparse representations of activations

**Activation Steering**: Technique of modifying model activations to influence output

**Factor Scores**: Numerical representation of worldview positions on various dimensions

---

## Appendix C: References

### Academic Literature
See [REFERENCES.md](REFERENCES.md) for the key literature

### Technical Documentation
- OpenRouter API: https://openrouter.ai/docs
- Flask: https://flask.palletsprojects.com/
- React: https://react.dev/
- Vite: https://vitejs.dev/
- HuggingFace Transformers: https://huggingface.co/docs/transformers
- Sentence-BERT: https://www.sbert.net
- SAE Lens: https://github.com/ContextualAI/sae-lens

### Project Resources
- GitHub Repository: Maxtbg/BachelorProjektStiegerTerberger
- University: HSG (University of St. Gallen)

---

**Document Version**: 2.0  
**Last Updated**: December 2024  
**Authors**: Stieger & Terberger  
**Contact**: HSG Bachelor Projekt Team

---

*End of Documentation*
