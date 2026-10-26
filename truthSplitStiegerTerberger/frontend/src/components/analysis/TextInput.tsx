import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowRight, FileText, Upload, Loader2, Newspaper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NewsPanel } from "./NewsPanel";
import { NewsArticle } from "@/utils/newsApi";

interface TextInputProps {
  onContinue: (text: string) => void;
  isLoading?: boolean;
  initialValue?: string;
  onArticleSelect?: (article: NewsArticle) => void;
}

const exampleTexts = [
  {
    title: "Universal Basic Income Debate",
    text: "The government should implement universal basic income. Automation is eliminating many jobs, and people need financial security to pursue meaningful work. This would reduce poverty and give people more freedom to choose their own path."
  },
  {
    title: "Climate Change Policy",
    text: "Climate change requires immediate government action. The scientific consensus shows accelerating warming. Market solutions have proven insufficient to address this existential threat. We must regulate emissions, invest in green infrastructure, and transition away from fossil fuels."
  }
];

export const TextInput = ({ onContinue, isLoading = false, initialValue = "", onArticleSelect }: TextInputProps) => {
  const [text, setText] = useState(initialValue);
  const [isUploading, setIsUploading] = useState(false);
  const [isNewsPanelOpen, setIsNewsPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isValid = text.trim().length > 0;

  // Update text when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
    }
  }, [initialValue]);

  const handleArticleSelect = (article: NewsArticle) => {
    // Combine title, description, and content for analysis
    const articleText = [
      article.title,
      article.description,
      article.content
    ].filter(Boolean).join('\n\n');
    
    setText(articleText);
    setIsNewsPanelOpen(false);
    
    if (onArticleSelect) {
      onArticleSelect(article);
    }
  };

  const loadExample = (exampleText: string) => {
    setText(exampleText);
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Dynamically import pdfjs-dist to avoid bundle bloat
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Check file type
    if (!fileExtension || !['txt', 'pdf'].includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt or .pdf file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let fileContent: string;

      if (fileExtension === 'pdf') {
        toast({
          title: "Processing PDF",
          description: "Extracting text from PDF file...",
        });
        fileContent = await extractTextFromPDF(file);
      } else {
        fileContent = await file.text();
      }

      setText(fileContent);
      toast({
        title: "File uploaded successfully",
        description: `Loaded ${file.name} (${fileContent.length} characters)`,
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Error reading file",
        description: error instanceof Error ? error.message : "Failed to read the file content",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Enter Text to Analyze</h2>
        <p className="text-muted-foreground">
          Paste or type the text you'd like to analyze through different worldview perspectives.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your Text</label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewsPanelOpen(true)}
                className="flex items-center gap-2"
              >
                <Newspaper className="h-4 w-4" />
                Get News
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload file
                  </>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                {text.length} characters
              </span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <Textarea
            placeholder="Enter the text you want to analyze or upload a .txt or .pdf file..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[300px] resize-none"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Or try an example:</p>
          <div className="grid gap-3 md:grid-cols-2">
            {exampleTexts.map((example, index) => (
              <Card
                key={index}
                className="p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => loadExample(example.text)}
              >
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-medium">{example.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {example.text}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!isValid || isLoading}
          onClick={() => onContinue(text)}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
              Extracting Claims...
            </>
          ) : (
            <>
              Continue to Claim Selection
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      <NewsPanel
        isOpen={isNewsPanelOpen}
        onClose={() => setIsNewsPanelOpen(false)}
        onSelectArticle={handleArticleSelect}
      />
    </div>
  );
};
