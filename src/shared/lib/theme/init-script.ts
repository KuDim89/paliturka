import { THEME_COOKIE } from './theme';

/**
 * Inline script for `<head>`: applies the theme before the body is painted, so the wrong theme
 * never flashes and the root layout does not need `cookies()`, which would make pages dynamic.
 * It repeats `resolveTheme` and `applyTheme` because it runs before any bundle loads; the tests
 * check both against the same cases. While no theme cookie is set, it follows system changes.
 * A future Content Security Policy must allow it (hash or nonce).
 */
export const themeInitScript = `(function () {
  try {
    var root = document.documentElement;
    var media = window.matchMedia('(prefers-color-scheme: dark)');
    var chosen = function () {
      var match = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/);
      var value = match ? match[1] : null;
      return value === 'light' || value === 'dark' ? value : null;
    };
    var apply = function () {
      var theme = chosen() || (media.matches ? 'dark' : 'light');
      root.classList.toggle('dark', theme === 'dark');
      root.style.colorScheme = theme;
    };
    apply();
    media.addEventListener('change', function () {
      if (!chosen()) apply();
    });
  } catch (error) {}
})();`;
