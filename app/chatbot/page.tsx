'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bot, Plus, Trash2, MessageSquare, Code } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function Chatbot() {
  const [testMessage, setTestMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [conversationId, setConversationId] = useState<number | undefined>();

  const { data: business } = trpc.business.get.useQuery();
  const { data: knowledgeBase, isLoading } = trpc.knowledgeBase.list.useQuery();
  const utils = trpc.useUtils();

  const sendMessageMutation = trpc.chatbot.sendMessage.useMutation({
    onSuccess: (data) => {
      setChatHistory(prev => [
        ...prev,
        { role: "assistant", content: data.message }
      ]);
      setConversationId(data.conversationId);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleTestMessage = () => {
    if (!testMessage.trim() || !business) return;

    setChatHistory(prev => [
      ...prev,
      { role: "user", content: testMessage }
    ]);

    sendMessageMutation.mutate({
      businessId: business.id,
      message: testMessage,
      conversationId,
    });

    setTestMessage("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Chatbot</h1>
        <p className="text-muted-foreground">Configure your AI assistant and knowledge base</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Knowledge Base */}
        <div className="space-y-4">
          <KnowledgeBaseManager />
        </div>

        {/* Chatbot Test Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Test Your Chatbot
            </CardTitle>
            <CardDescription>
              Try out your AI assistant with sample questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chat History */}
              <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Start a conversation to test your chatbot</p>
                  </div>
                ) : (
                  chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTestMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2 border rounded-md"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleTestMessage}
                  disabled={sendMessageMutation.isPending || !testMessage.trim()}
                >
                  Send
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChatHistory([]);
                  setConversationId(undefined);
                }}
                className="w-full"
              >
                Clear Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Embed Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Embed Chatbot on Your Website
          </CardTitle>
          <CardDescription>
            Copy and paste this code into your website to add the chatbot widget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <code className="text-sm">
              {`<!-- TourismOS Chatbot Widget -->
<script>
  window.tourismOSConfig = {
    businessId: ${business?.id || 'YOUR_BUSINESS_ID'},
    position: 'bottom-right',
    theme: 'light'
  };
</script>
<script src="https://cdn.tourismos.com/widget.js"></script>`}
            </code>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Note: The chatbot widget is coming soon. This embed code will be functional once the widget is released.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KnowledgeBaseManager() {
  const { data: knowledgeBase, isLoading } = trpc.knowledgeBase.list.useQuery();
  const [isAdding, setIsAdding] = useState(false);
  const utils = trpc.useUtils();

  const createKBMutation = trpc.knowledgeBase.create.useMutation({
    onSuccess: () => {
      toast.success("Knowledge added successfully");
      utils.knowledgeBase.list.invalidate();
      setIsAdding(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteKBMutation = trpc.knowledgeBase.delete.useMutation({
    onSuccess: () => {
      toast.success("Knowledge deleted successfully");
      utils.knowledgeBase.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createKBMutation.mutate({
      content: formData.get("content") as string,
      category: formData.get("category") as string,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Knowledge Base
        </CardTitle>
        <CardDescription>
          Train your chatbot with information about your business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {knowledgeBase && knowledgeBase.length > 0 ? (
                <div className="space-y-2">
                  {knowledgeBase.map((kb) => (
                    <div key={kb.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {kb.category && (
                            <span className="text-xs text-muted-foreground">{kb.category}</span>
                          )}
                          <p className="text-sm mt-1">{kb.content}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this knowledge entry?')) {
                              deleteKBMutation.mutate({ id: kb.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No knowledge entries yet. Add information to help your chatbot answer questions.
                </p>
              )}

              {isAdding ? (
                <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category (optional)</label>
                    <input
                      type="text"
                      name="category"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="FAQ, Policies, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Content *</label>
                    <textarea
                      name="content"
                      required
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Add information about your business, policies, offerings, etc."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={createKBMutation.isPending}>
                      {createKBMutation.isPending ? "Adding..." : "Add"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAdding(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button onClick={() => setIsAdding(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Knowledge
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
