import { test, expect } from './fixtures';

test.describe('Categories Management', () => {
    test('should display categories list', async ({ adminPage }) => {
        // Use sidebar navigation instead of full page reload
        await adminPage.getByRole('link', { name: 'Categories' }).click();
        await expect(adminPage.getByRole('heading', { name: 'Categories' })).toBeVisible();
        await expect(adminPage.getByText('Beverages', { exact: true })).toBeVisible();
    });


    test('should search categories', async ({ adminPage }) => {
        await adminPage.getByRole('link', { name: 'Categories' }).click();
        await adminPage.fill('[placeholder="Search categories..."]', 'bev');
        await expect(adminPage.getByText('Beverages', { exact: true })).toBeVisible();
        // The search should filter - Seafood should not be visible when searching for 'bev'
        await expect(adminPage.getByText('Seafood', { exact: true })).not.toBeVisible();
    });


    test('admin should create, edit and delete category', async ({ adminPage }) => {
        const categoryName = `Test Category ${Date.now()}`;
        const updatedName = `${categoryName} Updated`;

        await adminPage.getByRole('link', { name: 'Categories' }).click();

        // Create
        await adminPage.click('text=Add Category');
        await adminPage.fill('#category_name', categoryName);
        await adminPage.fill('#description', 'Test Description');
        await adminPage.click('button:has-text("Create")');

        await expect(adminPage.getByText('Category created successfully')).toBeVisible();

        // Search for the created category to make it visible in the table
        await adminPage.fill('[placeholder="Search categories..."]', categoryName);
        await expect(adminPage.getByText(categoryName)).toBeVisible();


        // Edit
        // Search for it first to get the right row
        await adminPage.fill('[placeholder="Search categories..."]', categoryName);
        const row = adminPage.locator('tr', { hasText: categoryName });
        await row.locator('[data-testid^="edit-category-"]').click();

        await adminPage.fill('#category_name', updatedName);
        await adminPage.click('button:has-text("Update")');

        await expect(adminPage.getByText('Category updated successfully')).toBeVisible();
        await expect(adminPage.getByText(updatedName)).toBeVisible();

        // Delete
        await adminPage.fill('[placeholder="Search categories..."]', updatedName);
        const updatedRow = adminPage.locator('tr', { hasText: updatedName });
        await updatedRow.locator('[data-testid^="delete-category-"]').click();

        await adminPage.click('button:has-text("Delete Category")');
        await expect(adminPage.getByText('Category deleted successfully')).toBeVisible();
    });

    test('employee cannot see Add Category button', async ({ employeePage }) => {
        await employeePage.getByRole('link', { name: 'Categories' }).click();
        await expect(employeePage.getByRole('button', { name: 'Add Category' })).not.toBeVisible();
    });
});

