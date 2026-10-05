import { Component, type ErrorInfo, type ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors in its children and shows a readable message with a "Try again" button,
 * instead of a blank screen. Wrap each major area (main view, settings) separately.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        className="m-6 flex flex-col gap-3 border border-bad/40 bg-surface p-5 text-sm"
      >
        <p className="font-semibold text-bad">Something went wrong in this part of the app.</p>
        <p className="font-mono text-xs text-muted">{this.state.error.message}</p>
        <button
          className="self-start text-accent hover:underline"
          onClick={() => this.setState({ error: null })}
        >
          Try again
        </button>
      </div>
    );
  }
}
