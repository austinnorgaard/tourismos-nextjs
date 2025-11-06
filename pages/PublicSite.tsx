import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Globe, Rocket, ExternalLink, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function PublicSite() {
  const { data: deployment, isLoading, refetch } = trpc.deployment.get.useQuery();
  const deployMutation = trpc.deployment.deploy.useMutation({
    onSuccess: () => {
      toast.success("Site deployed successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addDomainMutation = trpc.deployment.addDomain.useMutation({
    onSuccess: () => {
      toast.success("Custom domain added successfully!");
      setCustomDomain("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeDomainMutation = trpc.deployment.removeDomain.useMutation({
    onSuccess: () => {
      toast.success("Custom domain removed successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.deployment.delete.useMutation({
    onSuccess: () => {
      toast.success("Deployment deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [customDomain, setCustomDomain] = useState("");

  const handleDeploy = () => {
    if (confirm("Deploy your public booking site? This may take a few minutes.")) {
      deployMutation.mutate();
    }
  };

  const handleAddDomain = () => {
    if (!customDomain) {
      toast.error("Please enter a domain name");
      return;
    }
    addDomainMutation.mutate({ domain: customDomain });
  };

  const handleRemoveDomain = () => {
    if (confirm("Remove custom domain? Your site will still be accessible via the default subdomain.")) {
      removeDomainMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (confirm("Delete your public site deployment? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "deploying":
      case "updating":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "deployed":
        return "Live";
      case "deploying":
        return "Deploying...";
      case "updating":
        return "Updating...";
      case "failed":
        return "Failed";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Public Booking Site</h1>
        <p className="text-muted-foreground">
          Deploy and manage your public-facing booking website
        </p>
      </div>

      {/* Deployment Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Deployment Status
          </CardTitle>
          <CardDescription>
            Your public booking site status and URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!deployment ? (
            <div className="text-center py-8">
              <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Deployment Yet</h3>
              <p className="text-muted-foreground mb-4">
                Deploy your public booking site to start accepting bookings online
              </p>
              <Button
                onClick={handleDeploy}
                disabled={deployMutation.isPending}
                size="lg"
              >
                {deployMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy Site
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(deployment.status)}
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      {getStatusText(deployment.status)}
                    </p>
                  </div>
                </div>
                {deployment.status === "deployed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeploy}
                    disabled={deployMutation.isPending}
                  >
                    {deployMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Redeploying...
                      </>
                    ) : (
                      "Redeploy"
                    )}
                  </Button>
                )}
              </div>

              {/* Error Message */}
              {deployment.status === "failed" && deployment.errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {deployment.errorMessage}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeploy}
                    disabled={deployMutation.isPending}
                    className="mt-2"
                  >
                    Retry Deployment
                  </Button>
                </div>
              )}

              {/* URLs */}
              {deployment.deploymentUrl && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Default URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={deployment.deploymentUrl}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(deployment.deploymentUrl!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {deployment.domain && (
                    <div>
                      <label className="text-sm font-medium">Custom Domain</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={`https://${deployment.domain}`}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(`https://${deployment.domain}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveDomain}
                          disabled={removeDomainMutation.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Last Deployed */}
              {deployment.lastDeployedAt && (
                <p className="text-sm text-muted-foreground">
                  Last deployed: {new Date(deployment.lastDeployedAt).toLocaleString()}
                </p>
              )}

              {/* Delete Deployment */}
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Deployment"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Domain Card */}
      {deployment && deployment.status === "deployed" && !deployment.domain && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Custom Domain
            </CardTitle>
            <CardDescription>
              Connect your own domain to your public booking site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Domain Name
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="example.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                  />
                  <Button
                    onClick={handleAddDomain}
                    disabled={addDomainMutation.isPending || !customDomain}
                  >
                    {addDomainMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Domain"
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">DNS Configuration</h4>
                <p className="text-sm text-blue-800 mb-2">
                  After adding your domain, configure these DNS records:
                </p>
                <div className="space-y-1 text-sm font-mono text-blue-900">
                  <p>Type: CNAME</p>
                  <p>Name: @ (or your subdomain)</p>
                  <p>Value: cname.vercel-dns.com</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>1. Deploy:</strong> Click Deploy Site to create your public booking website.
            Your site will be automatically deployed with your business branding, offerings, and booking system.
          </p>
          <p>
            <strong>2. Share:</strong> Share your deployment URL with customers so they can view your offerings and make bookings.
          </p>
          <p>
            <strong>3. Custom Domain (Optional):</strong> Connect your own domain name for a professional branded experience.
          </p>
          <p>
            <strong>4. Automatic Updates:</strong> When you update your business info, offerings, or branding in the dashboard,
            click Redeploy to update your public site.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
