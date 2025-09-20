import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface OfflinePageProps {
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function OfflinePage({ onRetry, onGoHome }: OfflinePageProps) {
  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      onRetry?.();
    }
  };

  const handleGoHome = () => {
    onGoHome?.();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-orange-100 rounded-full">
              <WifiOff className="h-12 w-12 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-900">You're Offline</CardTitle>
          <CardDescription className="text-gray-600">
            Don't worry! You can still track your habits offline. Your progress will sync when you're back online.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Track habits without internet</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>View your progress history</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Data syncs automatically when online</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleRetry}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={handleGoHome}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Check your internet connection and try again
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default OfflinePage;
