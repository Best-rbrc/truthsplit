import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, User, Bot } from "lucide-react";
import { AnalysisResult, Worldview } from "@/types/analysis";
import { worldviews } from "@/data/worldviews";
import { sendChatMessage } from "@/utils/analysisApi";
import { MarkdownText } from "./MarkdownText";

interface WorldviewChatProps {
  result: AnalysisResult;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const WorldviewChat = ({ result }: WorldviewChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorldview, setSelectedWorldview] = useState<Worldview | null>(null);
  const [isWorldviewLocked, setIsWorldviewLocked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getWorldviewInfo = (worldviewId: Worldview) => {
    return worldviews.find((w) => w.id === worldviewId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStartChat = () => {
    if (!selectedWorldview) return;
    setIsWorldviewLocked(true);
    setMessages([]);
    setError(null);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedWorldview || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setError(null);

    // Add user message to chat
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Prepare analysis context
      const analysisContext = {
        claims: result.claims.map(claim => ({
          claim_text: claim.claim_text,
          premises: claim.premises,
          worldview_analyses: Object.fromEntries(
            Object.entries(claim.worldview_analyses).map(([wvId, analysis]) => [
              wvId,
              {
                stance: analysis.stance,
                reasoning: analysis.reasoning,
                interpretation: analysis.interpretation,
                key_assumptions: analysis.key_assumptions
              }
            ])
          )
        }))
      };

      // Send message to API
      const response = await sendChatMessage(
        selectedWorldview,
        userMessage,
        messages,
        analysisContext
      );

      // Add assistant response
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setIsWorldviewLocked(false);
    setSelectedWorldview(null);
    setMessages([]);
    setError(null);
  };

  const worldviewInfo = selectedWorldview ? getWorldviewInfo(selectedWorldview) : null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 hover:scale-110"
          style={{ 
            backgroundColor: worldviewInfo?.color || '#3b82f6',
            boxShadow: `0 10px 40px -10px ${worldviewInfo?.color || '#3b82f6'}80`
          }}
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col border-l-2" style={{ borderLeftColor: worldviewInfo?.color || '#3b82f6' }}>
        <SheetHeader className="px-6 py-5 border-b bg-gradient-to-r from-background to-muted/30">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${worldviewInfo?.color || '#3b82f6'}20` }}
            >
              <MessageCircle className="h-5 w-5" style={{ color: worldviewInfo?.color || '#3b82f6' }} />
            </div>
            Chat with Worldview
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/10">
          {!isWorldviewLocked ? (
            // Worldview Selector
            <div className="flex-1 p-8 flex flex-col items-center justify-center gap-8">
              <div className="text-center space-y-3 max-w-lg">
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-2">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Select a Worldview</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Choose which ideological perspective you'd like to discuss the analyzed claims with. 
                  Each worldview will engage with you based on its core values and principles.
                </p>
              </div>

              <div className="w-full max-w-lg space-y-5">
                <Select
                  value={selectedWorldview || undefined}
                  onValueChange={(value) => setSelectedWorldview(value as Worldview)}
                >
                  <SelectTrigger className="w-full h-12 text-base border-2 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Choose a worldview to begin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {worldviews.map((wv) => (
                      <SelectItem key={wv.id} value={wv.id} className="py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full ring-2 ring-offset-2 ring-offset-background"
                            style={{ backgroundColor: wv.color, ringColor: `${wv.color}40` }}
                          />
                          <span className="font-medium">{wv.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedWorldview && worldviewInfo && (
                  <Card className="p-5 border-2 shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" 
                        style={{ 
                          borderColor: worldviewInfo.color,
                          boxShadow: `0 8px 32px -8px ${worldviewInfo.color}40`
                        }}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                          style={{ backgroundColor: worldviewInfo.color }}
                        >
                          {worldviewInfo.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{worldviewInfo.name}</h4>
                          <p className="text-xs text-muted-foreground">Ideological Perspective</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{worldviewInfo.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                        {worldviewInfo.keyValues.map((value, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs font-medium px-2.5 py-1"
                            style={{ 
                              backgroundColor: `${worldviewInfo.color}15`,
                              color: worldviewInfo.color,
                              borderColor: `${worldviewInfo.color}30`
                            }}
                          >
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                <Button
                  onClick={handleStartChat}
                  disabled={!selectedWorldview}
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                  style={selectedWorldview ? { 
                    backgroundColor: worldviewInfo?.color,
                    boxShadow: `0 4px 24px -4px ${worldviewInfo?.color}60`
                  } : undefined}
                >
                  Start Conversation →
                </Button>
              </div>
            </div>
          ) : (
            // Chat Interface
            <>
              {/* Chat Header */}
              {worldviewInfo && (
                <div className="px-6 py-4 border-b backdrop-blur-sm bg-gradient-to-r from-muted/30 to-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ backgroundColor: worldviewInfo.color }}
                      >
                        {worldviewInfo.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-base">{worldviewInfo.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <p className="text-xs text-muted-foreground">Active</p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleReset}
                      className="border-2 hover:border-primary/50"
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scroll-smooth">
                {messages.length === 0 && (
                  <div className="text-center py-12 space-y-4">
                    <div className="inline-flex p-4 rounded-2xl bg-muted/50">
                      <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-medium">Start the conversation</p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Ask about the analyzed claims, their premises, or explore this worldview's perspective on the topics.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-md"
                        style={{ backgroundColor: worldviewInfo?.color }}
                      >
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <Card
                      className={`max-w-[82%] p-4 shadow-sm transition-all duration-200 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
                          : 'bg-muted/70 border-2 rounded-2xl rounded-tl-sm'
                      }`}
                      style={msg.role === 'assistant' ? { borderColor: `${worldviewInfo?.color}30` } : undefined}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <MarkdownText content={msg.content} className="text-sm leading-relaxed" />
                      )}
                    </Card>
                    {msg.role === 'user' && (
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shrink-0 shadow-md">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 justify-start animate-in fade-in">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-md"
                      style={{ backgroundColor: worldviewInfo?.color }}
                    >
                      <Bot className="h-4 w-4" />
                    </div>
                    <Card className="bg-muted/70 border-2 p-4 rounded-2xl rounded-tl-sm" style={{ borderColor: `${worldviewInfo?.color}30` }}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: worldviewInfo?.color }} />
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </Card>
                  </div>
                )}

                {error && (
                  <Card className="p-3 bg-red-50 dark:bg-red-950/20 border-red-300">
                    <p className="text-sm text-red-600">{error}</p>
                  </Card>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-5 border-t bg-gradient-to-t from-muted/20 to-background backdrop-blur-sm">
                <div className="flex gap-3">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message... (Shift+Enter for new line)"
                    className="min-h-[64px] max-h-[140px] resize-none border-2 focus:border-primary/50 rounded-xl text-sm"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || loading}
                    size="icon"
                    className="h-[64px] w-[64px] shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    style={worldviewInfo && inputMessage.trim() ? { 
                      backgroundColor: worldviewInfo.color,
                      boxShadow: `0 4px 20px -4px ${worldviewInfo.color}60`
                    } : undefined}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

