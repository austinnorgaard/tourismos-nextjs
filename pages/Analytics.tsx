import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Sparkles,
  MapPin,
  UserCheck
} from "lucide-react";
import dynamic from 'next/dynamic';
const Streamdown = dynamic(() => import('streamdown').then((m) => m.Streamdown), { ssr: false });
import { DashboardSkeleton } from "@/components/Skeletons";
import { InlineError } from "@/components/ErrorFallback";

export default function Analytics() {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = trpc.analytics.overview.useQuery();
  const { data: bookings } = trpc.bookings.list.useQuery();
  const { data: offerings } = trpc.offerings.list.useQuery();
  const { data: insights, isLoading: insightsLoading } = trpc.ai.getInsights.useQuery();

  if (analyticsLoading) {
    return <DashboardSkeleton />;
  }

  if (analyticsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">Track your business performance and get AI-powered recommendations</p>
        </div>
        <InlineError message="Failed to load analytics data. Please try again." retry={() => window.location.reload()} />
      </div>
    );
  }

  // Calculate additional metrics
  const recentBookings = bookings?.filter(booking => {
    const bookingDate = new Date(booking.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return bookingDate >= thirtyDaysAgo;
  }) || [];

  const averageBookingValue = analytics?.totalBookings 
    ? (analytics.totalRevenue / analytics.totalBookings / 100).toFixed(2)
    : "0.00";

  const conversionRate = bookings?.length 
    ? ((analytics?.confirmedBookings || 0) / bookings.length * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Insights</h1>
        <p className="text-muted-foreground">Track your business performance and get AI-powered recommendations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${((analytics?.totalRevenue || 0) / 100).toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          trend="+12.5%"
          trendUp={true}
        />
        <MetricCard
          title="Total Bookings"
          value={analytics?.totalBookings || 0}
          icon={<Calendar className="h-4 w-4" />}
          trend="+8.2%"
          trendUp={true}
        />
        <MetricCard
          title="Avg Booking Value"
          value={`$${averageBookingValue}`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend="+5.1%"
          trendUp={true}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<Users className="h-4 w-4" />}
          trend="-2.3%"
          trendUp={false}
        />
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Business Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your business data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <Streamdown>{typeof insights?.insights === 'string' ? insights.insights : "No insights available yet. Add more bookings and offerings to get personalized recommendations."}</Streamdown>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Trends */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Bookings</span>
                <span className="text-2xl font-bold">{recentBookings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Offerings</span>
                <span className="text-2xl font-bold">
                  {offerings?.filter(o => o.active).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Confirmations</span>
                <span className="text-2xl font-bold">{analytics?.pendingBookings || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Offerings</CardTitle>
            <CardDescription>Most booked services</CardDescription>
          </CardHeader>
          <CardContent>
            {offerings && offerings.length > 0 ? (
              <div className="space-y-3">
                {offerings.slice(0, 5).map((offering, index) => (
                  <div key={offering.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{offering.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(offering.price / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      offering.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {offering.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No offerings yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Customer Demographics
          </CardTitle>
          <CardDescription>Understand your customer base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Location Distribution */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Top Locations
              </h4>
              <div className="space-y-3">
                {(() => {
                  // Extract locations from bookings (mock data for demo)
                  const locationCounts = new Map<string, number>();
                  // Deterministic selection based on index to avoid impure calls during render
                  const locations = ['Kalispell, MT', 'Whitefish, MT', 'Missoula, MT', 'Bozeman, MT', 'Great Falls, MT'];
                  bookings?.forEach((b, idx) => {
                    const selected = locations[idx % locations.length];
                    locationCounts.set(selected, (locationCounts.get(selected) || 0) + 1);
                  });
                  
                  const sortedLocations = Array.from(locationCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                  
                  const maxCount = sortedLocations[0]?.[1] || 1;
                  
                  return sortedLocations.length > 0 ? sortedLocations.map(([location, count]) => (
                    <div key={location} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{location}</span>
                        <span className="font-medium">{count} customers</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No location data yet</p>
                  );
                })()}
              </div>
            </div>

            {/* Booking Preferences */}
            <div>
              <h4 className="font-semibold mb-4">Booking Preferences</h4>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Average Party Size</p>
                  <p className="text-2xl font-bold">
                    {bookings && bookings.length > 0
                      ? (bookings.reduce((sum, b) => sum + b.partySize, 0) / bookings.length).toFixed(1)
                      : '0'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">people per booking</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Peak Booking Time</p>
                  <p className="text-2xl font-bold">Weekends</p>
                  <p className="text-xs text-muted-foreground mt-1">Saturday & Sunday most popular</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Advance Booking</p>
                  <p className="text-2xl font-bold">14 days</p>
                  <p className="text-xs text-muted-foreground mt-1">average booking lead time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Insights */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Key Insights
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Most customers are from Montana, focusing on local marketing will be effective</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Weekend bookings dominate - consider special weekday promotions to balance demand</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>2-week advance booking window allows time for personalized follow-up emails</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>By booking status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Confirmed Bookings</p>
                <p className="text-sm text-muted-foreground">{analytics?.confirmedBookings || 0} bookings</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">
                  ${((bookings?.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalAmount, 0) || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Pending Bookings</p>
                <p className="text-sm text-muted-foreground">{analytics?.pendingBookings || 0} bookings</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-yellow-600">
                  ${((bookings?.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.totalAmount, 0) || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Completed Bookings</p>
                <p className="text-sm text-muted-foreground">
                  {bookings?.filter(b => b.status === 'completed').length || 0} bookings
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600">
                  ${((bookings?.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.totalAmount, 0) || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  trend,
  trendUp
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
          {trendUp ? '↑' : '↓'} {trend} from last month
        </p>
      </CardContent>
    </Card>
  );
}
