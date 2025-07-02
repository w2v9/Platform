# Database Schema Documentation

## Overview
The AzoozGAT Platform uses Firebase Firestore as its database. This document outlines the collection structure and data models.

## Collections

### Users Collection (`users`)
Stores user account information and session data.

```typescript
interface User {
  id: string;                    // User UID from Firebase Auth
  displayName: string;           // User's display name (public field)
  email: string;                 // User's email address (public field)
  username?: string;             // Optional username
  phone?: string;                // Optional phone number
  photoURL?: string;             // Profile picture URL (public field)
  role: "user" | "admin";        // User role (public field)
  status: "inactive" | "active" | "warned" | "banned"; // Account status
  metadata: {
    createdAt: string;           // ISO timestamp
    updatedAt: string;           // ISO timestamp
    lastLoginAt?: string;        // ISO timestamp
    sessions?: Session[];        // Login session history
  };
  // Note: quizResults are now stored in the reports collection, not here
}

// Fields marked as (public field) are accessible by all authenticated users for leaderboard functionality
  loginAt: string;               // ISO timestamp
  ip?: string;                   // IP address
  location?: {                   // Geographic location
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  device?: {                     // Device information
    type?: string;               // Desktop, mobile, tablet
    browser?: string;            // Browser name
    os?: string;                 // Operating system
    userAgent?: string;          // Full user agent string
  };
}
```

### Quizzes Collection (`quizzes`)
Stores quiz definitions and metadata.

```typescript
interface Quiz {
  id: string;                    // Unique quiz identifier
  title: string;                 // Quiz title
  description?: string;          // Quiz description
  timeLimit: number;             // Time limit in minutes
  quizType: "review" | "no-review"; // Whether users can review answers
  questions: Question[];         // Array of quiz questions
  metadata: {
    createdAt: string;           // ISO timestamp
    updatedAt: string;           // ISO timestamp
    createdBy: string;           // User ID who created quiz
  };
}

interface Question {
  id: string;                    // Unique question identifier
  question: string;              // Question text
  explanation?: string;          // Markdown explanation
  questionImage?: string;        // Optional image URL
  optionSets: OptionSet[];       // Different option sets for the question
  selectedSetIndex?: number;     // Which option set to use
  activeSetIndex?: number;       // Default active set
}

interface OptionSet {
  id: string;                    // Unique option set identifier
  options: Option[];             // Array of answer options
  answer: string[];              // Correct answer IDs
}

interface Option {
  id: string;                    // Unique option identifier
  option: string;                // Option text
}
```

### Reports Collection (`reports`)
Stores quiz attempt results and analytics.

```typescript
interface QuizReport {
  id: string;                    // Unique report identifier
  quizId: string;                // Reference to quiz (leaderboard field)
  quizTitle: string;             // Quiz title (for easy access)
  userId: string;                // User who took the quiz (leaderboard field)
  userName: string;              // User's name/email
  score: number;                 // Number of correct answers (leaderboard field)
  maxScore: number;              // Total number of questions
  percentageScore: number;       // Percentage score (0-100) (leaderboard field)
  timeTaken: number;             // Time taken in minutes (leaderboard field)
  dateTaken: string;             // ISO timestamp (leaderboard field)
  submittedAt: string;           // ISO timestamp when submitted (leaderboard field)
  answeredQuestions: Question[]; // Questions that were answered
  selectedOptions: {             // User's selected answers
    questionId: string;
    optionSetId: string;
    selectedOptionId: string[];
  }[];
}

// Fields marked as (leaderboard field) are accessible by all authenticated users for leaderboard functionality
```

### Logs Collection (`logs`)
Stores system activity and audit trail.

```typescript
interface Log {
  id: string;                    // Unique log identifier
  userId: string;                // User who performed the action
  action: string;                // Action type (CREATE_REPORT, ERROR, etc.)
  details: string;               // JSON string with additional details
  timestamp: string;             // ISO timestamp
}
```

## Indexes
Recommended Firestore indexes for optimal performance:

### Users Collection
- `email` (ascending)
- `role` (ascending)
- `status` (ascending)
- `metadata.createdAt` (descending)

### Quizzes Collection
- `metadata.createdAt` (descending)
- `metadata.createdBy` (ascending)

### Reports Collection
- `userId` (ascending), `dateTaken` (descending)
- `quizId` (ascending), `dateTaken` (descending)
- `dateTaken` (descending)

### Logs Collection
- `userId` (ascending), `timestamp` (descending)
- `action` (ascending), `timestamp` (descending)
- `timestamp` (descending)

## Security Rules
Firebase security rules should be configured to:
- Allow users to read/write their own data
- Allow admins to read/write all data
- Allow authenticated users to read limited public data for leaderboard functionality
- Prevent unauthorized access to sensitive information
- Validate data structure and types

### Public Data For Leaderboard

For leaderboard functionality, the following data is accessible to all authenticated users:

**From Users Collection:**
- `displayName`
- `photoURL`
- `email`
- `role`

**From Reports Collection:**
- `userId`
- `quizId`
- `score`
- `timeTaken`
- `submittedAt`

This allows the leaderboard to function while protecting sensitive user information.

See the complete implementation in `firestore.rules` and the detailed explanation in `documentations/leaderboard-security.md`.

## File Locations
- User operations: `src/lib/db_user.ts`
- Quiz operations: `src/lib/db_quiz.ts`
- Reports operations: `src/lib/utils/db_reports.ts`
- Leaderboard operations: `src/lib/leaderboard.ts`
- Report operations: `src/lib/utils/db_reports.ts`
- Logging operations: `src/lib/db_logs.ts`
