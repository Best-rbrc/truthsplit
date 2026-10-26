import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Eye, CheckCircle, Network, Upload, Target, BarChart3, ArrowRight } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="container py-20 md:py-32 animate-fade-in">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                Understand How Different{" "}
                <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  Worldviews
                </span>{" "}
                Shape Arguments
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Analyze text through multiple philosophical perspectives and discover where reasoning diverges
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/analyze">
                <Button size="lg" className="text-lg px-8">
                  Start Analysis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <a href="#how-it-works">How it Works</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-20 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powerful Analysis Tools
              </h2>
              <p className="text-xl text-muted-foreground">
                Understand arguments from every angle
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow animate-slide-up">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Multi-Perspective Analysis</h3>
                <p className="text-muted-foreground">
                  Analyze arguments through libertarian, conservative, eco-justice, and nationalist lenses
                </p>
              </Card>

              <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <div className="h-12 w-12 rounded-lg bg-support/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-support" />
                </div>
                <h3 className="text-xl font-semibold">Logical Consistency Checking</h3>
                <p className="text-muted-foreground">
                  Identify logical relationships between premises and claims across worldviews
                </p>
              </Card>

              <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="h-12 w-12 rounded-lg bg-conditional/10 flex items-center justify-center">
                  <Network className="h-6 w-6 text-conditional" />
                </div>
                <h3 className="text-xl font-semibold">Divergence Mapping</h3>
                <p className="text-muted-foreground">
                  Visualize where and why different worldviews reach different conclusions
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-xl text-muted-foreground">
                Simple process, powerful insights
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">1. Upload Text</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste or upload the text you want to analyze
                  </p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-support/10 flex items-center justify-center">
                  <Target className="h-8 w-8 text-support" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">2. Select Worldviews</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which perspectives to analyze through
                  </p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-conditional/10 flex items-center justify-center">
                  <Network className="h-8 w-8 text-conditional" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">3. AI Analyzes</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI identifies claims and analyzes reasoning
                  </p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-oppose/10 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-oppose" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">4. Explore Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Review detailed analysis and visualizations
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link to="/analyze">
                <Button size="lg">
                  Try It Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
