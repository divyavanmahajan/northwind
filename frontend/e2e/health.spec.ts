// Will be implemented in Phase 6
import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('shows health status on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('healthy')).toBeVisible();
  });
});
