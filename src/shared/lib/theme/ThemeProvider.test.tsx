import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, test, vi } from 'vitest';

import { ThemeProvider } from './ThemeProvider';

const { NextThemesProvider } = vi.hoisted(() => ({
  NextThemesProvider: vi.fn(({ children }: { children: ReactNode }) => children),
}));

vi.mock('next-themes', () => ({ ThemeProvider: NextThemesProvider }));

test('renders the page with the project theme settings', () => {
  render(
    <ThemeProvider>
      <p>page</p>
    </ThemeProvider>,
  );

  expect(screen.getByText('page')).toBeInTheDocument();
  expect(NextThemesProvider).toHaveBeenCalledWith(
    expect.objectContaining({
      attribute: 'class',
      defaultTheme: 'system',
      enableSystem: true,
      themes: ['light', 'dark'],
      storageKey: 'theme',
    }),
    undefined,
  );
});
