# Project Structure

This document describes the folder and file structure of the AzoozGAT Platform project.

## Root Directory
- `README.md`: Main project overview and quick start
- `package.json`: Project dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `next.config.ts`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `components.json`: shadcn/ui components configuration
- `public/`: Static assets (images, icons, etc)
- `src/`: Main source code
- `documentations/`: Project documentation files

## `src/` Directory Structure

### `app/` - Next.js App Router
- `layout.tsx`: Root layout component
- `globals.css`: Global styles and Tailwind CSS
- `loading.tsx`: Global loading component
- `not-found.tsx`: 404 error page
- `forbidden.tsx`: 403 error page
- `*.css`: Animation and responsive styles

#### Route Groups
- `(default)/`: Public pages (home, login)
- `(dashboard)/`: Protected dashboard pages
- `(quiz)/`: Quiz-taking interface

#### Dashboard Routes
- `dashboard/`: Main dashboard
- `dashboard/admin/`: Admin overview
- `dashboard/users/`: User management
- `dashboard/quizzes/`: Quiz management
- `dashboard/results/`: Results and analytics
- `dashboard/logs/`: System logs
- `dashboard/me/`: User's personal pages

### `components/` - React Components
- `Quiz.tsx`: Main quiz interface component
- `navbar.tsx`: Navigation bar
- `footer.tsx`: Footer component
- `app-sidebar.tsx`: Dashboard sidebar
- `ActionCard.tsx`: Reusable action card component
- `Link.tsx`: Custom link component

#### `components/ui/` - UI Primitives
Based on shadcn/ui components:
- `button.tsx`: Button component
- `dialog.tsx`: Modal dialogs
- `form.tsx`: Form components
- `input.tsx`: Input fields
- `table.tsx`: Data tables
- `card.tsx`: Card containers
- And many more...

#### `components/hooks/` - Component-specific Hooks
- `useMediaQuery.ts`: Media query hook for responsive design

### `data/` - Static Data
- `quiz.ts`: Quiz type definitions and sample data

### `hooks/` - Custom React Hooks
- `use-breakpoint.ts`: Breakpoint detection hook
- `use-mobile.ts`: Mobile device detection hook

### `lib/` - Utilities and Configuration

#### Core Database Operations
- `db_user.ts`: User management functions
- `db_quiz.ts`: Quiz CRUD operations
- `db_logs.ts`: System logging functions

#### `lib/config/`
- `firebase-config.ts`: Firebase initialization

#### `lib/context/`
- `authContext.tsx`: Authentication context provider

#### `lib/utils/`
- `db_reports.ts`: Quiz report operations
- `getDeviceInfo.ts`: Device information detection
- `getIpLocation.ts`: IP and location services
- `pass_gen.ts`: Password generation utility
- `responsive.ts`: Responsive design utilities

## File Naming Conventions
- **Components**: PascalCase (e.g., `Quiz.tsx`, `ActionCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMediaQuery.ts`)
- **Utilities**: camelCase (e.g., `getDeviceInfo.ts`)
- **Pages**: lowercase with hyphens (e.g., `not-found.tsx`)
- **Types/Interfaces**: PascalCase (defined within files)

## Key Features by Location

### Authentication (`lib/db_user.ts`, `lib/context/authContext.tsx`)
- User registration and login
- Session management
- Role-based access control

### Quiz System (`components/Quiz.tsx`, `data/quiz.ts`)
- Interactive quiz interface
- Multiple choice questions
- Timer functionality
- Review mode

### Dashboard (`app/(dashboard)/`)
- User management
- Quiz creation and editing
- Analytics and reporting
- System logs

### Responsive Design
- `components/hooks/useMediaQuery.ts`
- `lib/utils/responsive.ts`
- `hooks/use-mobile.ts`
- CSS files in `app/`

## Development Guidelines

### Adding New Features
1. Create components in appropriate folders
2. Use TypeScript for type safety
3. Follow existing naming conventions
4. Add proper error handling
5. Update documentation

### State Management
- Use React Context for global state
- Local state with useState/useReducer
- Server state with Firebase real-time listeners

### Styling
- Tailwind CSS for styling
- shadcn/ui for UI components
- CSS modules for complex animations
- Responsive design with mobile-first approach

## Dependencies Overview

### Core Dependencies
- `next`: React framework
- `react`: UI library
- `typescript`: Type safety
- `firebase`: Backend services
- `tailwindcss`: Utility-first CSS

### UI Dependencies
- `@radix-ui/*`: Headless UI primitives
- `lucide-react`: Icon library
- `react-markdown`: Markdown rendering
- `sonner`: Toast notifications

### Development Dependencies
- `eslint`: Code linting
- `prettier`: Code formatting
- Various type definitions

---
For more details on specific modules, see other documentation files in this folder.

---

# Adding New Features
- Add new UI components to `components/ui/`.
- Add new pages to the appropriate `app/` subfolder.
- Add new utility functions to `lib/utils/`.

---

# Useful Scripts
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm start`: Start production server.

---

For more details, see other documentation files in this folder.
