import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plug, Plus, Trash2, TestTube, Calendar, DollarSign, Key, ExternalLink } from "lucide-react";

export default function Integrations() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: integrations, isLoading, refetch } = trpc.integrations.list.useQuery();
  
  const deleteIntegration = trpc.integrations.delete.useMutation({
    onSuccess: () => {
      toast.success("Integration removed");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const testIntegration = trpc.integrations.test.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-100 text-green-800";
      case "error": return "bg-red-100 text-red-800";
      case "expired": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider.includes("calendar")) return <Calendar className="h-5 w-5" />;
    if (provider.includes("quickbooks")) return <DollarSign className="h-5 w-5" />;
    return <Key className="h-5 w-5" />;
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect third-party services to enhance your business operations
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <AddIntegrationForm onSuccess={() => { setShowAddDialog(false); refetch(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* OAuth Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            OAuth Integrations
          </CardTitle>
          <CardDescription>
            Connect with popular services using secure OAuth authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <OAuthIntegrationCard
              provider="google_calendar"
              name="Google Calendar"
              description="Sync bookings with Google Calendar"
              icon={<Calendar className="h-8 w-8 text-blue-600" />}
              connected={Boolean(integrations?.some(i => i.provider === "google_calendar" && i.status === "connected"))}
            />
            <OAuthIntegrationCard
              provider="quickbooks"
              name="QuickBooks"
              description="Sync payments and invoices"
              icon={<DollarSign className="h-8 w-8 text-green-600" />}
              connected={Boolean(integrations?.some(i => i.provider === "quickbooks" && i.status === "connected"))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Integrations</CardTitle>
          <CardDescription>
            API integrations you&apos;ve configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrations && integrations.length > 0 ? (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getProviderIcon(integration.provider)}
                    <div>
                      <div className="font-semibold">{integration.name}</div>
                      <div className="text-sm text-muted-foreground">{integration.provider}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testIntegration.mutate({ id: integration.id })}
                      disabled={testIntegration.isPending}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteIntegration.mutate({ id: integration.id })}
                      disabled={deleteIntegration.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            ) : (
            <div className="text-center py-8 text-muted-foreground">
              No custom integrations yet. Click Add Integration to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OAuthIntegrationCard(props: {
  provider?: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
}) {
  const { name, description, icon, connected } = props;
  return (
    <div className="border rounded-lg p-4 flex items-start gap-4">
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold mb-1">{name}</div>
        <div className="text-sm text-muted-foreground mb-3">{description}</div>
        {connected ? (
          <Badge className="bg-green-100 text-green-800">Connected</Badge>
        ) : (
          <Button size="sm" variant="outline" disabled>
            <ExternalLink className="h-4 w-4 mr-2" />
            Connect (Coming Soon)
          </Button>
        )}
      </div>
    </div>
  );
}

function AddIntegrationForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const createIntegration = trpc.integrations.createCustom.useMutation({
    onSuccess: () => {
      toast.success("Integration added successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIntegration.mutate({
      name,
      provider,
      apiKey: apiKey || undefined,
      apiSecret: apiSecret || undefined,
      baseUrl: baseUrl || undefined,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Custom Integration</DialogTitle>
        <DialogDescription>
          Configure a custom API integration with your credentials
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="name">Integration Name</Label>
          <Input
            id="name"
            placeholder="e.g., My CRM System"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="provider">Provider ID</Label>
          <Input
            id="provider"
            placeholder="e.g., my_crm"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Unique identifier for this integration (lowercase, no spaces)
          </p>
        </div>
        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="apiSecret">API Secret (Optional)</Label>
          <Input
            id="apiSecret"
            type="password"
            placeholder="Your API secret"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="baseUrl">Base URL (Optional)</Label>
          <Input
            id="baseUrl"
            type="url"
            placeholder="https://api.example.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createIntegration.isPending}>
            {createIntegration.isPending ? "Adding..." : "Add Integration"}
          </Button>
        </div>
      </form>
    </>
  );
}
