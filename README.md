# Phantom Bidders - Frontend Documentation

## Overview
Phantom Bidders is a sophisticated online auction platform that provides a seamless experience for both buyers and sellers. The frontend is built using vanilla JavaScript, HTML5, and CSS3, featuring real-time updates and interactive animations.

## Directory Structure
```
├── html/           # HTML templates for different pages
├── script/         # JavaScript functionality
├── css/           # Styling and animations
└── public/        # Static assets
```

## Core Components

### 1. Authentication System (`auth.js`, `login_signup.html`)
- Handles user registration and login
- JWT-based authentication
- Secure session management
- Custom animations for login/signup flows

### 2. Seller Features
#### Listing Management (`create_listing.html`, `create_listing.js`)
- Create and manage auction listings
- Image upload and preview
- Dynamic form validation
- Real-time price updates

#### Sales Dashboard (`sales_dashboard.html`, `sales_dashboard.js`)
- Overview of active listings
- Sales analytics
- Bid monitoring
- Auction management tools

#### Seller Settings (`seller_settings.html`, `settings.js`)
- Profile management
- Notification preferences
- Payment settings
- Account security

### 3. Buyer Features
#### Auction Browsing (`browse_auctions.html`, `browse_auctions.js`)
- Grid and list view options
- Advanced filtering
- Search functionality
- Real-time price updates

#### Bidding System (`place_bid.html`, `place_bid.js`)
- Real-time bid placement
- Automatic bid validation
- Outbid notifications
- Bid history tracking

#### Product Details (`product_detail.html`, `product_detail.js`)
- Detailed item information
- Image galleries
- Bid history
- Seller information

### 4. Real-time Features (`realtime-updates.js`)
- WebSocket integration
- Live bid updates
- Real-time notifications
- Auction countdown timers

### 5. Common Components
- Navigation system
- Error handling
- Loading states
- Toast notifications
- Modal dialogs

## Styling Architecture
The CSS is organized into multiple files for better maintainability:
- `common.css`: Shared styles and variables
- `styles.css`: Global styles
- Feature-specific CSS files (e.g., `create_listing.css`, `place_bid.css`)
- Animation files (e.g., `login_animation.css`, `listing_animation.css`)

## JavaScript Architecture
- Modular design pattern
- API abstraction layer (`api.js`)
- Event-driven architecture
- Local storage management
- Form validation utilities

## Key Features
1. Responsive Design
   - Mobile-first approach
   - Fluid layouts
   - Breakpoint-specific optimizations

2. Performance Optimization
   - Lazy loading of images
   - Debounced search
   - Optimized animations
   - Efficient DOM manipulation

3. User Experience
   - Intuitive navigation
   - Smooth animations
   - Clear feedback mechanisms
   - Error handling with user-friendly messages

4. Security Features
   - CSRF protection
   - XSS prevention
   - Input sanitization
   - Secure authentication flow

## Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies
- No external JavaScript frameworks
- Custom-built components
- Minimal third-party libraries

## Best Practices
1. Code Organization
   - Modular file structure
   - Clear naming conventions
   - Consistent coding style
   - Comprehensive comments

2. Performance
   - Minified production assets
   - Optimized asset loading
   - Efficient event handling
   - Browser caching utilization

3. Accessibility
   - ARIA labels
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast compliance

## Development Guidelines
1. File Naming
   - Use lowercase with hyphens
   - Descriptive and consistent naming
   - Clear file extensions

2. JavaScript
   - ES6+ features
   - Async/await for promises
   - Event delegation
   - Error boundary implementation

3. CSS
   - BEM methodology
   - Mobile-first approach
   - CSS custom properties
   - Modular architecture

4. HTML
   - Semantic markup
   - Valid HTML5
   - Proper meta tags
   - Structured data when applicable