# MomFood - لقمه يمه
## Cloud Kitchen Platform

**MomFood** is a comprehensive cloud kitchen platform designed specifically for the Saudi market, competing with services like HungerStation. The platform enables restaurant entrepreneurs to launch and scale their businesses while providing customers with exceptional food delivery experiences.

###  Features

#### Customer Experience
- **Bilingual Interface**: Full Arabic and English support with proper RTL design
- **Restaurant Discovery**: Browse featured restaurants and filter by cuisine type
- **Menu Browsing**: Interactive menu viewing with detailed item descriptions
- **Smart Cart**: Add/remove items with quantity management
- **Real-time Search**: Search restaurants and dishes instantly
- **Order Tracking**: Track your order from preparation to delivery

#### Kitchen Owner Dashboard
- **Order Management**: Real-time order notifications and status updates
- **Menu Management**: Add and edit menu items with Arabic/English descriptions
- **Analytics**: Performance metrics and revenue tracking
- **Status Control**: Update order status through preparation workflow
- **Customer Communication**: View customer notes and special requests

#### Driver Interface
- **Earnings Tracking**: Detailed breakdown of delivery fees, tips, and bonuses
- **Order Acceptance**: View and accept available delivery orders
- **Navigation Integration**: Built-in navigation assistance
- **Progress Tracking**: Real-time delivery progress monitoring
- **Performance Metrics**: Ratings, completion rates, and distance tracking

###  Design Philosophy

The design embodies warmth, trust, and efficiency - feeling like ordering from a caring mother's kitchen while maintaining professional reliability. Modern Arabic design patterns with clean, intuitive interfaces optimized for mobile devices.

#### Color Palette
- **Primary (Terracotta)**: `oklch(0.65 0.15 35)` - Warmth and tradition
- **Secondary (Deep Green)**: `oklch(0.45 0.12 145)` - Freshness and health
- **Background (Cream)**: `oklch(0.95 0.02 85)` - Comfort and cleanliness
- **Accent (Golden Orange)**: `oklch(0.75 0.18 55)` - Energy and appetite stimulation

#### Typography
- **Arabic Text**: Noto Sans Arabic for beautiful Arabic rendering
- **English Text**: Inter for clean, modern Latin characters
- **RTL Support**: Proper right-to-left text direction for Arabic content

###  Technology Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom theme
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Phosphor Icons for consistent iconography
- **State Management**: GitHub Spark KV hooks for persistent state
- **Build Tool**: Vite for fast development and building
- **Package Manager**: npm

###  Mobile-First Design

- **Responsive Layout**: Optimized for mobile, tablet, and desktop
- **Bottom Navigation**: Mobile-friendly navigation on small screens
- **Touch Targets**: Generous spacing for mobile interactions
- **Swipe Gestures**: Intuitive gesture controls for order management
- **One-handed Operation**: Optimized ordering flow for single-hand use

###  Development Setup

#### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser

#### Installation
```bash
# Clone the repository
git clone https://github.com/Fadil369/momfood-cloud-kitche.git
cd momfood-cloud-kitche

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run optimize` - Optimize dependencies

###  Mock Data

The application includes comprehensive mock data for development and testing:

- **Restaurants**: 4 sample restaurants with different cuisines
- **Menu Items**: Detailed items with Arabic/English descriptions
- **Orders**: Sample orders in various states
- **Drivers**: Mock driver profiles with statistics
- **Customers**: Sample customer data with addresses

###  Configuration

#### Theme Customization
Edit `theme.json` to customize colors, spacing, and other design tokens:

```json
{
  "extend": {
    "colors": {
      "primary": {
        "DEFAULT": "oklch(0.65 0.15 35)",
        "foreground": "oklch(1 0 0)"
      }
    }
  }
}
```

#### Tailwind Configuration
The `tailwind.config.js` file includes custom configurations for:
- Arabic font family support
- RTL-friendly spacing and layout
- Custom color schemes
- Mobile-optimized breakpoints

###  Internationalization

The app supports both Arabic and English:

- **Arabic**: Primary language with RTL support
- **English**: Secondary language for broader accessibility
- **Mixed Content**: Seamless switching between languages
- **Cultural Adaptation**: Saudi-specific design patterns

###  Performance Features

- **Lazy Loading**: Components loaded on demand
- **Optimized Images**: Efficient image loading and caching
- **Minimal Bundle**: Code splitting for faster load times
- **Responsive Images**: Optimized for different screen sizes

###  Testing

#### Running Tests
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: User interaction and workflow testing
- **E2E Tests**: End-to-end user journey validation

###  Deployment

#### Production Build
```bash
# Create optimized build
npm run build

# The build files will be in the `dist` directory
```

#### Deployment Options
- **Vercel**: Recommended for easy deployment
- **Netlify**: Alternative with great performance
- **Azure Static Web Apps**: Enterprise-grade hosting
- **GitHub Pages**: Free hosting for public repositories

###  Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

#### Code Style
- Use TypeScript for type safety
- Follow ESLint rules for consistent code style
- Use Prettier for code formatting
- Add JSDoc comments for complex functions
- Use semantic commit messages

###  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

###  Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

###  Roadmap

#### Phase 1 (Current)
-  Basic platform functionality
-  Arabic language support
-  Mobile-responsive design
-  Mock data integration

#### Phase 2 (Next)
- [ ] Real backend integration
- [ ] Payment processing
- [ ] Push notifications
- [ ] Advanced analytics

#### Phase 3 (Future)
- [ ] AI-powered recommendations
- [ ] Advanced driver routing
- [ ] Multi-tenant support
- [ ] Advanced reporting

###  Acknowledgments

- **Design Inspiration**: Traditional Saudi hospitality and modern UX principles
- **Cultural Guidance**: Saudi market research and user feedback
- **Technical Stack**: Built on modern web technologies and best practices

---

**Made with  for the Saudi food delivery market**

*MomFood - لقمه يمه: Bringing the warmth of home-cooked meals to your doorstep*
