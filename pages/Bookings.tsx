import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Badge component not used here; removed to satisfy ESLint
import { trpc } from "@/lib/trpc";
import { Calendar as CalendarIcon, Mail, Phone, User, List, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { ListSkeleton } from "@/components/Skeletons";

export default function Bookings() {
  const { data: bookings, isLoading } = trpc.bookings.list.useQuery();
  const utils = trpc.useUtils();
  // selected booking state not currently used
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Group bookings by date for calendar view
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, typeof bookings> = {};
    (bookings || []).forEach(booking => {
      const dateKey = new Date(booking.bookingDate).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [bookings]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

  const days: (Date | null)[] = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [selectedMonth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "canceled": return "bg-red-500";
      case "completed": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const updateBookingMutation = trpc.bookings.update.useMutation({
    onSuccess: () => {
      toast.success("Booking updated successfully");
      utils.bookings.list.invalidate();
      utils.analytics.overview.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStatusChange = (bookingId: number, status: "confirmed" | "canceled" | "completed") => {
    updateBookingMutation.mutate({ id: bookingId, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage your customer bookings</p>
        </div>
        <ListSkeleton count={5} />
      </div>
    );
  }

  const sortedBookings = [...(bookings || [])].sort((a, b) => 
    new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage your customer bookings</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {viewMode === "calendar" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-sm py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                const dateKey = day.toISOString().split('T')[0];
                const dayBookings = bookingsByDate[dateKey] || [];
                const isToday = new Date().toDateString() === day.toDateString();

                return (
                  <div
                    key={dateKey}
                    className={`aspect-square border rounded-lg p-2 hover:bg-accent cursor-pointer transition-colors ${
                      isToday ? 'border-primary border-2' : ''
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map(booking => (
                        <div
                          key={booking.id}
                          className="text-xs truncate p-1 rounded"
                          style={{ backgroundColor: getStatusColor(booking.status) + '20' }}
                          title={`${booking.customerName}`}
                        >
                          {booking.customerName}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-muted-foreground">+{dayBookings.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>Canceled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "list" && sortedBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Bookings will appear here once customers start making reservations through your chatbot or booking system.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedBookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {booking.customerName}
                    </CardTitle>
                    <CardDescription>
                      Booking #{booking.id} • {new Date(booking.bookingDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    booking.status === 'canceled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.customerEmail}</span>
                    </div>
                    {booking.customerPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.customerPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(booking.bookingDate).toLocaleDateString()} 
                        {booking.bookingTime && ` at ${booking.bookingTime}`}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Party Size:</span>{' '}
                      <span className="font-medium">{booking.partySize}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total Amount:</span>{' '}
                      <span className="font-medium">${(booking.totalAmount / 100).toFixed(2)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Payment:</span>{' '}
                      <span className={`font-medium ${
                        booking.paymentStatus === 'paid' ? 'text-green-600' :
                        booking.paymentStatus === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Notes:</p>
                    <p className="text-sm text-muted-foreground">{booking.notes}</p>
                  </div>
                )}

                {booking.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(booking.id, 'confirmed')}
                      disabled={updateBookingMutation.isPending}
                    >
                      Confirm Booking
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(booking.id, 'canceled')}
                      disabled={updateBookingMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {booking.status === 'confirmed' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(booking.id, 'completed')}
                      disabled={updateBookingMutation.isPending}
                    >
                      Mark as Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(booking.id, 'canceled')}
                      disabled={updateBookingMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
