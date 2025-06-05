# API Reference Documentation

## Overview
This document outlines the main API functions and utilities available in the AzoozGAT Platform.

## User Management API

### Authentication Functions
Located in: `src/lib/db_user.ts`

#### `registerUser(data: User, password: string): Promise<User>`
Creates a new user account and sends password reset email.

**Parameters:**
- `data`: User object with required fields
- `password`: User's password

**Returns:** Promise resolving to created User object

**Example:**
```typescript
const newUser = await registerUser({
  displayName: "John Doe",
  email: "john@example.com",
  // ... other fields
}, "password123");
```

#### `loginUser(email: string, password: string): Promise<LoginResult>`
Authenticates user and tracks session.

**Parameters:**
- `email`: User's email address
- `password`: User's password

**Returns:** Promise resolving to LoginResult object

**Example:**
```typescript
const result = await loginUser("user@example.com", "password");
console.log(result.statusMessage); // 'success', 'warned', 'banned', etc.
```

#### `logoutUser(): Promise<void>`
Signs out current user and updates status.

#### `getCurrentUser(): Promise<User | null>`
Returns currently authenticated user data.

#### `getUserById(userId: string): Promise<User | null>`
Retrieves user data by ID.

### User Management Functions

#### `grantQuizAccess(userId: string, quizId: string, expiresAt?: Date): Promise<boolean>`
Grants user access to a specific quiz.

#### `saveQuizResult(userId: string, quizResult: QuizResult): Promise<boolean>`
Saves quiz attempt result to user's record.

#### `deleteUser(userId: string): Promise<boolean>`
Deletes user account and data.

## Quiz Management API

### Quiz Functions
Located in: `src/lib/db_quiz.ts`

#### `createQuiz(quiz: Quiz): Promise<string>`
Creates a new quiz.

#### `updateQuiz(quizId: string, updates: Partial<Quiz>): Promise<void>`
Updates existing quiz.

#### `deleteQuiz(quizId: string): Promise<void>`
Deletes quiz and associated data.

#### `getQuizById(quizId: string): Promise<Quiz | null>`
Retrieves quiz by ID.

#### `getAllQuizzes(): Promise<Quiz[]>`
Retrieves all quizzes.

## Reports API

### Report Functions
Located in: `src/lib/utils/db_reports.ts`

#### `createReport(report: QuizReport): Promise<DocumentReference>`
Creates a new quiz report.

**Parameters:**
- `report`: QuizReport object with attempt data

**Returns:** Promise resolving to Firestore document reference

#### `getReportsByUser(userId: string): Promise<QuizReport[]>`
Retrieves all reports for a specific user.

#### `getReportsByQuiz(quizId: string): Promise<QuizReport[]>`
Retrieves all reports for a specific quiz.

#### `getReportById(reportId: string): Promise<QuizReport | null>`
Retrieves specific report by ID.

## Logging API

### Log Functions
Located in: `src/lib/db_logs.ts`

#### `recordLog(log: Log): Promise<void>`
Records system activity log.

**Parameters:**
- `log`: Log object with action details

**Example:**
```typescript
await recordLog({
  id: uuid(),
  userId: user.uid,
  action: "CREATE_QUIZ",
  details: JSON.stringify({ quizId, title }),
  timestamp: new Date().toISOString()
});
```

## Utility Functions

### Device Information
Located in: `src/lib/utils/getDeviceInfo.ts`

#### `getDeviceInfo(): Device`
Returns current device information including browser, OS, and type.

### IP and Location
Located in: `src/lib/utils/getIpLocation.ts`

#### `getIpAndLocation(): Promise<{ip: string, location: Location}>`
Fetches user's IP address and geographic location.

### Password Generation
Located in: `src/lib/utils/pass_gen.ts`

#### `generatePassword(length?: number): string`
Generates secure random password.

### Responsive Utilities
Located in: `src/lib/utils/responsive.ts`

#### `getBreakpoint(): string`
Returns current responsive breakpoint.

## Custom Hooks

### Media Query Hook
Located in: `src/components/hooks/useMediaQuery.ts`

#### `useMediaQuery(query: string): boolean`
React hook for responsive design.

**Example:**
```typescript
const isDesktop = useMediaQuery("(min-width: 768px)");
```

### Breakpoint Hook
Located in: `src/hooks/use-breakpoint.ts`

#### `useBreakpoint(): string`
Returns current breakpoint name.

### Mobile Hook
Located in: `src/hooks/use-mobile.ts`

#### `useMobile(): boolean`
Returns true if current device is mobile.

## Error Handling

All API functions throw errors that should be handled appropriately:

```typescript
try {
  const result = await loginUser(email, password);
  // Handle success
} catch (error) {
  console.error("Login failed:", error);
  // Handle error
}
```

## Type Definitions

All TypeScript interfaces and types are defined in their respective files:
- User types: `src/lib/db_user.ts`
- Quiz types: `src/data/quiz.ts`
- Report types: `src/lib/utils/db_reports.ts`

## Firebase Configuration
Firebase configuration is located in: `src/lib/config/firebase-config.ts`

Make sure to set up your environment variables as described in the main README.
