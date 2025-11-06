import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
}

/**
 * Error fallback component for displaying errors gracefully
 */
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            We encountered an error while loading this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
          {resetError && (
            <Button onClick={resetError} className="w-full">
              Try Again
            </Button>
          )}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/'}
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Inline error display for smaller components
 */
export function InlineError({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
      <p className="text-sm text-muted-foreground mb-4 text-center">{message}</p>
      {retry && (
        <Button size="sm" variant="outline" onClick={retry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
