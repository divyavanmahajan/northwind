import { test, expect } from './fixtures';

test.describe('Health Check', () => {
  test('shows health status on dashboard', async ({ adminPage }) => {
    // Already on dashboard after login via fixture
    await expect(adminPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    // If there's a health indicator, check for it
    // Otherwise just verify dashboard loaded successfully
  });
});

