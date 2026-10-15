# Testing Guide

This document describes the testing infrastructure for the Forever E-commerce platform.

## Overview

The project uses **Vitest** as the testing framework across all modules (frontend, backend, admin). Each module has its own test suite with smoke tests to verify critical functionality.

## Test Structure

```
├── frontend/src/test/
│   ├── setup.js          # Test setup and configuration
│   └── smoke.test.jsx     # Basic functionality tests
├── backend/test/
│   ├── setup.js          # Test setup and mocks
│   └── api/              # API endpoint tests
│       ├── health.test.js
│       └── routes.test.js
├── admin/src/test/
│   ├── setup.js          # Test setup and configuration
│   └── smoke.test.jsx     # Basic functionality tests
└── test-runner.js        # Cross-module test runner
```

## Running Tests

### Individual Modules

```bash
# Frontend tests
npm run test:frontend

# Backend tests
npm run test:backend

# Admin tests
npm run test:admin
```

### All Tests

```bash
# Run all tests sequentially
npm test

# Run with detailed summary
npm run test:summary

# Run in watch mode (all modules)
npm run test:watch
```

### Watch Mode (Individual)

```bash
# Watch frontend tests
npm run test:frontend:watch

# Watch backend tests
npm run test:backend:watch

# Watch admin tests
npm run test:admin:watch
```

## Test Types

### Smoke Tests

Basic tests that verify:

- Core dependencies are available
- Basic functionality works
- Environment is properly configured
- Critical imports and exports function

### API Tests

- Health check endpoints
- Route availability
- Basic request/response handling
- Error handling

## Pre-commit Hooks

The project includes pre-commit hooks that automatically run tests before commits.

### Setup

```bash
# Install git hooks
npm run setup:hooks
```

### Usage

- Tests run automatically before each commit
- Commit is blocked if tests fail
- Skip temporarily with: `git commit --no-verify`

### Manual Pre-commit Check

```bash
npm run test:pre-commit
```

## Test Configuration

### Frontend (Vitest + React Testing Library)

- **Framework**: Vitest with jsdom environment
- **Testing Library**: @testing-library/react
- **Setup**: `frontend/src/test/setup.js`
- **Config**: `frontend/vite.config.js`

### Backend (Vitest + Supertest)

- **Framework**: Vitest with node environment
- **HTTP Testing**: Supertest for API endpoints
- **Setup**: `backend/test/setup.js`
- **Config**: `backend/vite.config.js`

### Admin (Vitest + React Testing Library)

- **Framework**: Vitest with jsdom environment
- **Testing Library**: @testing-library/react
- **Setup**: `admin/src/test/setup.js`
- **Config**: `admin/vite.config.js`

## Test Scripts

| Script                    | Description                       |
| ------------------------- | --------------------------------- |
| `npm test`                | Run all tests across modules      |
| `npm run test:summary`    | Run tests with detailed reporting |
| `npm run test:ci`         | CI-friendly test runner           |
| `npm run test:watch`      | Watch mode for all modules        |
| `npm run setup:hooks`     | Install git pre-commit hooks      |
| `npm run test:pre-commit` | Manual pre-commit test run        |

## Adding New Tests

### Frontend/Admin Tests

```javascript
// src/test/component.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MyComponent from "../components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### Backend Tests

```javascript
// test/api/endpoint.test.js
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("API Endpoint", () => {
  it("should respond with 200", async () => {
    const response = await request(app).get("/api/endpoint").expect(200);

    expect(response.body).toBeDefined();
  });
});
```

## Troubleshooting

### Common Issues

1. **React Hook Errors**: Use proper mocking for complex components
2. **GSAP/Animation Errors**: Mock animation libraries in test setup
3. **Environment Variables**: Ensure test environment variables are set
4. **Module Resolution**: Check import paths and module availability

### Debug Mode

```bash
# Run tests with verbose output
npm run test:frontend -- --reporter=verbose

# Run specific test file
npm run test:frontend -- src/test/specific.test.jsx
```

## CI/CD Integration

The test suite is designed to work in CI/CD environments:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm run test:ci
```

## Performance

- **Frontend Tests**: ~3-5 seconds
- **Backend Tests**: ~1-3 seconds
- **Admin Tests**: ~3-5 seconds
- **Total Runtime**: ~10-15 seconds

## Future Enhancements

- [ ] Integration tests for full user flows
- [ ] Performance testing utilities
- [ ] Visual regression testing
- [ ] Code coverage reporting
- [ ] Parallel test execution