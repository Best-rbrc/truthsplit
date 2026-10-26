import { useEffect } from "react";
import { Split, Brain, Network, MessageSquare, BarChart3, Zap, Target, Code, Database, Cpu, GraduationCap, Mail, Layers, GitBranch, TrendingUp, Eye, Printer } from "lucide-react";

const Poster = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: A1 portrait;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white !important;
        }
        .poster-container {
          width: 594mm !important;
          height: 841mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          box-shadow: none !important;
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        .poster-content {
          background: white !important;
          display: flex !important;
          flex-direction: column !important;
          height: 841mm !important;
          max-height: 841mm !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: hidden !important;
        }
        .poster-container > * {
          overflow: hidden !important;
        }
        /* Reduce spacing to fit everything on one page */
        .poster-content .space-y-4 > * + * {
          margin-top: 0.75rem !important;
        }
        .poster-content .space-y-3 > * + * {
          margin-top: 0.5rem !important;
        }
        .poster-content .mb-6 {
          margin-bottom: 1rem !important;
        }
        .poster-content .mb-4 {
          margin-bottom: 0.75rem !important;
        }
        .poster-content .mb-3 {
          margin-bottom: 0.5rem !important;
        }
        .poster-content .gap-4 {
          gap: 0.75rem !important;
        }
        /* Keep footer on same page - force it to stay at bottom */
        .poster-content > div:last-child {
          page-break-before: avoid !important;
          break-before: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          margin-top: auto !important;
          padding-bottom: 2.5rem !important;
          flex-shrink: 0 !important;
        }
        /* Ensure grid doesn't overflow - leave room for footer and header */
        .poster-content > .grid {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          max-height: calc(841mm - 200px) !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        /* Prevent header from taking too much space */
        .poster-content > div:first-child {
          flex-shrink: 0 !important;
        }
        /* Keep gray backgrounds gray in PDF export - don't force to white */
        div[style*="rgb(249, 250, 251)"] {
          background-color: rgb(249, 250, 251) !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="min-h-screen bg-white p-8 print:p-0 print:bg-white print:m-0">
        {/* Print Button - hidden when printing */}
        <div className="fixed top-4 right-4 z-50 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-lg hover:bg-primary-hover transition-colors"
          >
            <Printer className="h-5 w-5" />
            <span>Als PDF exportieren / Drucken</span>
          </button>
        </div>
        {/* A1 Poster Container - 594mm x 841mm (portrait) */}
        <div 
          className="poster-container mx-auto bg-white shadow-2xl print:shadow-none overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '1200px',
            aspectRatio: '594 / 841',
            minHeight: '600px'
          }}
        >
          <div className="poster-content h-full flex flex-col p-10 print:p-10 print:bg-white overflow-hidden" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: 'white' }}>
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6 flex-shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                  <Split className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold text-gray-900 leading-tight">Truth<span className="text-primary">Split</span></h1>
                  <p className="text-xl text-gray-600 mt-1">Multi-Perspective Argument Analysis Platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 print:bg-white print:border-gray-300 border-2 border-primary/20">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold text-primary">Bachelor's Project 2025</span>
            </div>
          </div>

          {/* Main Content Grid - 3 columns for A1 */}
          <div className="flex-1 grid grid-cols-3 gap-4 min-h-0 overflow-hidden" style={{ flex: '1 1 auto', minHeight: 0 }}>
            {/* Left Column */}
            <div className="space-y-4 min-w-0 overflow-hidden flex flex-col">
              {/* Project Vision */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 print:bg-white rounded-xl p-5 border-2 border-primary/20 print:border-gray-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  Project Vision
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  TruthSplit reveals how different ideological perspectives interpret and reason about the same arguments. 
                  Instead of determining "right" or "wrong," the system highlights <strong>conditional validity</strong>, showing 
                  how conclusions make sense given specific premises and conceptual frameworks.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  By mapping reasoning paths through a 16-dimensional ideological factor space, TruthSplit enables users to 
                  understand not just <em>what</em> different worldviews believe, but <em>why</em> they hold those beliefs.
                </p>
                <div className="bg-white/60 print:bg-white rounded-lg p-3 mt-3">
                  <p className="text-xs font-semibold text-gray-900 mb-2">Key Question:</p>
                  <p className="text-xs text-gray-700 italic">Why do people arrive at radically different conclusions from the same facts?</p>
                </div>
              </div>

              {/* Core Features */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  Core Features
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Intelligent Analysis</h3>
                      <p className="text-xs text-gray-700">Automatic claim & premise extraction, step-by-step reasoning chains, dynamic confidence scoring, consistency metrics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <Network className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Multi-Worldview Analysis</h3>
                      <p className="text-xs text-gray-700">Six ideological perspectives (Libertarian, Religious Conservative, Eco-Justice, Populist Nationalist, Communist, Neo-Reactionary) with 16-dimensional factor space</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <GitBranch className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Divergence & Convergence</h3>
                      <p className="text-xs text-gray-700">Comprehensive divergence analysis, on-demand convergence flow, primary divergence point identification, common ground discovery</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Advanced Visualizations</h3>
                      <p className="text-xs text-gray-700">Interactive 3D worldview space, 2D scatter plots, correlation heatmaps, overview dashboards</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Interactive Worldview Chat</h3>
                      <p className="text-xs text-gray-700">Chat with AI embodiments of different worldviews, context-aware responses, personality-driven conversations</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Worldviews */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Layers className="h-6 w-6 text-primary" />
                  Worldviews
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Libertarian</h3>
                    <p className="text-xs text-gray-600">Individual freedom, minimal government, property rights</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Religious Conservative</h3>
                    <p className="text-xs text-gray-600">Traditional values, moral order, faith-based principles</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Eco-Justice</h3>
                    <p className="text-xs text-gray-600">Environmental sustainability, social equity, climate action</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Populist Nationalist</h3>
                    <p className="text-xs text-gray-600">National sovereignty, cultural identity, popular will</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Communist</h3>
                    <p className="text-xs text-gray-600">Collective ownership, class struggle, equality</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Neo-Reactionary</h3>
                    <p className="text-xs text-gray-600">Traditional hierarchy, anti-democracy, order</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="space-y-4 min-w-0 overflow-hidden flex flex-col">
              {/* Key Innovation */}
              <div className="bg-gradient-to-br from-primary to-primary/80 print:bg-white print:text-gray-900 rounded-xl p-5 text-white border-2 print:border-gray-300">
                <h2 className="text-2xl font-bold mb-3">Key Innovation</h2>
                <p className="text-sm leading-relaxed mb-4">
                  TruthSplit combines traditional NLP techniques with modern LLM reasoning to reveal not just 
                  <em> what</em> different perspectives think, but <em>why</em> they think it—tracing reasoning 
                  from core values through beliefs to conclusions.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-white/20 print:bg-gray-100 rounded-lg p-3 backdrop-blur print:backdrop-blur-0 text-center print:border print:border-gray-300">
                    <div className="text-2xl font-bold">6</div>
                    <div className="text-xs">Worldviews</div>
                  </div>
                  <div className="bg-white/20 print:bg-gray-100 rounded-lg p-3 backdrop-blur print:backdrop-blur-0 text-center print:border print:border-gray-300">
                    <div className="text-2xl font-bold">16</div>
                    <div className="text-xs">Factor Dimensions</div>
                  </div>
                  <div className="bg-white/20 print:bg-gray-100 rounded-lg p-3 backdrop-blur print:backdrop-blur-0 text-center print:border print:border-gray-300">
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-xs">Consistency Layers</div>
                  </div>
                </div>
              </div>

              {/* Analysis Pipeline */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Analysis Pipeline
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-primary" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Claim & Premise Extraction</h3>
                      <p className="text-xs text-gray-600">Automatic extraction from complex arguments using local NLP or LLM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-primary" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Consistency Testing</h3>
                      <p className="text-xs text-gray-600">3-layer NLI testing: Premise→Claim, Claim→Worldview, Cross-worldview</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-primary" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Worldview Analysis</h3>
                      <p className="text-xs text-gray-600">LLM-based reasoning through worldview lenses with step-by-step chains</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-primary" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Divergence Detection</h3>
                      <p className="text-xs text-gray-600">Identify value conflicts, assumption differences, disagreement dimensions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-primary" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">5</div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Convergence Analysis</h3>
                      <p className="text-xs text-gray-600">On-demand analysis showing where reasoning agrees/disagrees</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-primary" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">6</div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Visualization</h3>
                      <p className="text-xs text-gray-600">Interactive 3D space, heatmaps, flow diagrams, overview dashboards</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Methodology */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="h-6 w-6 text-primary" />
                  Methodology
                </h2>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Natural Language Processing</h3>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• BART-large-mnli for NLI consistency testing</li>
                      <li>• Sentence Transformers (MiniLM) for semantic matching</li>
                      <li>• BM25 for assumption retrieval</li>
                      <li>• Zero-shot classification for claim extraction</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">LLM Reasoning</h3>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• Structured JSON schema outputs</li>
                      <li>• Multi-provider support via OpenRouter</li>
                      <li>• Temperature & token control</li>
                      <li>• Error handling & retries</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Factor Analysis</h3>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• 16-dimensional ideological factor space</li>
                      <li>• PCA for dimensionality reduction</li>
                      <li>• Correlation analysis between worldviews</li>
                      <li>• 3D/2D visualization of factor relationships</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 min-w-0 overflow-hidden flex flex-col">
              {/* Technical Stack */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Code className="h-6 w-6 text-primary" />
                  Technical Stack
                </h2>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Frontend</h3>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• React 18 + TypeScript</li>
                      <li>• Vite build tooling</li>
                      <li>• TailwindCSS styling</li>
                      <li>• Radix UI components</li>
                      <li>• React Three Fiber (3D)</li>
                      <li>• Recharts + Plotly.js</li>
                      <li>• React Router navigation</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Backend</h3>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• Python 3.12 + Flask</li>
                      <li>• Flask-CORS support</li>
                      <li>• RESTful API architecture</li>
                      <li>• Modular pipeline design</li>
                      <li>• Docker containerization</li>
                      <li>• Nginx reverse proxy</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Machine Learning</h3>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• PyTorch deep learning</li>
                      <li>• HuggingFace Transformers</li>
                      <li>• Sentence Transformers</li>
                      <li>• BART-large-mnli (NLI)</li>
                      <li>• MiniLM embeddings</li>
                      <li>• scikit-learn utilities</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">LLM Integration</h3>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• OpenRouter unified API</li>
                      <li>• OpenAI (GPT-4, GPT-4o-mini)</li>
                      <li>• Anthropic Claude (Opus, Sonnet)</li>
                      <li>• Google Gemini</li>
                      <li>• xAI Grok, DeepSeek</li>
                      <li>• Gemma 2B + SAE steering</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 print:bg-white rounded-xl p-5 border-2 border-primary/20 print:border-gray-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Key Metrics
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="text-2xl font-bold text-primary">3-Layer</div>
                    <div className="text-xs text-gray-600">Consistency Testing</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="text-2xl font-bold text-primary">Dynamic</div>
                    <div className="text-xs text-gray-600">Confidence Scoring</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="text-2xl font-bold text-primary">Multi-Modal</div>
                    <div className="text-xs text-gray-600">Analysis Options</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="text-2xl font-bold text-primary">Real-Time</div>
                    <div className="text-xs text-gray-600">Interactive Chat</div>
                  </div>
                </div>
              </div>

              {/* Team Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">The Team</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-14 w-14 rounded-full bg-primary/10 print:bg-white print:border-gray-300 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                        <img 
                          src="/images/Benjamin.JPG" 
                          alt="Benjamin Stieger"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<span class="text-xl font-bold text-primary">BS</span>';
                            }
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Benjamin Stieger</h3>
                        <p className="text-xs text-gray-600">Co-Developer, responsible for LLM integration, reasoning pipeline and frontend development.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <a href="mailto:benjamin.stieger@student.unisg.ch" className="text-xs text-gray-600 hover:text-primary">
                        benjamin.stieger@student.unisg.ch
                      </a>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-14 w-14 rounded-full bg-primary/10 print:bg-white print:border-gray-300 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                        <img 
                          src="/images/Max.png" 
                          alt="Maximilian Terberger"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<span class="text-xl font-bold text-primary">MT</span>';
                            }
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Maximilian Terberger</h3>
                        <p className="text-xs text-gray-600">Co-Developer, responsible for LLM steering engineering and user experience. </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <a href="mailto:maximilian.terberger@student.unisg.ch" className="text-xs text-gray-600 hover:text-primary">
                        maximilian.terberger@student.unisg.ch
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t-2 border-gray-300 print:border-gray-200 print:bg-white flex items-center justify-between flex-shrink-0 bg-white" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginTop: 'auto' }}>
            <div className="text-xs text-gray-600">
              <p className="font-semibold">University of St. Gallen (HSG)</p>
              <p>Bachelor's Project 2025</p>
            </div>
            <div className="text-xs text-gray-600 text-right">
              <p className="font-semibold">https://truthsplit.datascience-nlp.ai/</p>
              <p>Advanced AI-Powered Argument Analysis Platform</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Poster;
