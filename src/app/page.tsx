'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Sparkles } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    fetch('/api/auth/login')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          router.push('/dashboard');
          return;
        }
        return fetch('/api/users');
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data?.users) setUsers(data.users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleLogin = async (userId: string) => {
    setLoggingIn(userId);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoggingIn(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 page-enter">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative mb-12 text-center">
        <div className="logo-float inline-flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
            DocFlow
          </h1>
        </div>
        <p className="text-surface-400 text-lg">
          Collaborative document editing, simplified
        </p>
      </div>

      {/* User selection */}
      <div className="relative w-full max-w-md">
        <div className="glass-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-surface-100">Choose your account</h2>
          </div>
          <p className="text-surface-400 text-sm mb-6">
            Select a user to get started. Each account has its own documents and sharing.
          </p>

          <div className="space-y-3">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleLogin(user.id)}
                disabled={loggingIn !== null}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-800/50 hover:bg-surface-700/50 border border-transparent hover:border-brand-500/30 transition-all duration-200 group disabled:opacity-50"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-surface-100 group-hover:text-brand-300 transition-colors">
                    {user.name}
                  </div>
                  <div className="text-sm text-surface-400">{user.email}</div>
                </div>
                {loggingIn === user.id ? (
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-surface-500 group-hover:text-brand-400 transition-all group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-surface-500 text-xs mt-6">
          Demo accounts for testing • No password required
        </p>
      </div>
    </div>
  );
}
