import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function GoogleCalendarCallback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Google Calendar...');

  // Debug: Log that the component is being rendered
  console.log('🔍 GoogleCalendarCallback component rendered');
  console.log('🔍 Current URL:', window.location.href);
  console.log('🔍 Pathname:', window.location.pathname);
  console.log('🔍 Search params:', window.location.search);
  console.log('🔍 User:', user?.id);
  
  // Debug: Show URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  console.log('🔍 Code:', urlParams.get('code'));
  console.log('🔍 State:', urlParams.get('state'));
  console.log('🔍 Error:', urlParams.get('error'));

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // Check for OAuth2 errors
        if (error) {
          setStatus('error');
          setMessage(`OAuth2 Error: ${error}`);
          return;
        }

        // Check if we have the required parameters
        if (!code || !state) {
          setStatus('error');
          setMessage('Missing authorization code or state parameter');
          return;
        }

        // Note: State verification removed for OAuth2 callback
        // The state parameter is used for CSRF protection but we'll handle it in the backend

        setMessage('Exchanging authorization code for access token...');

        // Send the authorization code to the backend
        const response = await apiRequest('google-calendar/callback', 'POST', {
          code,
          state
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Google Calendar connected successfully!');
          
          toast({
            title: "Success",
            description: "Google Calendar has been connected successfully!",
          });

          // Redirect to settings page after 2 seconds
          setTimeout(() => {
            window.location.href = '/settings';
          }, 2000);
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.error || 'Failed to connect Google Calendar');
        }
      } catch (error) {
        console.error('Google Calendar callback error:', error);
        setStatus('error');
        setMessage('Network error - please try again');
      }
    };

    handleCallback();
  }, [user?.id, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold mb-2">Connecting to Google Calendar</h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-semibold mb-2 text-green-600">Success!</h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to settings...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h2 className="text-xl font-semibold mb-2 text-red-600">Connection Failed</h2>
              <p className="text-muted-foreground mb-4">{message}</p>
              <button
                onClick={() => window.location.href = '/settings'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Settings
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
