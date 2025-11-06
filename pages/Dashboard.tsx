import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Calendar, 
  DollarSign, 
  
  Clock,
  CheckCircle2
} from "lucide-react";

export default function Dashboard() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();
  const { data: bookings } = trpc.bookings.list.useQuery();
  const { data: business } = trpc.business.get.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const todayBookings = bookings?.filter(b => {
    const bookingDate = new Date(b.bookingDate);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  }) || [];

  const upcomingBookings = bookings?.filter(b => {
    const bookingDate = new Date(b.bookingDate);
    const today = new Date();
    return bookingDate > today;
  }).slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
  <p className="text-muted-foreground">Welcome back to {business?.name}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Bookings"
          value={analytics?.totalBookings || 0}
          icon={<Calendar className="h-4 w-4" />}
          description="All time bookings"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${((analytics?.totalRevenue || 0) / 100).toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          description="All time revenue"
        />
        <MetricCard
          title="Pending Bookings"
          value={analytics?.pendingBookings || 0}
          icon={<Clock className="h-4 w-4" />}
          description="Awaiting confirmation"
        />
        <MetricCard
          title="Confirmed Bookings"
          value={analytics?.confirmedBookings || 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          description="Ready to go"
        />
      </div>

      {/* Today's Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Bookings</CardTitle>
          <CardDescription>
            {todayBookings.length} booking{todayBookings.length !== 1 ? 's' : ''} scheduled for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.bookingTime || 'Time not specified'} • Party of {booking.partySize}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(booking.totalAmount / 100).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
          <CardDescription>Next 5 scheduled bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming bookings</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.bookingDate).toLocaleDateString()} at {booking.bookingTime || 'TBD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(booking.totalAmount / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Party of {booking.partySize}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
