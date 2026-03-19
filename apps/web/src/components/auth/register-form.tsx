'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AxiosError } from 'axios';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#F59E0B' };
  if (score === 3) return { score: 3, label: 'Good', color: '#3B82F6' };
  return { score: 4, label: 'Strong', color: '#10B981' };
}

export function RegisterForm() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [serverError, setServerError] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const strength = getPasswordStrength(passwordValue);

  async function onSubmit(values: RegisterValues) {
    setServerError('');
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/register',
        { name: values.name, email: values.email, password: values.password },
      );
      setTokens(data.accessToken, data.refreshToken);
      const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
      const { data: me } = await api.get('/auth/me');
      setUser(me);
      router.push(payload.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string | string[] }>;
      const msg = axiosErr.response?.data?.message;
      setServerError(
        Array.isArray(msg) ? msg[0] : (msg ?? 'Registration failed. Please try again.'),
      );
    }
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1">
        <h2 className="text-[2rem] font-bold leading-tight text-[#1E293B]">Create your account</h2>
        <p className="text-[15px] text-[#64748B]">Join your team on MealShare</p>
      </div>

      {/* Error banner */}
      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-[#1E293B]">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={[
              'h-11 border-[#E2E8F0] text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#F97316]/30 focus-visible:border-[#F97316] transition-colors',
              errors.name ? 'border-red-400 focus-visible:ring-red-200' : '',
            ].join(' ')}
            {...register('name')}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-red-600" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-[#1E293B]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={[
              'h-11 border-[#E2E8F0] text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#F97316]/30 focus-visible:border-[#F97316] transition-colors',
              errors.email ? 'border-red-400 focus-visible:ring-red-200' : '',
            ].join(' ')}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password + strength */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-[#1E293B]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-describedby="password-strength"
            className={[
              'h-11 border-[#E2E8F0] text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#F97316]/30 focus-visible:border-[#F97316] transition-colors',
              errors.password ? 'border-red-400 focus-visible:ring-red-200' : '',
            ].join(' ')}
            {...register('password', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPasswordValue(e.target.value),
            })}
          />
          {/* Strength indicator */}
          {passwordValue && (
            <div id="password-strength" className="space-y-1.5">
              <div className="flex gap-1" aria-label={`Password strength: ${strength.label}`}>
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: seg <= strength.score ? strength.color : '#E2E8F0',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}
          {errors.password && (
            <p className="text-xs text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-sm font-medium text-[#1E293B]">
            Confirm Password
          </Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            aria-describedby={errors.confirm ? 'confirm-error' : undefined}
            className={[
              'h-11 border-[#E2E8F0] text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#F97316]/30 focus-visible:border-[#F97316] transition-colors',
              errors.confirm ? 'border-red-400 focus-visible:ring-red-200' : '',
            ].join(' ')}
            {...register('confirm')}
          />
          {errors.confirm && (
            <p id="confirm-error" className="text-xs text-red-600" role="alert">
              {errors.confirm.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-[15px] font-semibold text-white transition-all duration-200 cursor-pointer"
          style={{
            background: isSubmitting ? '#FDA974' : '#F97316',
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Creating account…
            </span>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E2E8F0]" />
        <span className="text-sm text-[#94A3B8] font-medium">or continue with</span>
        <div className="flex-1 h-px bg-[#E2E8F0]" />
      </div>

      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border-[#E2E8F0] text-[#1E293B] text-[15px] font-medium hover:bg-[#F8FAFC] transition-colors cursor-pointer gap-3"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </Button>

      {/* Sign in link */}
      <p className="text-center text-sm text-[#64748B]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold transition-colors"
          style={{ color: '#F97316' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
