import { useEffect } from 'react';

export function DebugRoute() {
  useEffect(() => {
    console.log('🔍 DebugRoute component rendered');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Pathname:', window.location.pathname);
    console.log('🔍 Search:', window.location.search);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Debug Route</h2>
          <p className="text-muted-foreground">This route is working!</p>
          <p className="text-sm text-muted-foreground mt-2">
            URL: {window.location.href}
          </p>
        </div>
      </div>
    </div>
  );
}
