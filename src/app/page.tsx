'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center'
        }}
      />
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-16">
        
        {/* Left Side: Copy & Branding */}
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-2 mb-12">
            {/* Logo placeholder - using SVG similar to screenshot */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4C13.2 4 10.8 5.6 9.6 8H6C4.9 8 4 8.9 4 10V26C4 27.1 4.9 28 6 28H26C27.1 28 28 27.1 28 26V10C28 8.9 27.1 8 26 8H22.4C21.2 5.6 18.8 4 16 4ZM16 6.5C17.4 6.5 18.6 7.4 19 8.5H13C13.4 7.4 14.6 6.5 16 6.5ZM6 10.5H26V25.5H6V10.5ZM10 14V16.5H22V14H10ZM10 19V21.5H17V19H10Z" fill="#0EA5E9"/>
            </svg>
            <span className="text-xl font-bold tracking-tight text-gray-900">docflow</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold text-[#111827] leading-[1.1] tracking-tight mb-8">
            The standard for<br/>collaborative<br/>work.
          </h1>
          
          <p className="text-xl text-gray-500 font-medium max-w-lg mb-16 leading-relaxed">
            A highly formal, secure, and real-time editing environment designed for enterprise teams that demand precision.
          </p>

          <div className="flex gap-12 text-sm">
            <div className="border-l-2 border-gray-200 pl-4">
              <h3 className="font-bold text-gray-900 mb-1">Real-time Sync</h3>
              <p className="text-gray-500">Y.js powered CRDTs for seamless<br/>editing.</p>
            </div>
            <div className="border-l-2 border-gray-200 pl-4">
              <h3 className="font-bold text-gray-900 mb-1">Enterprise Security</h3>
              <p className="text-gray-500">End-to-end reliability and local caching.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full max-w-md shrink-0">
          <div className="bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Workspace</h2>
            <p className="text-gray-500 text-sm mb-8">Select an authorized account to continue.</p>

            <div className="space-y-4">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user.id)}
                  disabled={loggingIn !== null}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 group text-left"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  {loggingIn === user.id ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
