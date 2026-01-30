'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

interface LoginFormProps {
    onLogin: (username: string, password: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export default function LoginForm({ onLogin, isLoading, error }: LoginFormProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (username && password) {
            await onLogin(username, password);
        }
    };

    return (
        <div className="min-h-screen bg-azure-bg flex items-center justify-center p-8">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-azure-surface rounded-xl shadow-lg border border-azure-border p-8">
                    {/* Logo and Title */}
                    <div className="text-center mb-8">
                        <img
                            src="/daily-reports/logo.png"
                            alt="RTA Logo"
                            className="h-12 mx-auto mb-4"
                        />
                        <h1 className="text-2xl font-bold text-azure-text">ITSD Task Tracker</h1>
                        <p className="text-azure-text-secondary text-sm mt-1">Sign in with your Azure DevOps credentials</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rta-red flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-azure-text mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="domain\\username or email"
                                className="w-full px-4 py-3 bg-azure-surface border border-azure-border rounded-lg text-azure-text placeholder:text-azure-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-azure-primary focus:border-transparent transition-all"
                                disabled={isLoading}
                                required
                                autoComplete="username"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-azure-text mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 pr-12 bg-azure-surface border border-azure-border rounded-lg text-azure-text placeholder:text-azure-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-azure-primary focus:border-transparent transition-all"
                                    disabled={isLoading}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-azure-text-secondary hover:text-azure-text transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !username || !password}
                            className="w-full py-3 px-4 bg-azure-primary hover:bg-[#106EBE] disabled:bg-azure-primary/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 pt-6 border-t border-azure-border">
                        <p className="text-xs text-azure-text-secondary text-center">
                            Access restricted to <span className="font-semibold text-azure-primary">Project Administrators</span>
                        </p>
                    </div>
                </div>

                {/* Azure DevOps Link */}
                <div className="mt-4 text-center">
                    <a
                        href="https://rtadevops.rta.global/ITSD/ITSD%20Task%20Tracker"
                        className="inline-flex items-center text-sm text-azure-text-secondary hover:text-azure-primary transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 9.74V16.5l-5.5 2.5v-6.26L22 9.74zm-5.5 9.26v-6.26L11 16.5V22l5.5-2zm-11-2L2 16.5V9.74l5.5 3V17zm0-4.76v6.26L11 22v-5.5l-5.5-3.26zm5.5-3.5L5.5 12l5.5 3.24L16.5 12 11 8.74zM2 7.26L11 2v5.5L5.5 10.5 2 8.24V7.26zm9 0V2l9 5.26v.98l-3.5 1.76L11 7.26z" />
                        </svg>
                        Go to Azure DevOps
                    </a>
                </div>
            </div>
        </div>
    );
}
