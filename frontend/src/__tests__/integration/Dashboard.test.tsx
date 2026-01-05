import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '@/pages/Dashboard';
import { healthService } from '@/services/healthService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the service
vi.mock('@/services/healthService', () => ({
    healthService: {
        getHealthReady: vi.fn()
    }
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderDashboard = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <Dashboard />
        </QueryClientProvider>
    );
};

describe('Dashboard Integration', () => {
    it('shows loading state initially', () => {
        (healthService.getHealthReady as any).mockReturnValue(new Promise(() => {})); // Never resolves
        renderDashboard();
        expect(screen.getByText(/Checking.../i)).toBeInTheDocument();
    });

    it('displays healthy status on success', async () => {
        (healthService.getHealthReady as any).mockResolvedValue({
            status: 'healthy',
            checks: { database: { status: 'healthy', latency_ms: 5 } }
        });

        renderDashboard();

        // Wait for loading to finish
        await waitFor(() => {
             expect(screen.queryByText(/Checking.../i)).not.toBeInTheDocument();
        });

        expect(screen.getByText('healthy')).toBeInTheDocument();
        expect(screen.getByText(/5ms/i)).toBeInTheDocument();
    });

    it('displays error state on failure', async () => {
         const error = {
            response: {
                data: {
                    error: {
                        code: 'CONNECTION_ERROR',
                        message: 'Failed to connect'
                    }
                }
            }
        };
        (healthService.getHealthReady as any).mockRejectedValue(error);

        renderDashboard();

        // Wait for loading to finish
        await waitFor(() => {
             expect(screen.queryByText(/Checking.../i)).not.toBeInTheDocument();
        });

        expect(screen.getByText('CONNECTION_ERROR')).toBeInTheDocument();
        expect(screen.getByText('Failed to connect')).toBeInTheDocument();
    });
});
