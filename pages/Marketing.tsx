import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Mail, MessageSquare, Sparkles, Copy, Check, Users, TrendingUp, Send, Eye, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function Marketing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing Hub</h1>
        <p className="text-muted-foreground">AI-powered marketing tools to grow your business</p>
      </div>

      <CustomerSegments />
      <CampaignPerformance />

      <div className="grid md:grid-cols-2 gap-6">
        <EmailGenerator />
        <SocialPostGenerator />
      </div>
    </div>
  );
}

function EmailGenerator() {
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateEmailMutation = trpc.ai.generateEmail.useMutation({
    onSuccess: (data) => {
      setGeneratedEmail(data);
      toast.success("Email generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    generateEmailMutation.mutate({
      goal: formData.get("goal") as string,
      targetAudience: formData.get("targetAudience") as string,
      keyMessage: formData.get("keyMessage") as string,
    });
  };

  const copyToClipboard = () => {
    if (generatedEmail) {
      const text = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          AI Email Generator
        </CardTitle>
        <CardDescription>
          Create professional marketing emails with AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Goal</label>
            <input
              type="text"
              name="goal"
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Promote summer tour packages"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Audience</label>
            <input
              type="text"
              name="targetAudience"
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Families visiting Montana"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Key Message</label>
            <textarea
              name="keyMessage"
              required
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="20% off all tours booked this month"
            />
          </div>

          <Button 
            type="submit" 
            disabled={generateEmailMutation.isPending}
            className="w-full"
          >
            {generateEmailMutation.isPending ? (
              <>Generating...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>
        </form>

        {generatedEmail && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Generated Email</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Subject:</p>
                <p className="font-medium">{generatedEmail.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Body:</p>
                <div className="text-sm whitespace-pre-wrap">{generatedEmail.body}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomerSegments() {
  const { data: bookings } = trpc.bookings.list.useQuery();

  // Calculate customer segments
  const segments = {
    total: bookings?.length || 0,
    newCustomers: bookings?.filter(b => {
      const bookingDate = new Date(b.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return bookingDate >= thirtyDaysAgo;
    }).length || 0,
    repeatCustomers: (() => {
      const emailCounts = new Map<string, number>();
      bookings?.forEach(b => {
        emailCounts.set(b.customerEmail, (emailCounts.get(b.customerEmail) || 0) + 1);
      });
      return Array.from(emailCounts.values()).filter(count => count > 1).length;
    })(),
    highValue: bookings?.filter(b => b.totalAmount >= 20000).length || 0, // $200+
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Segments
        </CardTitle>
        <CardDescription>
          Understand your customer base for targeted marketing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
            <p className="text-2xl font-bold">{segments.total}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">New (30 days)</p>
            <p className="text-2xl font-bold text-green-600">{segments.newCustomers}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Repeat Customers</p>
            <p className="text-2xl font-bold text-blue-600">{segments.repeatCustomers}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">High Value</p>
            <p className="text-2xl font-bold text-purple-600">{segments.highValue}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h4 className="font-semibold">Segment Insights</h4>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">🎯 New Customers</p>
              <p className="text-muted-foreground">Send welcome emails and first-time booking discounts</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">💎 Repeat Customers</p>
              <p className="text-muted-foreground">Offer loyalty rewards and exclusive early access</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">⭐ High Value</p>
              <p className="text-muted-foreground">Provide VIP treatment and premium experiences</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignPerformance() {
  const { data: campaigns } = trpc.campaigns.list.useQuery();

  // Calculate performance metrics
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === 'scheduled').length || 0;
  const completedCampaigns = campaigns?.filter(c => c.status === 'sent').length || 0;

  // Mock engagement data (in production, track actual metrics)
  const mockMetrics = {
    totalSent: campaigns?.reduce((sum, c) => sum + (c.type === 'email' ? 100 : 0), 0) || 0,
    avgOpenRate: 24.5,
    avgClickRate: 3.2,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Campaign Performance
        </CardTitle>
        <CardDescription>
          Track the effectiveness of your marketing campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Campaigns</p>
            <p className="text-2xl font-bold">{totalCampaigns}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{activeCampaigns}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-bold text-blue-600">{completedCampaigns}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Emails Sent</p>
            <p className="text-2xl font-bold">{mockMetrics.totalSent}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Engagement Metrics</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="p-3 bg-background rounded-full">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Open Rate</p>
                <p className="text-2xl font-bold">{mockMetrics.avgOpenRate}%</p>
                <p className="text-xs text-green-600">Industry avg: 21.5%</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="p-3 bg-background rounded-full">
                <MousePointerClick className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Click Rate</p>
                <p className="text-2xl font-bold">{mockMetrics.avgClickRate}%</p>
                <p className="text-xs text-green-600">Industry avg: 2.6%</p>
              </div>
            </div>
          </div>

          {campaigns && campaigns.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Recent Campaigns</h4>
              <div className="space-y-2">
                {campaigns.slice(0, 3).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-3">
                      <Send className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.type.toUpperCase()} • {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      campaign.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SocialPostGenerator() {
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generatePostMutation = trpc.ai.generateSocialPost.useMutation({
    onSuccess: (data) => {
      setGeneratedPost(data.content);
      toast.success("Social post generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    generatePostMutation.mutate({
      topic: formData.get("topic") as string,
      platform: formData.get("platform") as any,
    });
  };

  const copyToClipboard = () => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Social Media Generator
        </CardTitle>
        <CardDescription>
          Create engaging social media posts for your business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Platform</label>
            <select
              name="platform"
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <textarea
              name="topic"
              required
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Announce our new glacier hiking tour with stunning views"
            />
          </div>

          <Button 
            type="submit" 
            disabled={generatePostMutation.isPending}
            className="w-full"
          >
            {generatePostMutation.isPending ? (
              <>Generating...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Post
              </>
            )}
          </Button>
        </form>

        {generatedPost && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Generated Post</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="prose prose-sm max-w-none">
                <Streamdown>{generatedPost}</Streamdown>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
