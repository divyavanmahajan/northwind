// Pagination
export interface PaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  filters_applied?: Record<string, any>;
  sort_applied?: Array<{ field: string; order: 'asc' | 'desc' }>;
}

// Error
export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    timestamp: string;
    path: string;
  };
}

// Health
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
}

export interface HealthReadyResponse {
  status: 'healthy' | 'unhealthy';
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      latency_ms: number;
    };
  };
}
