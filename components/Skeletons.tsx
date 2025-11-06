import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Reusable skeleton components for consistent loading states across the application
 */

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
          <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="space-y-2 flex-1">
        <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
        <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-8 w-20 bg-muted animate-pulse rounded" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>
      
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Content Cards */}
      <div className="grid gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
      </div>
      <div>
        <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
      </div>
      <div>
        <div className="h-4 w-28 bg-muted animate-pulse rounded mb-2" />
        <div className="h-24 w-full bg-muted animate-pulse rounded" />
      </div>
      <div className="h-10 w-32 bg-muted animate-pulse rounded" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}
