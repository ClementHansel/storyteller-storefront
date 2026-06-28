// ============================================================
// Zenvix Session Initializer
// ============================================================
// Initializes the full Zenvix integration pipeline on app mount:
// 1. Fires session.start event for attribution
// 2. Starts Notification_Poller for eligible orders
// 3. Flushes pending event retry queue
// 4. Flushes pending order sync queue
// 5. Sets up periodic queue processing (30s interval)
// 6. Cleans up polling and interval on unmount
// ============================================================

import { useEffect, useRef } from 'react';
import { sendSessionStart, processRetryQueue } from '@/api/zenvix-events';
import { startPolling, stopPolling } from '@/api/zenvix-notification-poller';
import { processSyncQueue } from '@/api/zenvix-order-sync';

const QUEUE_PROCESSING_INTERVAL_MS = 30_000;

/**
 * Initialize Zenvix session on mount:
 * - Sends session.start event (Requirement 9.4)
 * - Starts notification poller for eligible orders (Requirement 7.3, 7.5)
 * - Flushes pending event retry queue
 * - Flushes pending order sync queue
 * - Sets up 30-second interval for periodic queue processing
 * - Stops poller and clears interval on unmount
 */
export function useZenvixSession() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Fire session.start event on page load (Requirement 9.4)
    sendSessionStart();

    // 2. Start Notification_Poller for all eligible orders in localStorage (Requirements 7.3, 7.5)
    startPolling();

    // 3. Flush any pending events in the retry queue
    processRetryQueue();

    // 4. Flush any pending order syncs
    processSyncQueue();

    // 5. Set up periodic queue processing every 30 seconds
    const intervalId = setInterval(() => {
      processRetryQueue();
      processSyncQueue();
    }, QUEUE_PROCESSING_INTERVAL_MS);

    // 6. Cleanup on unmount: stop poller and clear interval
    return () => {
      stopPolling();
      clearInterval(intervalId);
    };
  }, []);
}
