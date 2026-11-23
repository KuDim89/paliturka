import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { NotFoundContent } from './NotFoundContent';

describe('not found content', () => {
  test.each([
    ['en', 'This page isn’t here', 'Home page'],
    ['uk', 'Такої сторінки немає', 'На головну'],
  ] as const)('in %s shows the heading and a link home', (locale, heading, link) => {
    render(<NotFoundContent locale={locale} />);

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: link })).toHaveAttribute('href', `/${locale}`);
  });
});
