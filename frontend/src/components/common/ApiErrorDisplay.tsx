import type { ApiError } from '@/types/api';
import { ErrorCard } from './ErrorCard';
import type { AxiosError } from 'axios';
import { isApiError } from '@/lib/api';

interface ApiErrorDisplayProps {
  error: unknown;
  retry?: () => void;
}

export const ApiErrorDisplay = ({ error, retry }: ApiErrorDisplayProps) => {
  let title = "An error occurred";
  let message = "Something went wrong. Please try again.";

  if (isApiError(error)) {
    title = error.response?.data.error.code || "API Error";
    message = error.response?.data.error.message || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return <ErrorCard title={title} message={message} retry={retry} />;
};
