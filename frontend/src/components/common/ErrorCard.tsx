import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorCardProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export const ErrorCard = ({ title = "Error", message, retry }: ErrorCardProps) => {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {retry && (
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
