import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PLAYPEN boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAF8] text-[#142220] flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-3xl bg-[#F1F3EF] border border-[#142220]/12 p-8 text-center space-y-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-[#5C6D69]">
              PLAYPEN · Client Notice
            </p>
            <h1 className="font-serif text-3xl font-medium">
              We encountered a momentary interruption
            </h1>
            <p className="text-sm text-[#3C4B48] leading-relaxed">
              Your session is safe. Please reload to return to PLAYPEN.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-medium hover:bg-[#1F3532] transition-colors cursor-pointer"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
