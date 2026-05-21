import React from "react";

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log the error to an external service here
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="rounded-xl bg-red-900/60 p-6 text-white">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm mb-4">An unexpected error occurred while rendering the application.</p>
            <details className="text-xs text-gray-200/80">
              <summary>Show error</summary>
              <pre className="whitespace-pre-wrap">{String(this.state.error)}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
