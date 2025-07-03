# Sunrise Construction - Official Website

A modern, high-performance Next.js website for Sunrise Construction, providing elite-tier construction services for homeowners nationwide, based in the Outer Banks of North Carolina.

## 🚀 Features

- **Modern Next.js 14** with React 18
- **TypeScript Support** for better development experience
- **Comprehensive Testing** with Jest and React Testing Library
- **SEO Optimized** with structured data and meta tags
- **Performance Optimized** with image optimization and code splitting
- **Accessibility Compliant** with ARIA labels and semantic HTML
- **Error Boundaries** for graceful error handling
- **Custom Hooks** for reusable logic
- **Responsive Design** with mobile-first approach
- **Progressive Web App** features

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: JavaScript/TypeScript
- **Styling**: SCSS/CSS
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint with custom rules
- **Formatting**: Prettier
- **Package Manager**: npm
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sunriseobx/sunriseobx.co.git
   cd sunriseobx.co
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run type-check      # Run TypeScript type checking

# Analysis
npm run analyze         # Analyze bundle size
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── sections/       # Page sections
│   ├── sliders/        # Slider components
│   ├── ErrorBoundary.jsx
│   └── PageBanner.jsx
├── common/             # Shared utilities and hooks
│   ├── hooks/          # Custom React hooks
│   ├── scrollAnims.js
│   ├── utilits.js
│   └── title.js
├── data/               # Static data and content
│   ├── posts/          # Blog posts (Markdown)
│   ├── projects/       # Project data (Markdown)
│   ├── sections/       # Section configurations
│   └── app.json        # App configuration
├── layouts/            # Layout components
│   ├── headers/
│   ├── footers/
│   └── Layouts.js
├── lib/                # Library functions
│   ├── posts.js        # Blog post utilities
│   ├── projects.js     # Project utilities
│   └── date.js         # Date utilities
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   ├── blog/           # Blog pages
│   ├── projects/       # Project pages
│   ├── services/       # Service pages
│   ├── _app.js         # App component
│   ├── _document.js    # Document component
│   └── index.jsx       # Homepage
├── styles/             # Styling
│   ├── scss/           # SCSS files
│   └── globals.css     # Global styles
└── __tests__/          # Test files
    ├── components/
    └── common/
```

## 🎨 Styling

The project uses SCSS for styling with a modular approach:

- `style.scss` - Main stylesheet entry point
- `_variables.scss` - SCSS variables and mixins
- `_basic.scss` - Base styles
- `_color.scss` - Color scheme
- `_responsive.scss` - Responsive breakpoints
- `_custom.scss` - Custom component styles

## 🔍 SEO & Performance

### SEO Features
- **Structured Data**: JSON-LD for business information
- **Meta Tags**: Comprehensive meta tag management
- **Sitemap**: Automatic sitemap generation
- **Breadcrumbs**: Structured breadcrumb navigation
- **Open Graph**: Social media optimization

### Performance Features
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Code Splitting**: Automatic code splitting
- **Bundle Analysis**: Bundle size analysis tools
- **Compression**: Gzip compression enabled
- **Caching**: Optimized caching strategies

## 🧩 Custom Hooks

### `useScrollAnimation`
Handles scroll-based animations with Intersection Observer.

```javascript
import { useScrollAnimation } from '@common/hooks/useScrollAnimation';

const MyComponent = () => {
  const { ref } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  });

  return <div ref={ref}>Animated content</div>;
};
```

### `useFormValidation`
Provides form validation logic with error handling.

```javascript
import { useFormValidation } from '@common/hooks/useFormValidation';

const ContactForm = () => {
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
  } = useFormValidation(initialValues, validationRules);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## 🛡️ Error Handling

The application includes comprehensive error handling:

- **Error Boundaries**: Catch and handle React errors gracefully
- **404 Pages**: Custom 404 error pages
- **API Error Handling**: Proper error responses for API routes
- **Form Validation**: Client-side and server-side validation

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## 📊 Analytics & Monitoring

The site is configured for:
- **Google Analytics** (configure in environment variables)
- **Performance Monitoring** with Core Web Vitals
- **Error Tracking** (integrate with your preferred service)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow ESLint configuration
- Write tests for new features
- Use TypeScript for type safety
- Follow accessibility guidelines
- Optimize for performance

## 📝 License

This project is licensed under the UNLICENSED License - see the package.json file for details.

## 📞 Contact

**Sunrise Construction Services LLC**
- **Website**: [https://sunriseobx.co](https://sunriseobx.co)
- **Phone**: (252) 619-7966
- **Email**: hello@sunriseobx.co
- **Address**: 5149-5177 N Croatan Hwy, Kitty Hawk, NC 27949

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Bootstrap](https://getbootstrap.com/)
- Icons by [Font Awesome](https://fontawesome.com/)
- Hosted on [Vercel](https://vercel.com/)

---

**Elite-tier construction services for homeowners nationwide, based in the Outer Banks.**
