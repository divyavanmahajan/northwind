# Agile Development Guidelines

This document outlines the workflow for managing features, bugs, and enhancements using GitHub Issues and structured development practices.

## 1. Issue Tracking

All changes to the codebase must be tracked via GitHub Issues. This ensures visibility, accountability, and a clear history of why changes were made.

### Issue Types
- **User Story (Feature)**: New functionality described from the end-user's perspective.
- **Bug**: An error, flaw, or fault in the system that causes it to produce an incorrect or unexpected result.
- **Enhancement**: Improvements to existing features (performance, UI/UX, refactoring).
- **Task**: Maintenance or infrastructure work that doesn't directly impact user features.

### GitHub Issue Registration
If a change is requested (whether in chat or via planning), an issue must be created **before** implementation begins.

**Issue Format:**
- **Title**: Clear and concise (e.g., "Enhancement: Adaptive Revenue Graph Date Range")
- **Description**: For User Stories, use the format:
  > As a [role], I want [action] so that [benefit].
- **Acceptance Criteria**: List specific conditions that must be met for the issue to be considered "Done".
- **Labels**: Assign appropriate labels (`bug`, `enhancement`, `feature`).

## 2. Development Workflow

### Branching
Create a new branch for every issue. The branch name should include the issue number and a brief description.
- Format: `feature/issue-number-description` or `bugfix/issue-number-description`
- Example: `feature/45-dashboard-date-range`

### Commits
Every commit must reference the issue number it relates to.
- Format: `action(scope): description (closes #issue-number)`
- Example: `feat(dashboard): adjust revenue graph to use order date extremes (closes #45)`

### Pull Requests
When work is complete:
1. Create a Pull Request (PR) from your feature/bugfix branch to the `main` branch.
2. Link the issue in the PR description (e.g., "Fixes #45").
3. Ensure all tests relevant to the change pass.

## 3. Real-time Requests
If the user asks for a change in chat:
1. **Acknowledge** the request.
2. **Create a GitHub Issue** using the `mcp_github_issue_write` tool.
3. **Notify** the user of the created issue number.
4. **Proceed** with the implementation following the guidelines above.
