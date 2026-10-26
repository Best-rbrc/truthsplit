import { useEffect, useState } from "react";
import { Split, Brain, Network, MessageSquare, BarChart3, Zap, Target, Code, Mail, Layers, GitBranch, TrendingUp, Eye, Printer, ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  id: number;
  title: string;
  content: React.ReactNode;
  isTitle?: boolean;
  isEnd?: boolean;
}

const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 0,
      title: "",
      isTitle: true,
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary">
              <Split className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-7xl font-bold text-gray-900">Truth<span className="text-primary">Split</span></h1>
          </div>
          <p className="text-3xl text-gray-600 mb-8">Multi-Perspective Argument Analysis Platform</p>
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border-2 border-primary/20">
            <span className="text-xl font-semibold text-primary">Bachelor's Project 2025</span>
          </div>
          <p className="text-xl text-gray-500 mt-12">University of St. Gallen (HSG)</p>
        </div>
      ),
    },
    {
      id: 1,
      title: "Project Vision",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border-2 border-primary/20">
            <p className="text-xl text-gray-700 leading-relaxed mb-4">
              TruthSplit reveals how different ideological perspectives interpret and reason about the same arguments. 
              Instead of determining "right" or "wrong," the system highlights <strong>conditional validity</strong>, showing 
              how conclusions make sense given specific premises and conceptual frameworks.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed">
              By mapping reasoning paths through a 16-dimensional ideological factor space, TruthSplit enables users to 
              understand not just <em>what</em> different worldviews believe, but <em>why</em> they hold those beliefs.
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-lg font-semibold text-gray-900 mb-2">Key Question:</p>
            <p className="text-lg text-gray-700 italic">Why do people arrive at radically different conclusions from the same facts?</p>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "Core Features",
      content: (
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Brain className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Intelligent Analysis</h3>
              <p className="text-base text-gray-700">Automatic claim & premise extraction, step-by-step reasoning chains, dynamic confidence scoring, consistency metrics</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Network className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Worldview Analysis</h3>
              <p className="text-base text-gray-700">Six ideological perspectives with 16-dimensional factor space</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <GitBranch className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Divergence & Convergence</h3>
              <p className="text-base text-gray-700">Comprehensive divergence analysis, on-demand convergence flow, primary divergence point identification</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <BarChart3 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Visualizations</h3>
              <p className="text-base text-gray-700">Interactive 3D worldview space, 2D scatter plots, correlation heatmaps, overview dashboards</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <MessageSquare className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Worldview Chat</h3>
              <p className="text-base text-gray-700">Chat with AI embodiments of different worldviews, context-aware responses, personality-driven conversations</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "Key Innovation",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-8 text-white">
            <p className="text-2xl leading-relaxed mb-6">
              TruthSplit combines traditional NLP techniques with modern LLM reasoning to reveal not just 
              <em> what</em> different perspectives think, but <em>why</em> they think it—tracing reasoning 
              from core values through beliefs to conclusions.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur text-center">
                <div className="text-4xl font-bold">6</div>
                <div className="text-lg">Worldviews</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur text-center">
                <div className="text-4xl font-bold">16</div>
                <div className="text-lg">Factor Dimensions</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur text-center">
                <div className="text-4xl font-bold">3</div>
                <div className="text-lg">Consistency Layers</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: "Analysis Pipeline",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">1</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Claim & Premise Extraction</h3>
              <p className="text-base text-gray-600">Automatic extraction from complex arguments using local NLP or LLM</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">2</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Consistency Testing</h3>
              <p className="text-base text-gray-600">3-layer NLI testing: Premise→Claim, Claim→Worldview, Cross-worldview</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">3</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Worldview Analysis</h3>
              <p className="text-base text-gray-600">LLM-based reasoning through worldview lenses with step-by-step chains</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">4</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Divergence Detection</h3>
              <p className="text-base text-gray-600">Identify value conflicts, assumption differences, disagreement dimensions</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">5</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Convergence Analysis</h3>
              <p className="text-base text-gray-600">On-demand analysis showing where reasoning agrees/disagrees</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">6</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Visualization</h3>
              <p className="text-base text-gray-600">Interactive 3D space, heatmaps, flow diagrams, overview dashboards</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: "Worldviews",
      content: (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Libertarian</h3>
            <p className="text-sm text-gray-600">Individual freedom, minimal government, property rights</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Religious Conservative</h3>
            <p className="text-sm text-gray-600">Traditional values, moral order, faith-based principles</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eco-Justice</h3>
            <p className="text-sm text-gray-600">Environmental sustainability, social equity, climate action</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Populist Nationalist</h3>
            <p className="text-sm text-gray-600">National sovereignty, cultural identity, popular will</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Communist</h3>
            <p className="text-sm text-gray-600">Collective ownership, class struggle, equality</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Neo-Reactionary</h3>
            <p className="text-sm text-gray-600">Traditional hierarchy, anti-democracy, order</p>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: "Technical Stack",
      content: (
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Frontend</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• React 18 + TypeScript</li>
              <li>• Vite build tooling</li>
              <li>• TailwindCSS styling</li>
              <li>• Radix UI components</li>
              <li>• React Three Fiber (3D)</li>
              <li>• Recharts + Plotly.js</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Backend</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Python 3.12 + Flask</li>
              <li>• Flask-CORS support</li>
              <li>• RESTful API architecture</li>
              <li>• Docker containerization</li>
              <li>• Nginx reverse proxy</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Machine Learning</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• PyTorch deep learning</li>
              <li>• HuggingFace Transformers</li>
              <li>• Sentence Transformers</li>
              <li>• BART-large-mnli (NLI)</li>
              <li>• MiniLM embeddings</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">LLM Integration</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• OpenRouter unified API</li>
              <li>• OpenAI (GPT-4, GPT-4o-mini)</li>
              <li>• Anthropic Claude (Opus, Sonnet)</li>
              <li>• Google Gemini</li>
              <li>• Gemma 2B + SAE steering</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      title: "The Team",
      content: (
        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                <span className="text-2xl font-bold text-primary">BS</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Benjamin Stieger</h3>
                <p className="text-sm text-gray-600">Co-Developer, responsible for LLM integration, reasoning pipeline and frontend development.</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Mail className="h-4 w-4 text-gray-600" />
              <a href="mailto:benjamin.stieger@student.unisg.ch" className="text-sm text-gray-600 hover:text-primary">
                benjamin.stieger@student.unisg.ch
              </a>
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                <span className="text-2xl font-bold text-primary">MT</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Maximilian Terberger</h3>
                <p className="text-sm text-gray-600">Co-Developer, responsible for LLM steering engineering and user experience.</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Mail className="h-4 w-4 text-gray-600" />
              <a href="mailto:maximilian.terberger@student.unisg.ch" className="text-sm text-gray-600 hover:text-primary">
                maximilian.terberger@student.unisg.ch
              </a>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 8,
      title: "",
      isEnd: true,
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-8">Thank You</h1>
          <div className="space-y-4">
            <p className="text-3xl text-gray-600">University of St. Gallen (HSG)</p>
            <p className="text-2xl text-gray-500">Bachelor's Project 2025</p>
            <p className="text-xl text-primary mt-8">https://truthsplit.datascience-nlp.ai/</p>
          </div>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: 16in 9in landscape;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white !important;
        }
        .slide-container {
          width: 16in !important;
          height: 9in !important;
          margin: 0 !important;
          padding: 0 !important;
          page-break-after: always;
          page-break-inside: avoid;
        }
        .slide-content {
          background: white !important;
        }
        .navigation-controls {
          display: none !important;
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

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
        {/* Navigation Controls - hidden when printing */}
        <div className="navigation-controls fixed top-4 right-4 z-50 flex gap-2 print:hidden">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-lg hover:bg-primary-hover transition-colors"
          >
            <Printer className="h-5 w-5" />
            <span>Export PDF</span>
          </button>
          <div className="px-4 py-2 bg-white rounded-lg shadow-lg flex items-center">
            <span className="text-sm text-gray-600">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Slide Container */}
        <div 
          className="slide-container mx-auto bg-white shadow-2xl print:shadow-none"
          style={{
            width: '100%',
            maxWidth: '1600px',
            aspectRatio: '16 / 9',
            minHeight: '600px'
          }}
        >
          <div 
            className="slide-content h-full flex flex-col p-12 print:p-12"
            style={{ fontFamily: 'Inter, sans-serif', backgroundColor: 'white' }}
          >
            {/* Header - only show if not title or end slide */}
            {!currentSlideData.isTitle && !currentSlideData.isEnd && (
              <div className="flex items-start justify-between mb-8 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                    <Split className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Truth<span className="text-primary">Split</span></h1>
                    <p className="text-lg text-gray-600">Multi-Perspective Argument Analysis Platform</p>
                  </div>
                </div>
              </div>
            )}

            {/* Slide Title - only show if not title or end slide */}
            {!currentSlideData.isTitle && !currentSlideData.isEnd && currentSlideData.title && (
              <h2 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                {currentSlideData.title}
              </h2>
            )}

            {/* Slide Content */}
            <div className="flex-1 flex items-center">
              {currentSlideData.content}
            </div>

            {/* Footer - only show if not title or end slide */}
            {!currentSlideData.isTitle && !currentSlideData.isEnd && (
              <div className="mt-auto pt-6 border-t-2 border-gray-300 flex items-center justify-between flex-shrink-0">
                <div className="text-sm text-gray-600">
                  <p className="font-semibold">University of St. Gallen (HSG)</p>
                  <p>Bachelor's Project 2025</p>
                </div>
                <div className="text-sm text-gray-600 text-right">
                  <p className="font-semibold">https://truthsplit.datascience-nlp.ai/</p>
                  <p>Advanced AI-Powered Argument Analysis Platform</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Presentation;

