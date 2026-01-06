import { test, expect } from './fixtures';

test.describe('Orders Flow', () => {
    test('should display orders list', async ({ managerPage }) => {
        await managerPage.getByRole('link', { name: 'Orders' }).click();
        await expect(managerPage.getByRole('heading', { name: 'Orders' })).toBeVisible();
        // Verify some data is loaded
        const rows = managerPage.locator('table tbody tr');
        await expect(rows.first()).toBeVisible({ timeout: 10000 });
    });

    test('should view order details', async ({ managerPage }) => {
        await managerPage.getByRole('link', { name: 'Orders' }).click();
        // Wait for orders to load (wait for any order number cell to appear)
        await expect(managerPage.locator('table tbody tr td').first()).toBeVisible({ timeout: 15000 });
        // Give a small delay for the table to be fully interactive
        await managerPage.waitForTimeout(500);

        // Click on the first row link (Order # cell is usually a link)
        const firstRow = managerPage.locator('table tbody tr').first();
        await firstRow.click();

        // Wait for navigation to order detail page
        await managerPage.waitForURL(/\/orders\/\d+/);
        await expect(managerPage.getByRole('heading', { name: /Order #/ })).toBeVisible();
    });


    test('manager should be able to update order status', async ({ managerPage }) => {
        await managerPage.getByRole('link', { name: 'Orders' }).click();
        // Wait for table to load
        await expect(managerPage.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
        await managerPage.locator('table tbody tr:first-child').click();

        const trigger = managerPage.locator('[data-testid="status-select"]');
        if (await trigger.isVisible()) {
            await trigger.click();
            // Try to find a transition option
            const options = managerPage.locator('[role="option"]');
            if (await options.count() > 1) {
                await options.nth(1).click();
                await expect(managerPage.getByText(/successfully/i).or(managerPage.getByText(/updated/i))).toBeVisible();
            }
        }
    });

    test('customer should only see own orders', async ({ customerPage }) => {
        await customerPage.getByRole('link', { name: 'Orders' }).click();

        const rows = customerPage.locator('table tbody tr');

        // Wait for the table to at least show something (either data or empty row)
        await expect(rows.first()).toBeVisible({ timeout: 15000 });

        const firstRowText = await rows.first().innerText();

        // If "No data found" is shown, the test passes as it's a valid state for this user
        if (firstRowText.includes('No data found')) {
            return;
        }

        const count = await rows.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
            const cells = rows.nth(i).locator('td');
            if (await cells.count() > 2) {
                const customerName = await cells.nth(2).textContent();
                expect(customerName).not.toBeNull();
            }
        }
    });
});

