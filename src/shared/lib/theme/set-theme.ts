import { applyTheme, THEME_COOKIE, THEME_COOKIE_MAX_AGE, type Theme } from './theme';

/** Saves the chosen theme in the cookie and applies it at once. Browser only. */
export function setTheme(theme: Theme): void {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
  applyTheme(document.documentElement, theme);
}
