import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, FileText, ExternalLink } from "lucide-react";
import { fetchNewsArticles, NewsArticle } from "@/utils/newsApi";
import { cn } from "@/lib/utils";

interface NewsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: NewsArticle) => void;
}

export const NewsPanel = ({ isOpen, onClose, onSelectArticle }: NewsPanelProps) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadArticles();
    }
  }, [isOpen]);

  const loadArticles = async (query?: string, category?: string) => {
    setIsLoading(true);
    try {
      const fetchedArticles = await fetchNewsArticles(query, category);
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadArticles(searchQuery, selectedCategory);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    loadArticles(searchQuery, category);
  };

  const handleSelectArticle = (article: NewsArticle) => {
    onSelectArticle(article);
    onClose();
  };

  const categories = [
    { id: "", label: "All" },
    { id: "business", label: "Business" },
    { id: "technology", label: "Technology" },
    { id: "politics", label: "Politics" },
    { id: "health", label: "Health" },
    { id: "science", label: "Science" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">Get News Articles</SheetTitle>
          <SheetDescription>
            Browse and select news articles to analyze through different worldview perspectives
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategorySelect(category.id)}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Articles List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No articles found. Try a different search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  )}
                  onClick={() => handleSelectArticle(article)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {article.title}
                      </h3>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>
                    
                    {article.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {article.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {article.source}
                      </Badge>
                      {article.publishedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {article.content && (
                      <p className="text-xs text-muted-foreground line-clamp-3 mt-2">
                        {article.content.substring(0, 200)}...
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

