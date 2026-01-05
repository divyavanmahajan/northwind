#!/bin/bash
# Verify frontend-backend integration

echo "Checking backend health..."
curl -s http://localhost:8000/api/v1/health | jq .

echo "Checking CORS headers..."
curl -s -I -X OPTIONS http://localhost:8000/api/v1/health \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control

echo "Checking frontend..."
curl -s http://localhost:5173 | head -20

echo "Running frontend tests..."
cd frontend && npm test -- --run
