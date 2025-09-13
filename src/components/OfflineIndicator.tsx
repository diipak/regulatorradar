
import { useOfflineDetection } from '../hooks/useOfflineDetection';

/**
 * Component for displaying offline status
 */
export function OfflineIndicator() {
  const { isOnline, offlineDuration } = useOfflineDetection();

  if (isOnline) {
    return null;
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center text-sm z-50">
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span>
          You're offline. Some features may not work properly.
          {offlineDuration > 0 && ` (${formatDuration(offlineDuration)})`}
        </span>
      </div>
    </div>
  );
}