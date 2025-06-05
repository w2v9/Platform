# Authentication System Documentation

## Overview
The AzoozGAT Platform uses Firebase Authentication for user management with custom user roles and permissions.

## Authentication Flow
1. **User Registration:** New users are created with "inactive" status
2. **Email Verification:** Password reset email is sent immediately after registration
3. **Login:** Users authenticate and their status is updated to "active"
4. **Session Management:** User sessions are tracked with device and location info

## User Roles
- **user:** Regular users who can take quizzes
- **admin:** Administrative users with full platform access

## User Status
- **inactive:** Newly registered or logged out users
- **active:** Currently logged in users
- **warned:** Users with warnings (can still access but see warning message)
- **banned:** Users who cannot access the platform

## Key Functions

### `registerUser(data: User, password: string)`
Creates a new user account and sends password reset email.

### `loginUser(email: string, password: string)`
Authenticates user and tracks session information including:
- Login timestamp
- IP address and location
- Device information (browser, OS, etc.)

### `logoutUser()`
Signs out user and updates status to "inactive".

### `getCurrentUser()`
Returns the currently authenticated user data.

## Session Tracking
Every login session is recorded with:
- **Timestamp:** When the login occurred
- **IP Address:** User's IP address
- **Location:** Country, region, city (if available)
- **Device Info:** Browser, OS, user agent

## Security Features
- Password reset emails on registration
- Role-based access control
- Session tracking for security auditing
- Device fingerprinting
- Geographic location tracking

## Usage Example
```typescript
import { loginUser, getCurrentUser } from '@/lib/db_user';

// Login
const result = await loginUser('user@example.com', 'password');
if (result.statusMessage === 'success') {
  console.log('Login successful');
}

// Get current user
const user = await getCurrentUser();
```

## Error Handling
All authentication functions throw errors that should be caught and handled appropriately. Common error scenarios:
- Invalid credentials
- Network errors
- Firebase service errors
- Banned user attempts

## File Location
Main authentication logic: `src/lib/db_user.ts`
Auth context: `src/lib/context/authContext.tsx`
