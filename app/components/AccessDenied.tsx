'use client';

import React from 'react';
import { ShieldX } from 'lucide-react';

interface AccessDeniedProps {
    userName?: string;
    error?: string | null;
}

export default function AccessDenied({ userName, error }: AccessDeniedProps) {
    return (
        <div className="min-h-screen bg-azure-bg flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-azure-surface rounded-xl shadow-lg border border-azure-border p-8 text-center">
                {/* RTA Logo */}
                <div className="flex justify-center mb-6">
                    <img
                        src="/daily-reports/logo.png"
                        alt="RTA Logo"
                        className="h-12 object-contain"
                    />
                </div>

                {/* Access Denied Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <ShieldX className="w-10 h-10 text-rta-red" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-azure-text mb-2">
                    Access Denied
                </h1>

                {/* Message */}
                <p className="text-azure-text-secondary mb-6">
                    {error ? (
                        error
                    ) : (
                        <>
                            Sorry{userName && <span className="font-medium">, {userName}</span>}.
                            This dashboard is restricted to <span className="text-azure-primary font-semibold">Project Administrators</span> only.
                        </>
                    )}
                </p>

                {/* Info Box */}
                <div className="bg-azure-bg rounded-lg p-4 border border-azure-border">
                    <p className="text-sm text-azure-text-secondary">
                        If you believe you should have access, please contact your Azure DevOps administrator.
                    </p>
                </div>

                {/* Azure DevOps Link */}
                <div className="mt-6 pt-6 border-t border-azure-border">
                    <a
                        href="https://rtadevops.rta.global/ITSD/ITSD%20Task%20Tracker"
                        className="inline-flex items-center text-azure-primary hover:underline text-sm font-medium"
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
