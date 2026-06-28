import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useZenvixSession } from './use-zenvix-session';

// Mock all dependencies
vi.mock('@/api/zenvix-events', () => ({
  sendSessionStart: vi.fn(),
  processRetryQueue: vi.fn(),
}));

vi.mock('@/api/zenvix-notification-poller', () => ({
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
}));

vi.mock('@/api/zenvix-order-sync', () => ({
  processSyncQueue: vi.fn(),
}));

import { sendSessionStart, processRetryQueue } from '@/api/zenvix-events';
import { startPolling, stopPolling } from '@/api/zenvix-notification-poller';
import { processSyncQueue } from '@/api/zenvix-order-sync';

describe('useZenvixSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('calls sendSessionStart on mount', () => {
    renderHook(() => useZenvixSession());
    expect(sendSessionStart).toHaveBeenCalledTimes(1);
  });

  it('calls startPolling on mount', () => {
    renderHook(() => useZenvixSession());
    expect(startPolling).toHaveBeenCalledTimes(1);
  });

  it('calls processRetryQueue on mount', () => {
    renderHook(() => useZenvixSession());
    expect(processRetryQueue).toHaveBeenCalledTimes(1);
  });

  it('calls processSyncQueue on mount', () => {
    renderHook(() => useZenvixSession());
    expect(processSyncQueue).toHaveBeenCalledTimes(1);
  });

  it('processes retry and sync queues every 30 seconds', () => {
    renderHook(() => useZenvixSession());

    // Clear the initial mount calls
    vi.clearAllMocks();

    // Advance 30 seconds
    vi.advanceTimersByTime(30_000);
    expect(processRetryQueue).toHaveBeenCalledTimes(1);
    expect(processSyncQueue).toHaveBeenCalledTimes(1);

    // Advance another 30 seconds
    vi.advanceTimersByTime(30_000);
    expect(processRetryQueue).toHaveBeenCalledTimes(2);
    expect(processSyncQueue).toHaveBeenCalledTimes(2);
  });

  it('calls stopPolling and clears interval on unmount', () => {
    const { unmount } = renderHook(() => useZenvixSession());

    vi.clearAllMocks();
    unmount();

    expect(stopPolling).toHaveBeenCalledTimes(1);

    // After unmount, advancing timers should NOT trigger queue processing
    vi.advanceTimersByTime(60_000);
    expect(processRetryQueue).not.toHaveBeenCalled();
    expect(processSyncQueue).not.toHaveBeenCalled();
  });
});
