/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mb-6">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Oops! Something went wrong</h1>
          <p className="text-slate-600 mb-8 max-w-xs mx-auto">
            We encountered an unexpected error. Don't worry, your skin data is safe.
          </p>
          
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-8 w-full max-w-sm overflow-auto max-h-40 text-left">
            <p className="text-xs font-mono text-red-500 whitespace-pre-wrap">
              {this.state.error?.message}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            <RefreshCcw size={18} /> Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
