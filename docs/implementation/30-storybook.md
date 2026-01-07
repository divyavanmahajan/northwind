# Prompt 30: Storybook Integration

## Context
Create a Storyboard (Storybook) for all React components to enable isolated component development and documentation.

## Goals
1. Install and configure Storybook
2. Create stories for all common UI components
3. Create stories for business-specific components
4. Add documentation for component usage

---

## Prompt

```text
Install and configure Storybook for the React frontend and create stories for all existing components.

INSTALLATION:
- Run `npx storybook@latest init` in the frontend directory
- Configure Storybook to work with Tailwind CSS and Vite
- Update `.storybook/main.ts` and `.storybook/preview.ts` as needed

COMMON COMPONENTS (src/components/common):
- Create stories for `Button`, `Input`, `Select`, `Badge`, `DataTable`, `Pagination`, `LoadingSpinner`, `EmptyState`, etc.
- Include variants (colors, sizes, states) for each component
- Use Mock data for complex components like `DataTable`

BUSINESS COMPONENTS:
- Create stories for `OrderStatusBadge`, `CategoryCard`, `SupplierCard`
- Create stories for forms like `CategoryForm`, `ProductForm` using `react-hook-form` and decorators

INTERACTIONS & DOCUMENTATION:
- Use Storybook Controls for interactive property testing
- Use Storybook Actions to verify event handling
- Add JSDoc comments to components to populate Storybook Docs

VERIFICATION:
1. Run `npm run storybook` and ensure it opens correctly
2. Verify all components are visible in the sidebar
3. Test component variants using the Controls panel
4. Ensure no console errors when viewing stories

SUCCESS CRITERIA:
- Storybook is fully operational
- All reusable components have stories
- Components are documented with clear examples
- Isolated testing of UI components is possible
```

---

## Next Step
Proceed to [Prompt 31: Docker Production & Documentation](./31-docker-production.md)
