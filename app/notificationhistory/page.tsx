'use client';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NotificationHistory() {
  const utils = trpc.useUtils();
  const { data: notifications = [], refetch } = trpc.notifications.list.useQuery({ limit: 100 });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refetch();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      toast.success("Notification deleted");
      refetch();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate({ id });
  };

  const handleMarkAllAsRead = () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case "success":
        return <Check className={cn(iconClass, "text-green-600")} />;
      case "warning":
        return <Bell className={cn(iconClass, "text-yellow-600")} />;
      case "error":
        return <X className={cn(iconClass, "text-red-600")} />;
      case "booking":
        return <Bell className={cn(iconClass, "text-blue-600")} />;
      case "payment":
        return <Bell className={cn(iconClass, "text-green-600")} />;
      default:
        return <Bell className={cn(iconClass, "text-gray-600")} />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification History</h1>
          <p className="text-muted-foreground mt-2">
            View all your notifications in one place
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            variant="outline"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No notifications yet</CardTitle>
            <CardDescription>
              You&apos;ll see notifications here when you receive bookings, payments, and other updates
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-colors hover:bg-muted/50",
                !notification.read && "border-l-4 border-l-blue-600 bg-blue-50/30"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            {notification.type}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {notification.message}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
