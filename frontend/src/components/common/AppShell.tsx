import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { ErrorBoundary } from './ErrorBoundary';

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, hideNav = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/25 selection:text-indigo-200">
      {!hideNav && <Navbar />}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {!hideNav && (
        <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              &copy; {new Date().getFullYear()} Intelligent Document Processor. Server-side Gemini AI &amp; Supabase Storage.
            </p>
            <div className="flex items-center space-x-4 text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>System Operational</span>
              </span>
              <span>&bull;</span>
              <span>Encrypted Private Storage</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
