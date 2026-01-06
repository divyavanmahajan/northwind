import { test as base, expect } from '@playwright/test';

// User credentials for each role
const users = {
    admin: { username: 'admin', password: 'Admin123!' },
    manager: { username: 'manager', password: 'Manager123!' },
    employee: { username: 'employee', password: 'Employee123!' },
    customer: { username: 'customer', password: 'Customer123!' },
};

export const test = base.extend({
    // Auto-login as admin
    adminPage: async ({ page }, use) => {
        await loginAs(page, users.admin);
        await use(page);
    },

    // Auto-login as manager
    managerPage: async ({ page }, use) => {
        await loginAs(page, users.manager);
        await use(page);
    },

    // Auto-login as employee
    employeePage: async ({ page }, use) => {
        await loginAs(page, users.employee);
        await use(page);
    },

    // Auto-login as customer
    customerPage: async ({ page }, use) => {
        await loginAs(page, users.customer);
        await use(page);
    },
});

async function loginAs(page: any, credentials: { username: string; password: string }) {
    // Navigate to login page
    await page.goto('/login');

    // Wait for login form to be ready
    await page.waitForSelector('#username', { state: 'visible', timeout: 10000 });

    // Fill credentials
    await page.fill('#username', credentials.username);
    await page.fill('#password', credentials.password);

    // Click submit and wait for navigation
    await Promise.all([
        page.waitForURL('**/dashboard', { timeout: 20000 }),
        page.click('button[type="submit"]'),
    ]);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
}

export { expect };

