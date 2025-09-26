# replit.md

## Overview

PSJ Priya'z Style Jone is a comprehensive e-commerce website for a premium clothing brand specializing in unisex t-shirts, sweatshirts, polos, hoodies, blouses, women's dresses, and corporate/group bulk orders. The application features a complete shopping experience with product browsing, detailed product views with variants, WhatsApp-based ordering, and an admin panel for product management.

## User Preferences

Preferred communication style: Simple, everyday language.
Brand focus: Unisex clothing with emphasis on corporate and bulk orders.
Color scheme: 2025 Pantone colors (Mocha Mousse, Lyons Blue, Winterberry).

## System Architecture

### Frontend Architecture
Multi-page static application with enhanced user experience:

- **Homepage** (`index.html`): Hero banner with brand messaging, featured products section, category browsing
- **Product Detail Page** (`product-detail.html`): Image carousel, color/size selection, WhatsApp ordering
- **Category Pages** (`category.html`): Filtered product listings by category with sorting options
- **Admin Panel** (`admin.html`): Product management, logo upload, WhatsApp configuration
- **Responsive Design**: Bootstrap 5 with custom Pantone 2025 color palette
- **Component-Based UI**: Modular JavaScript for dynamic content rendering

### Data Management
- **Enhanced Product Schema**: Products include multiple images, color variants, size options, category classification, and featured flags
- **JSON Data Store**: Scalable `products.json` structure supporting complex product variants
- **Local Storage**: Admin configurations (WhatsApp number, settings) persist in browser storage
- **Dynamic Loading**: Asynchronous product data loading with error handling and loading states

### E-commerce Features
- **Product Variants**: Multiple images per product, color selection with previews, size availability
- **WhatsApp Integration**: Direct ordering through WhatsApp with formatted order details
- **Category Navigation**: T-Shirts, Shirts, Blouses, Sweatshirts with dedicated browsing pages
- **Admin Management**: Product addition, image upload capabilities, WhatsApp number configuration
- **Brand Customization**: Logo upload system, brand-specific messaging and taglines

### User Experience Components
- **Image Gallery**: Thumbnail navigation with main image display
- **Interactive Selection**: Color picker with visual feedback, size selector with availability status
- **Order Flow**: Disabled state management until selections made, formatted WhatsApp messages
- **Navigation System**: Category dropdown, breadcrumb navigation, responsive mobile menu
- **Loading States**: Spinner components and graceful error handling across all pages

### Styling Architecture
- **2025 Pantone Colors**: Mocha Mousse (primary), Lyons Blue (secondary), Winterberry (accent)
- **Custom CSS Properties**: Centralized design tokens for consistent theming
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
- **Component Styling**: Modular CSS for product cards, admin panels, form components
- **Animation System**: Hover effects, transitions, and loading animations

## Business Logic

### Order Management
- **WhatsApp Integration**: Configurable business number, formatted order messages
- **Product Selection**: Required color and size selection before ordering
- **Order Details**: Comprehensive order information including product specs and customer preferences
- **Bulk Order Support**: Special messaging for corporate and group orders

### Admin Capabilities
- **Product Management**: Add/edit products with multiple images and variants
- **Configuration**: WhatsApp number setup, logo upload and preview
- **Scalability**: Structured for easy product catalog expansion
- **Image Management**: Support for multiple product images and color-specific variants

## External Dependencies

### Frontend Frameworks
- **Bootstrap 5.3.0**: Responsive design system and UI components
- **Unsplash API**: Product photography and brand imagery
- **FontAwesome**: Icons for WhatsApp, sharing, and UI elements

### Browser APIs
- **Fetch API**: Product data loading and JSON file management
- **Local Storage**: Admin settings and configuration persistence
- **File API**: Image upload and preview functionality
- **URL API**: Product routing and parameter handling

### Third-Party Integrations
- **WhatsApp Business API**: Direct customer communication and order processing
- **Image CDN**: Optimized product image delivery via Unsplash
- **Static Hosting**: Designed for deployment on Replit or similar static hosting platforms

### Development Infrastructure
- **Static File Serving**: Python HTTP server for development
- **JSON Configuration**: Product catalog managed through structured JSON
- **Modular JavaScript**: Separated concerns across multiple JS files for maintainability