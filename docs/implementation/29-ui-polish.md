# Prompt 29: UI Polish & Error Handling

## Context
Polish the UI with consistent error handling, loading states, and accessibility.

## Goals
1. Implement global error boundary
2. Add loading skeletons
3. Configure toast notifications
4. Improve accessibility

---

## Prompt

```text
Polish the UI with error handling and accessibility improvements.

ERROR BOUNDARY (src/components/common/ErrorBoundary.tsx):
- Catch React errors and display fallback UI
- Log errors for debugging
- Provide refresh button

LOADING STATES:
- LoadingSpinner component with size variants
- TableSkeleton for data tables
- CardSkeleton for stat cards
- PageLoading for full page loading

TOAST SYSTEM:
- Configure sonner for notifications
- Success, error, warning, info variants
- Promise-based toasts for async operations

API ERROR HANDLING:
- Intercept 401 for auth expiry
- Show toast for 403, 500 errors
- Handle network errors gracefully

ACCESSIBILITY:
- Skip to content link
- ARIA labels on buttons
- Focus management in modals
- Keyboard navigation in tables

EMPTY STATES:
- Reusable EmptyState component
- Custom icons and actions

VERIFICATION:
1. Test error boundary
2. Verify loading states
3. Check toast notifications
4. Run Lighthouse accessibility audit
5. Test keyboard navigation

SUCCESS CRITERIA:
- Errors handled gracefully
- Loading states smooth
- Toasts consistent
- Accessibility score >90
```

---

## Next Step
Proceed to [Prompt 30: Storybook Integration](./30-storybook.md)
