import { Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
          <div className="flex items-center justify-center size-12 rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.state.error?.message?.includes('FIRESTORE')
                ? 'A realtime data error occurred. Click retry to reconnect.'
                : 'An unexpected error occurred. You can try again or navigate to another page.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => this.setState({ hasError: false, error: null })} className="gap-2 cursor-pointer">
              <RefreshCw size={14} />
              Retry
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="cursor-pointer">
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
