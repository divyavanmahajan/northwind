import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { loginSchema } from '@/schemas/auth';
import type { LoginFormData } from '@/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Loader2, LogIn } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data.username, data.password);
      navigate(from, { replace: true });
    } catch {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Northwind
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/15 border border-destructive/20">
                <ErrorMessage message={error} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-200">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...register('username')}
                disabled={isLoading}
                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
              {errors.username && (
                <p className="text-xs text-destructive font-medium">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                disabled={isLoading}
                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-900/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center text-xs text-slate-500">
            <p className="font-medium text-slate-400 mb-2 uppercase tracking-wider">Demo Access</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 rounded bg-slate-800/30 border border-slate-700/30">
                <p className="text-blue-400 font-bold">admin</p>
                <p>Admin123!</p>
              </div>
              <div className="p-2 rounded bg-slate-800/30 border border-slate-700/30">
                <p className="text-emerald-400 font-bold">manager</p>
                <p>Manager123!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
