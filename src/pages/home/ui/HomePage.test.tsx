import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { HomePage } from '@/pages/home';

test('shows the product name as the main heading', () => {
  render(<HomePage />);

  expect(screen.getByRole('heading', { level: 1, name: 'paliturka' })).toBeInTheDocument();
});
