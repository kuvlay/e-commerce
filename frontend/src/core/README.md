# Core Infrastructure

This directory contains the core infrastructure that is shared across all domains in the frontend application.

## 📁 Structure

### **Context** (`/context`)
Global React contexts that provide state management across the entire application:
- `ShopContext.jsx` - Global shop state (products, cart, search)
- `UserContext.jsx` - User authentication and profile state
- `WishlistContext.jsx` - Wishlist functionality state

### **Hooks** (`/hooks`)
Global custom hooks that can be used across multiple domains:
- `useAuthSync.js` - Authentication state synchronization
- `useCartAnimations.js` - Cart animation utilities
- `useLoadingStates.js` - Loading state management
- `usePageTransition.js` - Page transition effects
- `useScrollAnimation.js` - Scroll-based animations
- `useSmootherLoading.js` - Smooth loading experiences

### **Utils** (`/utils`)
Utility functions and helpers used across the application:
- `animations.js` - Animation utilities and configurations
- `animationConfig.js` - Animation configuration constants
- `authUtils.js` - Authentication helper functions
- `index.js` - Utility exports

### **Constants** (`/constants`)
Application-wide constants and configuration:
- `measurements.js` - Product measurement definitions
- `theme.js` - Theme colors and styling constants

### **Services** (`/services`)
API service layers for backend communication:
- `userService.js` - User-related API calls

## 🔄 Usage

Core infrastructure is imported by domains using relative paths:

```javascript
// From a domain component
import { ShopContext } from '../../../core/context/ShopContext';
import { useAuthSync } from '../../../core/hooks/useAuthSync';
import { COLORS } from '../../../core/constants/theme';
```

## 🎯 Design Principles

1. **Shared Responsibility**: Only code used by multiple domains
2. **No Domain Logic**: Pure infrastructure, no business logic
3. **Stable APIs**: Changes should be backward compatible
4. **Clear Boundaries**: Well-defined interfaces between core and domains

---

*Core infrastructure provides the foundation for all domain-specific functionality.*