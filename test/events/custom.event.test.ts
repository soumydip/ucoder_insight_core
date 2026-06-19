import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackCustomEvent } from '../../src/events/custom.event';
import * as safeLogModule from '../../src/log/safeLog';
import { SDKConfigCache, analyticsCache } from '../../src/loader/analyticsCache';

describe('trackCustomEvent', () => {
  let safeLogSpy: any;

  beforeEach(() => {
    safeLogSpy = vi.spyOn(safeLogModule, 'safeLog').mockImplementation(() => null);
    
    SDKConfigCache.trackCustomEvents = true;
    analyticsCache.userId = 'test_user_123';
    
    Object.defineProperty(window, 'location', {
      value: { pathname: '/checkout', origin: 'http://localhost' },
      writable: true
    });
    
  });
  

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips tracking if trackCustomEvents is disabled in config', () => {
    SDKConfigCache.trackCustomEvents = false;
    
    trackCustomEvent({ event_name: 'purchase', action_category: 'ecommerce' });
    
    expect(safeLogSpy).not.toHaveBeenCalled();
  });

  it('calls safeLog with correctly mapped payload properties', () => {
    trackCustomEvent({
      event_name: 'add_to_cart',
      action_category: 'ecommerce',
      status: 'success',
      object_id: 'product_99'
    });

    expect(safeLogSpy).toHaveBeenCalledTimes(1);
    expect(safeLogSpy).toHaveBeenCalledWith(
      'custom',
      'custom',
      expect.objectContaining({
        element: 'add_to_cart',
        tag: 'custom',
        userId: 'test_user_123',
        page: '/checkout'
      }),
      expect.objectContaining({
        event_name: 'add_to_cart',
        action_category: 'ecommerce',
        status: 'success',
        object_id: 'product_99'
      })
    );
  });
});