// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { themeInitScript } from './init-script';
import { setTheme } from './set-theme';
import { resolveTheme } from './theme';

type ChangeListener = () => void;

// jsdom has no matchMedia; this stands in for the system color scheme.
function mockSystemScheme(prefersDark: boolean) {
  const listeners: ChangeListener[] = [];
  const media = {
    matches: prefersDark,
    addEventListener: (_type: 'change', listener: ChangeListener) => listeners.push(listener),
  };
  vi.stubGlobal('matchMedia', () => media);
  return {
    change(nextPrefersDark: boolean) {
      media.matches = nextPrefersDark;
      listeners.forEach((listener) => listener());
    },
  };
}

function runInitScript() {
  new Function(themeInitScript)();
}

function clearCookie() {
  document.cookie = 'theme=; path=/; max-age=0';
}

const root = document.documentElement;

function currentTheme() {
  return root.classList.contains('dark') ? 'dark' : 'light';
}

beforeEach(() => {
  clearCookie();
  root.className = '';
  root.removeAttribute('style');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('themeInitScript', () => {
  test.each([
    { cookie: 'light', prefersDark: false },
    { cookie: 'light', prefersDark: true },
    { cookie: 'dark', prefersDark: false },
    { cookie: 'dark', prefersDark: true },
    { cookie: undefined, prefersDark: false },
    { cookie: undefined, prefersDark: true },
    { cookie: 'sepia', prefersDark: false },
    { cookie: 'sepia', prefersDark: true },
  ])(
    'matches resolveTheme for cookie $cookie and system dark $prefersDark',
    ({ cookie, prefersDark }) => {
      if (cookie !== undefined) document.cookie = `theme=${cookie}; path=/`;
      mockSystemScheme(prefersDark);

      runInitScript();

      const expected = resolveTheme(cookie, prefersDark);
      expect(currentTheme()).toBe(expected);
      expect(root.style.colorScheme).toBe(expected);
    },
  );

  test('reads the theme cookie among other cookies', () => {
    document.cookie = 'other=1; path=/';
    document.cookie = 'theme=dark; path=/';
    document.cookie = 'last=2; path=/';
    mockSystemScheme(false);

    runInitScript();

    expect(currentTheme()).toBe('dark');
    document.cookie = 'other=; path=/; max-age=0';
    document.cookie = 'last=; path=/; max-age=0';
  });

  test('follows system changes while no theme cookie is set', () => {
    const system = mockSystemScheme(false);
    runInitScript();
    expect(currentTheme()).toBe('light');

    system.change(true);
    expect(currentTheme()).toBe('dark');

    system.change(false);
    expect(currentTheme()).toBe('light');
  });

  test('ignores system changes once a theme is chosen', () => {
    const system = mockSystemScheme(false);
    runInitScript();

    setTheme('light');
    system.change(true);

    expect(currentTheme()).toBe('light');
  });
});

describe('setTheme', () => {
  test('sets the dark class and color scheme on <html> at once', () => {
    setTheme('dark');

    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');

    setTheme('light');

    expect(root.classList.contains('dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');
  });

  test('writes the theme cookie', () => {
    setTheme('dark');

    expect(document.cookie).toContain('theme=dark');
  });

  test('keeps the cookie for a year on the whole site, sent only on same-site requests', () => {
    const write = vi.spyOn(document, 'cookie', 'set');

    setTheme('dark');

    expect(write).toHaveBeenCalledWith('theme=dark; path=/; max-age=31536000; samesite=lax');
    write.mockRestore();
  });

  test('the chosen theme is applied again on the next page load', () => {
    setTheme('dark');

    // A reload: a fresh <html>, a light system, and the init script runs first.
    root.className = '';
    root.removeAttribute('style');
    mockSystemScheme(false);
    runInitScript();

    expect(currentTheme()).toBe('dark');
  });
});
