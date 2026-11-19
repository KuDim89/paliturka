export const THEMES = ['light', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

/** Cookie with the theme the user chose. Without it, the theme follows the system. */
export const THEME_COOKIE = 'theme';

export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

/** The chosen theme wins; a missing or unknown cookie value falls back to the system preference. */
export function resolveTheme(cookieValue: string | null | undefined, prefersDark: boolean): Theme {
  if (isTheme(cookieValue)) return cookieValue;
  return prefersDark ? 'dark' : 'light';
}

/** Sets the class the `dark` variant and the tokens depend on, and the native color scheme. */
export function applyTheme(root: HTMLElement, theme: Theme): void {
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}
