# Prompt 27: E2E Test Setup (Playwright)

## Context
Beginning Phase 6: Polish, Testing & Deployment. Set up Playwright for end-to-end testing.

## Prerequisites
- All previous prompts completed
- Application fully functional

## Goals
1. Install and configure Playwright
2. Create test utilities and fixtures
3. Write auth flow tests
4. Write CRUD operation tests
5. Write role-based access tests

---

## Prompt

```text
Set up Playwright for end-to-end testing of the Northwind application.

INSTALL PLAYWRIGHT:
```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

PLAYWRIGHT CONFIG (frontend/playwright.config.ts):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

TEST FIXTURES (frontend/e2e/fixtures.ts):
```typescript
import { test as base, expect } from '@playwright/test';

// User credentials for each role
const users = {
  admin: { username: 'admin', password: 'Admin123!' },
  manager: { username: 'manager', password: 'Manager123!' },
  employee: { username: 'employee', password: 'Employee123!' },
  customer: { username: 'customer1', password: 'Customer123!' },
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
  await page.goto('/login');
  await page.fill('#username', credentials.username);
  await page.fill('#password', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export { expect };
```

AUTH TESTS (frontend/e2e/auth.spec.ts):
```typescript
import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Northwind' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'invalid');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should logout successfully', async ({ adminPage }) => {
    // Click user menu
    await adminPage.click('[data-testid="user-menu"]');
    await adminPage.click('text=Log out');
    await adminPage.waitForURL('/login');
    await expect(adminPage.getByRole('heading', { name: 'Northwind' })).toBeVisible();
  });

  test('should persist login across page refresh', async ({ adminPage }) => {
    await adminPage.reload();
    await expect(adminPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/products');
    await page.waitForURL('/login');
  });
});
```

CATEGORIES CRUD TESTS (frontend/e2e/categories.spec.ts):
```typescript
import { test, expect } from './fixtures';

test.describe('Categories Management', () => {
  test('should display categories list', async ({ adminPage }) => {
    await adminPage.goto('/categories');
    await expect(adminPage.getByRole('heading', { name: 'Categories' })).toBeVisible();
    await expect(adminPage.getByText('Beverages')).toBeVisible();
  });

  test('should search categories', async ({ adminPage }) => {
    await adminPage.goto('/categories');
    await adminPage.fill('[placeholder="Search categories..."]', 'bev');
    await expect(adminPage.getByText('Beverages')).toBeVisible();
    await expect(adminPage.getByText('Seafood')).not.toBeVisible();
  });

  test('admin should create category', async ({ adminPage }) => {
    await adminPage.goto('/categories');
    await adminPage.click('text=Add Category');
    
    await adminPage.fill('#category_name', 'Test Category');
    await adminPage.fill('#description', 'Test Description');
    await adminPage.click('button:has-text("Create")');
    
    await expect(adminPage.getByText('Category created successfully')).toBeVisible();
    await expect(adminPage.getByText('Test Category')).toBeVisible();
  });

  test('admin should edit category', async ({ adminPage }) => {
    await adminPage.goto('/categories');
    
    // Click edit on first category
    await adminPage.click('[data-testid="edit-category-1"]');
    await adminPage.fill('#category_name', 'Updated Category');
    await adminPage.click('button:has-text("Update")');
    
    await expect(adminPage.getByText('Category updated successfully')).toBeVisible();
  });

  test('admin should delete category', async ({ adminPage }) => {
    // First create a category to delete
    await adminPage.goto('/categories');
    await adminPage.click('text=Add Category');
    await adminPage.fill('#category_name', 'Delete Me');
    await adminPage.click('button:has-text("Create")');
    
    // Now delete it
    await adminPage.click('[data-testid="delete-category"]');
    await adminPage.click('button:has-text("Delete")');
    
    await expect(adminPage.getByText('Category deleted successfully')).toBeVisible();
  });

  test('employee cannot create category', async ({ employeePage }) => {
    await employeePage.goto('/categories');
    await expect(employeePage.getByRole('button', { name: 'Add Category' })).not.toBeVisible();
  });
});
```

ROLE-BASED ACCESS TESTS (frontend/e2e/roles.spec.ts):
```typescript
import { test, expect } from './fixtures';

test.describe('Role-Based Access', () => {
  test('admin can access all navigation items', async ({ adminPage }) => {
    await expect(adminPage.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Categories' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Customers' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Suppliers' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Employees' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Users' })).toBeVisible();
  });

  test('customer cannot access admin pages', async ({ customerPage }) => {
    await expect(customerPage.getByRole('link', { name: 'Users' })).not.toBeVisible();
    await expect(customerPage.getByRole('link', { name: 'Employees' })).not.toBeVisible();
    
    // Try direct URL access
    await customerPage.goto('/users');
    await expect(customerPage.getByText('Access Denied')).toBeVisible();
  });

  test('customer sees only own orders', async ({ customerPage }) => {
    await customerPage.goto('/orders');
    // Should only see orders belonging to customer1's linked customer
    const orders = await customerPage.locator('table tbody tr').count();
    expect(orders).toBeGreaterThan(0);
    
    // Verify customer name matches
    const firstOrderCustomer = await customerPage.locator('table tbody tr:first-child td:nth-child(3)').textContent();
    expect(firstOrderCustomer).toContain('customer');
  });
});
```

ORDERS FLOW TEST (frontend/e2e/orders.spec.ts):
```typescript
import { test, expect } from './fixtures';

test.describe('Orders Flow', () => {
  test('should create an order', async ({ managerPage }) => {
    await managerPage.goto('/orders/new');
    
    // Select customer
    await managerPage.click('#customer_id');
    await managerPage.click('text=ALFKI');
    
    // Add product
    await managerPage.click('text=Add Item');
    await managerPage.click('[data-testid="product-select-0"]');
    await managerPage.click('text=Chai');
    await managerPage.fill('[data-testid="quantity-0"]', '5');
    
    // Submit
    await managerPage.click('button:has-text("Create Order")');
    
    await expect(managerPage.getByText('Order created successfully')).toBeVisible();
  });

  test('should update order status', async ({ managerPage }) => {
    await managerPage.goto('/orders');
    await managerPage.click('table tbody tr:first-child');
    
    // Change status from pending to processing
    await managerPage.click('[data-testid="status-select"]');
    await managerPage.click('text=Processing');
    
    await expect(managerPage.getByText('Status updated')).toBeVisible();
  });
});
```

PACKAGE.JSON SCRIPTS:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

VERIFICATION:
1. Ensure backend and frontend are running
2. Run: npm run test:e2e
3. View report: npx playwright show-report

SUCCESS CRITERIA:
- Playwright installed and configured
- Auth flow tests pass
- CRUD tests pass
- Role-based access tests pass
- All tests run in CI environment
```

---

## Next Step
Proceed to [Prompt 28: Backend Coverage & Final Tests](./28-final-tests.md)
