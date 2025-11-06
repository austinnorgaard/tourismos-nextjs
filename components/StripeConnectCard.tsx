import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, Unplug } from "lucide-react";
import { toast } from "sonner";

export function StripeConnectCard() {
  const { data: status, isLoading } = trpc.payment.getConnectAccountStatus.useQuery();
  const utils = trpc.useUtils();

  const createAccountMutation = trpc.payment.createConnectAccount.useMutation({
    onSuccess: async () => {
      // After creating account, get the onboarding link
      const linkResult = await utils.client.payment.createConnectAccountLink.mutate();
      if (linkResult.url) {
        window.location.href = linkResult.url;
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createLinkMutation = trpc.payment.createConnectAccountLink.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const disconnectMutation = trpc.payment.disconnectAccount.useMutation({
    onSuccess: () => {
      toast.success("Stripe account disconnected");
      utils.payment.getConnectAccountStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleConnect = () => {
    if (status?.connected) {
      // Resume onboarding
      createLinkMutation.mutate();
    } else {
      // Create new account
      createAccountMutation.mutate();
    }
  };

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect your Stripe account? This will stop all payment processing.")) {
      disconnectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Connect</CardTitle>
        <CardDescription>
          Connect your Stripe account to receive payments directly from bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.connected ? (
          // Not connected
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">No payment account connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect a Stripe account to start accepting payments for bookings
                </p>
              </div>
            </div>
            <Button 
              onClick={handleConnect}
              disabled={createAccountMutation.isPending}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {createAccountMutation.isPending ? "Connecting..." : "Connect Stripe Account"}
            </Button>
          </div>
        ) : status.onboardingComplete ? (
          // Fully connected and onboarded
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-green-900">Stripe account connected</p>
                <p className="text-sm text-green-700">
                  Your account is fully set up and ready to receive payments
                </p>
                <div className="text-xs text-green-600 mt-2 space-y-1">
                  <div>Account ID: {status.accountId}</div>
                  <div className="flex gap-4">
                    <span>✓ Charges enabled</span>
                    <span>✓ Payouts enabled</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleConnect}
                disabled={createLinkMutation.isPending}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Stripe Account
              </Button>
              <Button 
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          // Connected but onboarding incomplete
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900">Onboarding incomplete</p>
                <p className="text-sm text-yellow-700">
                  Complete your Stripe account setup to start receiving payments
                </p>
                <div className="text-xs text-yellow-600 mt-2 space-y-1">
                  <div>Account ID: {status.accountId}</div>
                  <div className="flex gap-4">
                    <span>{status.chargesEnabled ? "✓" : "○"} Charges</span>
                    <span>{status.payoutsEnabled ? "✓" : "○"} Payouts</span>
                    <span>{status.detailsSubmitted ? "✓" : "○"} Details</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleConnect}
                disabled={createLinkMutation.isPending}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {createLinkMutation.isPending ? "Loading..." : "Complete Onboarding"}
              </Button>
              <Button 
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
