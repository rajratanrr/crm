import { useEffect, useRef, useCallback } from 'react';

/**
 * useAutoSync — Cross-employee real-time sync hook
 * 
 * Ensures data stays fresh across ALL employees by:
 * 1. Polling the database every `intervalMs` milliseconds
 * 2. Re-fetching when the browser tab regains focus
 * 3. Re-fetching when the browser comes back online
 * 4. Re-fetching when the tab becomes visible after being hidden
 * 
 * Usage:
 *   useAutoSync(loadData, 10000); // auto-refresh every 10 seconds
 */
export function useAutoSync(fetchFn: () => void | Promise<void>, intervalMs = 10000) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const stableRefetch = useCallback(() => {
    fetchRef.current();
  }, []);

  useEffect(() => {
    // 1. Periodic polling — only when tab is visible
    const timer = setInterval(() => {
      if (!document.hidden) {
        stableRefetch();
      }
    }, intervalMs);

    // 2. Refetch when window regains focus (employee switches back to this tab)
    const handleFocus = () => stableRefetch();
    window.addEventListener('focus', handleFocus);

    // 3. Refetch when network comes back online
    const handleOnline = () => stableRefetch();
    window.addEventListener('online', handleOnline);

    // 4. Refetch when tab becomes visible after being hidden
    const handleVisibility = () => {
      if (!document.hidden) stableRefetch();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [stableRefetch, intervalMs]);
}

export default useAutoSync;
