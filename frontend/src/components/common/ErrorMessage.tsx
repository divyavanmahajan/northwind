import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export const ErrorMessage = ({ message, className, ...props }: ErrorMessageProps) => {
  if (!message) return null;
  
  return (
    <div className={cn("flex items-center gap-2 text-sm text-destructive", className)} {...props}>
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
};
