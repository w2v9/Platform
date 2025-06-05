# AzoozGAT-Platform

## Overview
AzoozGAT Platform is a comprehensive quiz and learning management system built with Next.js, TypeScript, and Firebase. It provides an interactive quiz experience with admin dashboard, user management, and detailed analytics.

## Features
- **📝 Quiz Management:** Create, edit, and manage quizzes with multiple-choice questions
- **👥 User Management:** Complete user authentication and role-based access control
- **📊 Dashboard & Analytics:** Admin dashboard with user statistics and quiz analytics
- **📱 Responsive Design:** Optimized for desktop, tablet, and mobile devices
- **⚡ Real-time Features:** Live quiz sessions with timer and auto-submit
- **🔒 Security:** Firebase authentication with role-based permissions
- **📈 Reporting:** Detailed quiz reports and user progress tracking
- **🎨 Modern UI:** Built with shadcn/ui components and Tailwind CSS
- **♿ Accessibility:** Keyboard navigation and screen reader support

## Tech Stack
- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui components
- **Backend:** Firebase (Firestore, Authentication)
- **State Management:** React Context API
- **Form Handling:** React Hook Form
- **Animation:** CSS animations and transitions
- **Deployment:** Vercel (recommended)

## Prerequisites
- Node.js 18.0 or later
- npm or yarn package manager
- Firebase project with Firestore and Authentication enabled

## Installation
1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   ```
2. **Navigate to the project directory:**
   ```sh
   cd azoozgat-platform
   ```
3. **Install dependencies:**
   ```sh
   npm install
   ```

4. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
   NEXT_PUBLIC_ADMIN_PASSWORD=admin_password
   ```

## Running the App
Start the development server:
```sh
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## Building for Production
1. **Build the project:**
   ```sh
   npm run build
   ```
2. **Start the production server:**
   ```sh
   npm start
   ```

## Project Structure
- **src/app:** Main application components and pages.
- **public:** Static assets such as images and icons.
- **.next:** Build output and cache.

## Documentation
- See the `/documentations` folder for detailed documentation:
  - [Project Structure](./documentations/project-structure.md)
  - [Quiz Module](./documentations/quiz-module.md)
  - [Authentication System](./documentations/authentication.md)
  - [Database Schema](./documentations/database-schema.md)
  - [API Reference](./documentations/api-reference.md)
  - [Deployment Guide](./documentations/deployment.md)

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support and questions, please open an issue in the GitHub repository or contact the development team.

---
For more details on specific modules or contributing, refer to the documentation files in `/documentations`.
