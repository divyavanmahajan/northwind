import { LoadingSpinner } from './LoadingSpinner';

export const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
};
