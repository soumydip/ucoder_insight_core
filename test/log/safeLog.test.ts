import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeLog } from '../../src/log/safeLog';
import * as rateLimiter from '../../src/spam/rateLimiter';
import * as transport from '../../src/log/transport';
import * as logger from '../../src/log/loger';

describe('safeLog Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('drops the log if logging is not allowed by configuration', () => {
    vi.spyOn(transport, 'isLoggingAllowed').mockReturnValue(false);
    const allowLogSpy = vi.spyOn(rateLimiter, 'allowLog');

    const result = safeLog('click', 'ui_interaction', { element: 'btn', key: '1', page: '/', tag: 'button', userId: 'user_1' });
    
    expect(result).toBeNull();
    expect(allowLogSpy).not.toHaveBeenCalled();
  });

  it('drops the log if the rate limit is exceeded', () => {
    vi.spyOn(transport, 'isLoggingAllowed').mockReturnValue(true);
    vi.spyOn(rateLimiter, 'allowLog').mockReturnValue(false);
    const logSpy = vi.spyOn(logger, 'log');

    const result = safeLog('click', 'ui_interaction', { element: 'btn', key: '1', page: '/', tag: 'button', userId: 'user_1' });
    
    expect(result).toBeNull();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('proceeds to log if configurations and rate limits pass', () => {
    vi.spyOn(transport, 'isLoggingAllowed').mockReturnValue(true);
    vi.spyOn(rateLimiter, 'allowLog').mockReturnValue(true);
    const logSpy = vi.spyOn(logger, 'log').mockReturnValue({} as any);

    safeLog('click', 'ui_interaction', { element: 'btn', key: '1', page: '/', tag: 'button', userId: 'user_1' });
    
    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});