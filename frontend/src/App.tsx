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
import { Products } from '@/pages/Products';
import { ProductDetail } from '@/pages/ProductDetail';
import { ProductFormPage } from '@/pages/ProductFormPage';

import { CustomerDetail } from '@/pages/CustomerDetail';
import { CustomerFormPage } from '@/pages/CustomerFormPage';
import { Customers } from '@/pages/Customers';
import { Employees } from '@/pages/Employees';
import { EmployeeDetail } from '@/pages/EmployeeDetail';
import { EmployeeFormPage } from '@/pages/EmployeeFormPage';
import { Orders } from '@/pages/Orders';
import { OrderDetail } from '@/pages/OrderDetail';
import { OrderFormPage } from '@/pages/OrderFormPage';
import { Users } from '@/pages/Users';

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
              <Route
                path="products/new"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <ProductFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="products/:id"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee']}>
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="products/:id/edit"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <ProductFormPage />
                  </ProtectedRoute>
                }
              />
              <Route path="categories" element={<Categories />} />
              <Route path="orders" element={<Orders />} />

              <Route
                path="customers"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee', 'customer']}>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="customers/new"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <CustomerFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="customers/:id"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee', 'customer']}>
                    <CustomerDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="customers/:id/edit"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <CustomerFormPage />
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
                path="employees/new"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <EmployeeFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees/:id"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee']}>
                    <EmployeeDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees/:id/edit"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <EmployeeFormPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="orders"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee', 'customer']}>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/new"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <OrderFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'employee', 'customer']}>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/:id/edit"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <OrderFormPage />
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
