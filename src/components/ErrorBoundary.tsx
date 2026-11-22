import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AGENCY_CONTACT } from '../types';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    let friendly = 'Something went wrong while loading this section.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed?.error) {
        if (parsed.error.toLowerCase().includes('permission')) {
          friendly =
            'Access permission denied. If you are an agency staff member, please sign in with your authorized Admin account.';
        } else {
          friendly = parsed.error;
        }
      }
    } catch {
      if (error.message) {
        friendly = error.message;
      }
    }
    return { hasError: true, message: friendly };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SKY TRACK UI ErrorBoundary caught:', error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#213D77] text-white px-5 py-4 flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#FB792B] shrink-0" />
              <h1 className="text-base font-bold">SKY TRACK — Temporary Error</h1>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">{this.state.message}</p>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="h-10 px-4 bg-[#213D77] hover:bg-[#182D59] text-white text-xs font-bold rounded-md inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Portal</span>
                </button>
                <a
                  href={`tel:+${AGENCY_CONTACT.primaryPhoneRaw}`}
                  className="h-10 px-4 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-md inline-flex items-center"
                >
                  Call {AGENCY_CONTACT.primaryPhoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
