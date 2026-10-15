# Performance Monitoring Guide

This document describes the performance monitoring utilities for the Forever E-commerce platform.

## Overview

The project includes comprehensive performance monitoring tools to track:
- Bundle sizes and optimization opportunities
- Build and test performance
- Performance regression detection
- Historical performance trends

## Tools

### 1. Bundle Analyzer (`scripts/bundle-analyzer.js`)

Analyzes build output sizes and tracks bundle growth over time.

**Usage:**
```bash
# Analyze current bundle sizes
npm run bundle:analyze

# Check against size thresholds
npm run bundle:check
```

**Features:**
- File size breakdown by type
- Largest files identification
- Historical size tracking
- Threshold warnings and errors

**Thresholds:**
- Warning: 1MB per bundle
- Error: 2MB per bundle

### 2. Performance Monitor (`scripts/performance-monitor.js`)

Measures build and test performance with regression detection.

**Usage:**
```bash
# Run full performance analysis
npm run perf:analyze

# Check for performance regressions
npm run perf:check
```

**Features:**
- Build time measurement
- Test execution time tracking
- Performance trend analysis
- Regression detection (50% build time increase, 30% test time increase)

### 3. Performance Dashboard (`scripts/performance-dashboard.js`)

Provides a comprehensive overview of all performance metrics.

**Usage:**
```bash
# View performance dashboard
npm run perf:dashboard
```

**Features:**
- Current bundle sizes overview
- Performance metrics summary
- Historical trends visualization
- Health status and recommendations

## Data Storage

Performance data is stored in JSON files:
- `bundle-history.json` - Bundle size history (last 10 entries)
- `performance-history.json` - Performance metrics history (last 20 entries)

## Monitoring Workflow

### Daily Development
```bash
# Quick bundle check
npm run bundle:analyze

# Performance overview
npm run perf:dashboard
```

### Before Releases
```bash
# Full performance analysis
npm run perf:analyze

# Check for regressions
npm run perf:check

# Validate bundle sizes
npm run bundle:check
```

### CI/CD Integration
```bash
# In your CI pipeline
npm run bundle:check
npm run perf:check --fail-on-regression
```

## Performance Metrics

### Bundle Size Metrics

| Module | Current Size | Threshold | Status |
|--------|-------------|-----------|---------|
| Frontend | 6.67 MB | 2MB | ❌ Exceeds |
| Admin | 328.46 KB | 2MB | ✅ Good |

### Build Performance

Typical build times:
- Frontend: 15-30 seconds
- Admin: 10-20 seconds

### Test Performance

Typical test times:
- Frontend: 3-5 seconds
- Backend: 1-3 seconds
- Admin: 3-5 seconds

## Optimization Recommendations

### Bundle Size Optimization

**Frontend (6.67 MB - Needs Optimization):**
1. **Image Optimization**
   - Current: 5.22 MB in PNG files
   - Recommendation: Convert to WebP format
   - Use responsive images with different sizes
   - Implement lazy loading for images

2. **Code Splitting**
   - Implement route-based code splitting
   - Use dynamic imports for large dependencies
   - Split vendor bundles from application code

3. **Asset Management**
   - Remove unused images and assets
   - Optimize image compression
   - Use CDN for static assets

**Admin (328.46 KB - Good):**
- Already well-optimized
- Monitor for future growth

### Build Performance

1. **Caching**
   - Enable build caching in CI/CD
   - Use incremental builds where possible

2. **Dependencies**
   - Audit and remove unused dependencies
   - Use lighter alternatives where possible

3. **Configuration**
   - Optimize Vite/Webpack configurations
   - Enable parallel processing

### Test Performance

1. **Test Optimization**
   - Use test parallelization
   - Implement test result caching
   - Optimize test setup and teardown

2. **Mocking**
   - Mock heavy dependencies
   - Use lightweight test doubles

## Alerts and Thresholds

### Bundle Size Alerts
- **Warning**: Bundle > 1MB
- **Error**: Bundle > 2MB
- **Critical**: Bundle > 5MB

### Performance Regression Alerts
- **Build Time**: >50% increase
- **Test Time**: >30% increase

### Monitoring Schedule
- **Daily**: Bundle size check
- **Weekly**: Performance trend review
- **Monthly**: Comprehensive optimization review

## Historical Data

The monitoring tools maintain historical data to track trends:

### Bundle Size History
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "bundles": {
    "frontend": { "totalSize": 6995456, "fileCount": 23 },
    "admin": { "totalSize": 336345, "fileCount": 5 }
  }
}
```

### Performance History
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "builds": {
    "frontend": { "buildTime": 25000, "formattedTime": "25.00s" },
    "admin": { "buildTime": 15000, "formattedTime": "15.00s" }
  },
  "tests": {
    "frontend": { "testTime": 4000, "formattedTime": "4.00s" },
    "backend": { "testTime": 2000, "formattedTime": "2.00s" },
    "admin": { "testTime": 3000, "formattedTime": "3.00s" }
  }
}
```

## Integration with Development Workflow

### Git Hooks
Performance checks can be integrated with git hooks:

```bash
# Add to pre-commit hook
npm run bundle:check
npm run perf:check
```

### IDE Integration
Most IDEs can run these scripts as tasks:
- VS Code: Add to tasks.json
- WebStorm: Add as npm scripts

### Automated Reporting
Set up automated reports:
```bash
# Weekly performance report
npm run perf:dashboard > performance-report.txt
```

## Troubleshooting

### Common Issues

1. **No Build Files Found**
   - Run `npm run build` in frontend and admin directories
   - Ensure build outputs are in expected locations

2. **Performance Data Missing**
   - Run `npm run perf:analyze` to generate initial data
   - Check file permissions for JSON data files

3. **Threshold Failures**
   - Review bundle analyzer output for optimization opportunities
   - Consider adjusting thresholds if they're too strict

### Debug Mode
```bash
# Verbose bundle analysis
node scripts/bundle-analyzer.js --verbose

# Debug performance monitoring
node scripts/performance-monitor.js --debug
```

## Future Enhancements

- [ ] Real-time performance monitoring
- [ ] Performance budgets per feature
- [ ] Automated optimization suggestions
- [ ] Integration with monitoring services
- [ ] Performance regression bisection
- [ ] Bundle analysis visualization
- [ ] Performance comparison between branches