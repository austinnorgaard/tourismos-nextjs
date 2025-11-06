'use client';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, TrendingUp, TrendingDown, Building2, Calendar, Package, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SellerAdmin() {
  const { user } = useAuth();
  const isSellerAdmin = user?.role === "seller_admin";

  const { data: revenueMetrics, isLoading: revenueLoading } = trpc.sellerAdmin.getRevenueMetrics.useQuery(undefined, { enabled: isSellerAdmin });
  const { data: activeSubscriptions, isLoading: subsLoading } = trpc.sellerAdmin.getActiveSubscriptionsCount.useQuery(undefined, { enabled: isSellerAdmin });
  const { data: allSubscriptions = [], isLoading: allSubsLoading } = trpc.sellerAdmin.getAllSubscriptions.useQuery(undefined, { enabled: isSellerAdmin });
  const { data: platformStats, isLoading: statsLoading } = trpc.sellerAdmin.getPlatformStats.useQuery(undefined, { enabled: isSellerAdmin });
  const { data: churnMetrics, isLoading: churnLoading } = trpc.sellerAdmin.getChurnMetrics.useQuery(undefined, { enabled: isSellerAdmin });
  const { data: recentSignups = [], isLoading: signupsLoading } = trpc.sellerAdmin.getRecentSignups.useQuery({ limit: 10 }, { enabled: isSellerAdmin });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      cancelled: "destructive",
      past_due: "destructive",
      expired: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      starter: "bg-blue-100 text-blue-800",
      professional: "bg-purple-100 text-purple-800",
      enterprise: "bg-amber-100 text-amber-800",
    };
    return (
      <Badge className={colors[plan] || ""}  variant="outline">
        {plan}
      </Badge>
    );
  };

  // Access control check
  if (!isSellerAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only seller admins can access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seller Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Norgaard Enterprises - Platform Overview
        </p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(revenueMetrics?.mrr || 0)}</div>
                <p className="text-xs text-muted-foreground">MRR from active subscriptions</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(revenueMetrics?.arr || 0)}</div>
                <p className="text-xs text-muted-foreground">ARR projection</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {subsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">Paying customers</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {churnLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{churnMetrics?.churnRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {churnMetrics?.cancelledCount || 0} cancelled
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{platformStats?.totalBusinesses || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{platformStats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{platformStats?.totalBookings || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offerings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{platformStats?.totalOfferings || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Signups */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Signups</CardTitle>
          <CardDescription>Latest businesses that joined the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {signupsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentSignups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No signups yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner Email</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSignups.map((signup) => (
                  <TableRow key={signup.id}>
                    <TableCell className="font-medium">{signup.name}</TableCell>
                    <TableCell className="capitalize">{signup.type?.replace("_", " ")}</TableCell>
                    <TableCell>{signup.ownerEmail}</TableCell>
                    <TableCell>{formatDate(signup.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>Complete list of customer subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {allSubsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : allSubscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No subscriptions yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MRR</TableHead>
                  <TableHead>Current Period</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.businessName || "N/A"}</TableCell>
                    <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>{formatCurrency((sub.mrr || 0) / 100)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
                    </TableCell>
                    <TableCell>{formatDate(sub.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
