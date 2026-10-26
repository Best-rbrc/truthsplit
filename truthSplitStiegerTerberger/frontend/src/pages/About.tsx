import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Mail, GraduationCap, Brain, Network, MessageSquare, BarChart3, Zap, Target, Code, Database, Cpu } from "lucide-react";

const About = () => {
  const [benjaminImageError, setBenjaminImageError] = useState(false);
  const [maxImageError, setMaxImageError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Bachelor's Project</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">About Truth</span><span className="text-primary">Split</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Advanced multi-perspective argument analysis powered by AI and machine learning
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                <Badge variant="secondary" className="text-xs">Multi-Worldview</Badge>
                <Badge variant="secondary" className="text-xs">Interactive</Badge>
                <Badge variant="secondary" className="text-xs">NLP & ML</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Project Description */}
        <section className="container pb-16">
          <div className="mx-auto max-w-4xl space-y-8">
            <Card className="p-8 space-y-8 border-2 shadow-lg">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">The Project</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p className="text-base">
                    TruthSplit is a cutting-edge analytical platform developed as part of a Bachelor's project, 
                    designed to illuminate how different ideological perspectives interpret and reason about the same arguments. 
                    In an era of increasing polarization, understanding the root causes of disagreement—whether they stem from 
                    conflicting values, different assumptions, or divergent logical pathways—is more crucial than ever.
                  </p>
                  <p className="text-base">
                    Our system leverages state-of-the-art natural language processing, large language models, and machine learning 
                    to provide deep, nuanced analysis of arguments through multiple worldview lenses. By combining traditional NLP 
                    techniques with modern LLM reasoning capabilities, TruthSplit reveals not just <em>what</em> different perspectives 
                    think, but <em>why</em> they think it—tracing reasoning from core values through beliefs to conclusions.
                  </p>
                  <p className="text-base">
                    TruthSplit supports both privacy-conscious local analysis and cloud-based processing for enhanced accuracy, 
                    making sophisticated argument analysis accessible to researchers, educators, journalists, and anyone seeking 
                    to understand the complexity of ideological discourse.
                  </p>
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-2xl font-bold">Core Features</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Intelligent Analysis
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Automatic claim and premise extraction from complex texts</li>
                      <li>• Step-by-step reasoning chains showing logical progression</li>
                      <li>• Dynamic confidence scoring based on analysis quality</li>
                      <li>• Consistency metrics (premise-claim & worldview internal)</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Network className="h-5 w-5 text-primary" />
                      Multi-Worldview Analysis
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Six distinct ideological perspectives (Libertarian, Religious Conservative, Eco-Justice, Populist Nationalist, Communist, Neo-Reactionary)</li>
                      <li>• 16-dimensional factor space mapping ideological positions</li>
                      <li>• Worldview-specific reasoning and interpretation</li>
                      <li>• Key assumptions and value alignment analysis</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Divergence & Convergence
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Comprehensive divergence analysis (value conflicts, assumption conflicts, disagreement dimensions)</li>
                      <li>• On-demand convergence flow showing where reasoning agrees/disagrees</li>
                      <li>• Primary divergence point identification</li>
                      <li>• Common ground discovery</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Advanced Visualizations
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Interactive 3D worldview space with customizable factor dimensions</li>
                      <li>• 2D scatter plots for pairwise factor analysis</li>
                      <li>• Correlation heatmaps showing ideological relationships</li>
                      <li>• Overview dashboards with summary statistics</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Interactive Worldview Chat
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Chat with AI embodiments of different worldviews</li>
                      <li>• Context-aware responses based on analysis results</li>
                      <li>• Personality-driven conversations staying true to ideological principles</li>
                      <li>• Explore claims and reasoning through dialogue</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Flexible Processing
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Multiple LLM providers (OpenAI, Anthropic via OpenRouter)</li>
                      <li>• Local NLP models for privacy-sensitive analysis</li>
                      <li>• Experimental Gemma steering with SAE (Sparse Autoencoder) technology</li>
                      <li>• Export results as JSON for further analysis</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="container pb-16">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Why TruthSplit?</h2>
              <p className="text-muted-foreground">
                Comprehensive analysis tools for understanding ideological discourse
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 space-y-4 border-2 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Deep Reasoning Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Trace how different worldviews reason from core values through beliefs to conclusions, 
                  with step-by-step logical chains that reveal the underlying thought processes.
                </p>
              </Card>

              <Card className="p-6 space-y-4 border-2 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Network className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Convergence & Divergence</h3>
                <p className="text-sm text-muted-foreground">
                  Discover exactly where worldviews agree and disagree, identifying primary divergence points 
                  and uncovering unexpected common ground through systematic analysis.
                </p>
              </Card>

              <Card className="p-6 space-y-4 border-2 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Interactive Dialogue</h3>
                <p className="text-sm text-muted-foreground">
                  Engage in conversations with AI embodiments of different worldviews, exploring their 
                  perspectives on analyzed claims through natural, context-aware dialogue.
                </p>
              </Card>

              <Card className="p-6 space-y-4 border-2 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Rich Visualizations</h3>
                <p className="text-sm text-muted-foreground">
                  Explore ideological space through interactive 3D visualizations, correlation heatmaps, 
                  and factor analysis that reveal relationships between different worldviews.
                </p>
              </Card>

              <Card className="p-6 space-y-4 border-2 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Flexible Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from multiple analysis modes: privacy-focused local models, powerful cloud LLMs, 
                  or experimental Gemma steering for cutting-edge research applications.
                </p>
              </Card>

              <Card className="p-6 space-y-4 border-2 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Scientific Rigor</h3>
                <p className="text-sm text-muted-foreground">
                  Built on established NLP techniques, validated consistency metrics, and transparent 
                  confidence scoring for research-grade analysis you can trust.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Developers Section */}
        <section className="container pb-20">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-12">The Team</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 border-2 hover:shadow-lg transition-shadow flex flex-col">
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto overflow-hidden border-2 border-primary/20">
                    {!benjaminImageError ? (
                      <img 
                        src="/images/Benjamin.JPG" 
                        alt="Benjamin Stieger"
                        className="w-full h-full object-cover"
                        onError={() => setBenjaminImageError(true)}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary">BS</span>
                    )}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">Benjamin Stieger</h3>
                    <p className="text-muted-foreground">Co-Developer</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center leading-relaxed flex-1">
                    Computer Science student with comprehensive expertise across the full technology stack. 
                    Developed the core ML and NLP pipelines, LLM integration, backend architecture, and frontend 
                    interface. Responsible for the complete system architecture and implementation.
                  </p>
                  
                  <div className="flex justify-center gap-4 pt-4 mt-auto">
                    <a 
                      href="https://www.linkedin.com/in/benjaminstieger" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a 
                      href="mailto:benjamin.stieger@student.unisg.ch"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Email"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-2 hover:shadow-lg transition-shadow flex flex-col">
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto overflow-hidden border-2 border-primary/20">
                    {!maxImageError ? (
                      <img 
                        src="/images/Max.png" 
                        alt="Maximilian Terberger"
                        className="w-full h-full object-cover"
                        onError={() => setMaxImageError(true)}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary">MT</span>
                    )}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">Maximilian Terberger</h3>
                    <p className="text-muted-foreground">Co-Developer</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center leading-relaxed flex-1">
                    Computer Science student specializing in model steering experimentation and user studies. 
                    Conducted research on Gemma steering with Sparse Autoencoders (SAE) and performed comprehensive 
                    user experience evaluation and testing.
                  </p>
                  
                  <div className="flex justify-center gap-4 pt-4 mt-auto">
                    <a 
                      href="https://www.linkedin.com/in/maximilian-terberger-b33159257" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a 
                      href="mailto:maximilian.terberger@student.unisg.ch"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Email"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Technical Stack */}
        <section className="bg-muted/30 py-16">
          <div className="container">
            <div className="mx-auto max-w-4xl space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Technical Stack</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Built with cutting-edge technologies, modern frameworks, and industry best practices 
                  to deliver a robust, scalable, and user-friendly analytical platform
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 space-y-3 border-2 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    Frontend Framework
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>React 18</strong> with TypeScript</li>
                    <li>• <strong>Vite</strong> for ultra-fast build tooling</li>
                    <li>• <strong>TailwindCSS</strong> for utility-first styling</li>
                    <li>• <strong>Radix UI</strong> for accessible components</li>
                    <li>• <strong>React Router</strong> for navigation</li>
                    <li>• <strong>React Three Fiber</strong> for 3D visualizations</li>
                  </ul>
                </Card>
                
                <Card className="p-6 space-y-3 border-2 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Data Visualization
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Recharts</strong> for interactive charts</li>
                    <li>• <strong>Plotly.js</strong> for advanced plots</li>
                    <li>• <strong>Three.js</strong> via React Three Fiber</li>
                    <li>• <strong>@react-three/drei</strong> for 3D helpers</li>
                    <li>• Custom correlation heatmaps</li>
                    <li>• Interactive scatter & 3D space plots</li>
                  </ul>
                </Card>
                
                <Card className="p-6 space-y-3 border-2 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Backend Framework
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Python 3.12</strong> with Flask</li>
                    <li>• <strong>Flask-CORS</strong> for cross-origin support</li>
                    <li>• RESTful API architecture</li>
                    <li>• Modular pipeline design</li>
                    <li>• Docker containerization</li>
                    <li>• Nginx reverse proxy</li>
                  </ul>
                </Card>
                
                <Card className="p-6 space-y-3 border-2 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Machine Learning
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>PyTorch</strong> for deep learning</li>
                    <li>• <strong>Transformers</strong> (HuggingFace)</li>
                    <li>• <strong>Sentence Transformers</strong> for embeddings</li>
                    <li>• <strong>BART-large-mnli</strong> for NLI</li>
                    <li>• <strong>MiniLM</strong> for semantic search</li>
                    <li>• <strong>scikit-learn</strong> for ML utilities</li>
                  </ul>
                </Card>
                
                <Card className="p-6 space-y-3 border-2 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    LLM Integration
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>OpenRouter</strong> for unified LLM access</li>
                    <li>• Support for multiple providers: <strong>OpenAI</strong>, <strong>Anthropic Claude</strong>, <strong>Google Gemini</strong>, <strong>xAI Grok</strong>, <strong>DeepSeek</strong></li>
                    <li>• Structured JSON schema outputs</li>
                    <li>• Temperature & token control</li>
                    <li>• Error handling & retries</li>
                    <li>• Model selection flexibility</li>
                  </ul>
                </Card>
                
                <Card className="p-6 space-y-3 border-2 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Advanced Features
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Gemma 2B</strong> with SAE steering</li>
                    <li>• <strong>sae-lens</strong> for sparse autoencoders</li>
                    <li>• Zero-shot classification</li>
                    <li>• Natural Language Inference</li>
                    <li>• BM25 for assumption retrieval</li>
                    <li>• Factor space PCA analysis</li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
