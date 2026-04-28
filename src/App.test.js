import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders the login experience', async () => {
  render(<App />);
  expect(
    await screen.findByRole('heading', { name: /welcome to mhip/i })
  ).toBeInTheDocument();
});
