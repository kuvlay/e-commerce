# Shared Components

This directory contains components that are used across multiple domains in the frontend application.

## 📁 Structure

### **Layout** (`/layout`)
Components that provide the overall application layout and structure:
- `Navbar.jsx` - Main navigation bar
- `Footer.jsx` - Application footer
- `PageWrapper.jsx` - Page layout wrapper

### **UI** (`/ui`)
Reusable UI components used across multiple domains:
- `Title.jsx` - Section titles and headings
- `FloatingLabelInput.jsx` - Form input with floating labels
- `ValidationMessage.jsx` - Form validation messages
- `SkeletonLoader.jsx` - Loading skeleton components
- `CacheStatus.jsx` - Cache status indicator

### **Media** (`/media`)
Media-related components for images, videos, and visual content:
- `ImageSlide.jsx` - Image slider component
- `PlaceholderImage.jsx` - Placeholder image component
- `ScrollImageSection.jsx` - Scroll-based image sections
- `ScrollImageSlide.jsx` - Scroll image slide component

### **Business** (`/business`)
Business logic components that provide common functionality:
- `NewsletterBox.jsx` - Newsletter subscription
- `OurPolicy.jsx` - Company policies display
- `WhyChooseUs.jsx` - Company value proposition
- `AboutContact.jsx` - About and contact information
- `OurStorySection.jsx` - Company story section
- `HeroBanner.jsx` - Hero banner component

## 🔄 Usage

Shared components are imported by domains using relative paths:

```javascript
// From a domain component
import { Navbar } from '../../../shared/layout/Navbar';
import { Title } from '../../../shared/ui/Title';
import { ImageSlide } from '../../../shared/media/ImageSlide';
```

## 🎯 Design Principles

1. **Reusability**: Components used by 2+ domains
2. **No Domain Logic**: Pure presentation components
3. **Configurable**: Accept props for customization
4. **Consistent**: Follow design system guidelines

---

*Shared components provide consistent UI elements across all domains.*