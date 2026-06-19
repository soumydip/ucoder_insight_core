import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isBot } from '../../src/spam/isBot';

describe('isBot Detection', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { userAgent: '', webdriver: false, plugins: [1, 2, 3] });
    vi.stubGlobal('window', {});
  });

  it('returns false for standard user agents', () => {
    vi.stubGlobal('navigator', { 
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36',
      plugins: [1]
    });
    expect(isBot()).toBe(false);
  });

  it('returns true for known crawler bots', () => {
    vi.stubGlobal('navigator', { 
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' 
    });
    expect(isBot()).toBe(true);
  });

  it('returns true when Webdriver is active', () => {
    vi.stubGlobal('navigator', { userAgent: 'Chrome', webdriver: true });
    expect(isBot()).toBe(true);
  });

  it('returns true for Headless Chrome scenarios', () => {
    vi.stubGlobal('navigator', { 
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/114.0.0.0',
      plugins: [] 
    });
    expect(isBot()).toBe(true);
  });
});