import { test, expect } from './fixtures';

test.describe('Authentication', () => {
    test('should show login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByText('Northwind')).toBeVisible();
        await expect(page.getByLabel('Username')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#username', 'invalid');
        await page.fill('#password', 'wrongpassword');
        await page.click('button[type="submit"]');
        await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 10000 });
    });

    test('should login successfully and redirect to dashboard', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#username', 'admin');
        await page.fill('#password', 'Admin123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });

    test('should logout successfully', async ({ adminPage }) => {
        // Click user menu
        await adminPage.click('[data-testid="user-menu"]');
        await adminPage.click('[data-testid="logout-button"]');
        await adminPage.waitForURL('**/login');
        await expect(adminPage.getByText('Northwind')).toBeVisible();
    });

    test('should redirect to login when accessing protected route', async ({ page }) => {
        await page.goto('/products');
        await page.waitForURL('**/login');
    });
});
