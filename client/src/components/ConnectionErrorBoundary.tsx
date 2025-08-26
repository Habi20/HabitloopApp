import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isConnectionError: boolean;
}

export class ConnectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isConnectionError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a connection error
    const isConnectionError = 
      error.message.includes('ERR_CONNECTION_REFUSED') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('ERR_NETWORK') ||
      error.message.includes('ERR_INTERNET_DISCONNECTED');

    return {
      hasError: true,
      error,
      isConnectionError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ConnectionErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isConnectionError: false,
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isConnectionError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-wifi text-orange-500 text-2xl"></i>
                </div>
                <CardTitle className="text-xl text-gray-900">
                  Server Connection Issue
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  It looks like the server is starting up or temporarily unavailable. 
                  This usually happens when the backend server is not running.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <i className="fas fa-redo mr-2"></i>
                    Try Again
                  </Button>
                  
                  <Button 
                    onClick={this.handleRefresh}
                    variant="outline"
                    className="w-full"
                  >
                    <i className="fas fa-sync mr-2"></i>
                    Refresh Page
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>If the problem persists, please check:</p>
                  <ul className="text-left space-y-1">
                    <li>• Backend server is running on port 5000</li>
                    <li>• Frontend server is running on port 5173</li>
                    <li>• No firewall blocking the connection</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // For other types of errors, show a generic error message
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
              </div>
              <CardTitle className="text-xl text-gray-900">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              
              <Button 
                onClick={this.handleRefresh}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <i className="fas fa-sync mr-2"></i>
                Refresh Page
              </Button>

              {process.env.NODE_ENV === 'development' && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error?.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
