import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-md m-3 text-red-300 font-mono text-xs">
          <div className="font-bold mb-1">Rendering Error Encountered</div>
          <div className="text-[11px] opacity-80">{this.state.error?.message}</div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-2 py-1 bg-red-800/60 hover:bg-red-700 rounded text-white text-[10px]"
          >
            Retry View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
