# Prompt 32: API Proxy Configuration

## Context
Configure the frontend development server to proxy API requests to the backend, eliminating CORS issues and simplifying configuration.

## Goals
1. Configure Vite proxy for backend API
2. Update API client base URL
3. Ensure seamless development experience
4. Document proxy configuration

---

## Prompt

```text
Configure API proxy in the frontend development server.

VITE CONFIGURATION:

Update vite.config.ts:
- Add server.proxy configuration
- Proxy /api requests to backend
- Configure proper headers
- Enable WebSocket support if needed

API CLIENT UPDATES:

Update apiClient.ts:
- Change baseURL to use relative path /api
- Remove hardcoded backend URLs
- Simplify environment configuration

ENVIRONMENT VARIABLES:

Update .env files:
- Remove VITE_API_URL if using proxy
- Document proxy configuration
- Add backend URL for production builds

VERIFICATION:
1. Start backend server
2. Start frontend dev server
3. Verify API calls work without CORS errors
4. Check network tab shows /api/* requests
5. Test all CRUD operations

SUCCESS CRITERIA:
- No CORS errors in development
- API requests proxy correctly
- All features work as before
- Configuration is documented
```

---

## Benefits

- **No CORS Issues**: Proxy eliminates CORS in development
- **Simplified Config**: No need for backend CORS configuration
- **Production Ready**: Works with nginx proxy in production
- **Better DX**: Cleaner development experience
