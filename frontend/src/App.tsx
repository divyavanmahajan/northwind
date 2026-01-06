import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from "@/components/ui/sonner"
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Placeholder pages
import { Categories } from '@/pages/Categories';
import { Suppliers } from '@/pages/Suppliers';
import { SupplierDetail } from '@/pages/SupplierDetail';
import { SupplierFormPage } from '@/pages/SupplierFormPage';

const Products = () => <div className="p-8">Products (Coming Soon)</div>;
const Orders = () => <div className="p-8">Orders (Coming Soon)</div>;
const Customers = () => <div className="p-8">Customers (Coming Soon)</div>;
const Employees = () => <div className="p-8">Employees (Coming Soon)</div>;
const Users = () => <div className="p-8">Users (Coming Soon)</div>;

function App() {
  const { token, refreshUser } = useAuthStore();

  useEffect(() => {
    // Restore auth state on app load
    if (token) {
      refreshUser();
    }
  }, [token, refreshUser]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="orders" element={<Orders />} />

              <Route
                path="customers"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee']}>
                    <Customers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="suppliers"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee']}>
                    <Suppliers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="suppliers/:id"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee']}>
                    <SupplierDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="suppliers/new"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <SupplierFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="suppliers/:id/edit"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <SupplierFormPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="employees"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee']}>
                    <Employees />
                  </ProtectedRoute>
                }
              />

              <Route
                path="users"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
