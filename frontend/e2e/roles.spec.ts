import { test, expect } from './fixtures';

test.describe('Role-Based Access Control', () => {
    test('admin should see all navigation links', async ({ adminPage }) => {
        await expect(adminPage.getByRole('link', { name: 'Dashboard' })).toBeVisible();
        await expect(adminPage.getByRole('link', { name: 'Products' })).toBeVisible();
        await expect(adminPage.getByRole('link', { name: 'Categories' })).toBeVisible();
        await expect(adminPage.getByRole('link', { name: 'Orders' })).toBeVisible();
        await expect(adminPage.getByRole('link', { name: 'Customers' })).toBeVisible();
        await expect(adminPage.getByRole('link', { name: 'Suppliers' })).toBeVisible();
        await expect(adminPage.getByRole('link', { name: 'Employees' })).toBeVisible();
        await expect(adminPage.getByRole('link', { name: 'Users' })).toBeVisible();
    });

    test('employee should not see Users link', async ({ employeePage }) => {
        await expect(employeePage.getByRole('link', { name: 'Dashboard' })).toBeVisible();
        await expect(employeePage.getByRole('link', { name: 'Users' })).not.toBeVisible();
    });

    test('customer should only see allowed links', async ({ customerPage }) => {
        await expect(customerPage.getByRole('link', { name: 'Dashboard' })).toBeVisible();
        await expect(customerPage.getByRole('link', { name: 'Products' })).toBeVisible();
        await expect(customerPage.getByRole('link', { name: 'Categories' })).toBeVisible();
        await expect(customerPage.getByRole('link', { name: 'Orders' })).toBeVisible();

        // Should NOT see admin/manager/employee only links
        await expect(customerPage.getByRole('link', { name: 'Suppliers' })).not.toBeVisible();
        await expect(customerPage.getByRole('link', { name: 'Employees' })).not.toBeVisible();
        await expect(customerPage.getByRole('link', { name: 'Users' })).not.toBeVisible();
    });
});
