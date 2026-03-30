import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/services/api';

export default function SetupPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  
  // Directly extract the auth user bound in memory
  const user = useAuthStore(state => state.user);
  
  // We need a force refresh on the Zustand store to drop the isTemporaryPassword token
  const fetchProfile = useAuthStore(state => state.fetchProfile);

  const resetMut = useMutation({
    mutationFn: () => api.post('/auth/setup-password', { newPassword }),
    onSuccess: async () => {
      toast.success('Password setup complete!');
      // Refresh the payload memory to drop the strict wall block
      await fetchProfile();
      navigate('/dashboard');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Password update failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters long');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    resetMut.mutate();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary/5 p-12 text-primary">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
            <span className="font-bold text-2xl tracking-tight">SaaS Inventory</span>
          </div>
          <div className="mt-24 space-y-6 max-w-lg">
            <h1 className="text-4xl font-semibold tracking-tight leading-tight">
              Action Required
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Your company administrator invited you using a temporary password. For security reasons, you must establish a permanent personal password before accessing the workspace.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-background relative border-l">
        <div className="w-full max-w-[400px] flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="text-3xl font-semibold tracking-tight">Setup Password</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Create a secure password for {user?.email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9 h-11"
                  placeholder="Enter a secure password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={resetMut.isPending}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-9 h-11"
                  placeholder="Re-type your password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={resetMut.isPending}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-11 mt-4 text-base font-semibold"
              disabled={resetMut.isPending || !newPassword || !confirmPassword}
            >
              {resetMut.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Save and Continue <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-2">
              Upon saving, you will be redirected to your dashboard.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
