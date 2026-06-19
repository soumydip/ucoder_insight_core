import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeUrl } from '../../src/helper/normalizePath';

describe('normalizeUrl', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true
    });
  });

  it('replaces MongoDB ObjectIds with [id]', () => {
    expect(normalizeUrl('/posts/60b8d295f1d2c12a34567890/comments')).toBe('/posts/[id]/comments');
  });

  it('replaces UUIDs with [uuid]', () => {
    expect(normalizeUrl('/orders/550e8400-e29b-41d4-a716-446655440000/details')).toBe('/orders/[uuid]/details');
  });

  it('replaces numeric IDs with [id]', () => {
    expect(normalizeUrl('/users/12345/profile')).toBe('/users/[id]/profile');
  });

  it('replaces random alphanumeric strings with [id]', () => {
    expect(normalizeUrl('/item/A1B2C3D4/view')).toBe('/item/[id]/view');
  });

  it('leaves static paths unchanged', () => {
    expect(normalizeUrl('/about-us/contact')).toBe('/about-us/contact');
  });
});