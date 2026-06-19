import { describe, it, expect, beforeEach } from 'vitest';
import { shouldTrackElement } from '../../src/helper/shouldTrackElement';

describe('shouldTrackElement Privacy Rules', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('respects developer override to disable tracking', () => {
    element.setAttribute('data-uca-track', 'false');
    expect(shouldTrackElement(element)).toBe(false);
  });

  it('respects developer override to force tracking', () => {
    element.setAttribute('data-uca-track', 'true');
    expect(shouldTrackElement(element)).toBe(true);
  });

  it('blocks sensitive input fields (password, email)', () => {
    const input = document.createElement('input');
    
    input.type = 'password';
    expect(shouldTrackElement(input)).toBe(false);

    input.type = 'email';
    expect(shouldTrackElement(input)).toBe(false);
  });

  it('blocks textareas completely', () => {
    const textarea = document.createElement('textarea');
    expect(shouldTrackElement(textarea)).toBe(false);
  });
});