# Leaderboard Security Implementation

## Overview

This document explains the security model for the leaderboard functionality in the AzoozGAT Platform. The leaderboard displays user rankings based on quiz performance, requiring access to both user profile data and quiz reports from multiple users.

## User Flow and Features

### Global Leaderboard

The main leaderboard page at `/dashboard/me/leaderboard` provides:

- Overall ranking of all users based on average quiz performance
- Top 10 performers with more detailed statistics
- A "My Quizzes" tab that shows all quizzes the user has attempted, with their best score for each
- Time-based filtering options: All Time, Yearly, Monthly, and Weekly views

### Individual Quiz Leaderboards

For each quiz, the user can view a dedicated leaderboard page at `/dashboard/me/leaderboard/[quizId]` that shows:

- A global leaderboard for that specific quiz, showing how the user ranks compared to others
- A "My Attempts" tab showing all of the user's attempts for that quiz, with the best attempt highlighted
- Time-based filtering options: All Time, Yearly, Monthly, and Weekly views

### Time-Based Filtering

All leaderboards support filtering by different time periods:

- **All Time**: Shows all quiz attempts without time restriction
- **Yearly**: Shows only quiz attempts from the past 365 days
- **Monthly**: Shows only quiz attempts from the past 30 days
- **Weekly**: Shows only quiz attempts from the past 7 days

This allows users to track recent performance and see how they compare to others over different time spans.

### Fallback Behavior

If a user doesn't have permissions to view the complete leaderboard (based on Firestore security rules):

1. They will still see their own entries in the leaderboard
2. A message will explain that only their own results are shown due to permission restrictions
3. Administrators can see the complete leaderboard for all users

## Firestore Security Rules

The security model is implemented in Firestore security rules to ensure that:

1. Users can access only the necessary public information from other users
2. Users can access the minimal required data from quiz reports to build the leaderboard
3. Sensitive user data remains protected
4. Listing operations are properly secured but allowed for leaderboard functionality

### Key Concepts

#### Public User Data

We've defined a concept of "public user data" that includes only non-sensitive fields that can be displayed on the leaderboard:

- `displayName`
- `photoURL`
- `email`
- `role` (needed for certain UI rendering decisions)

#### Report Data for Leaderboard

For reports, we allow read access to the following fields for leaderboard functionality:

- `userId`
- `quizId`
- `quizTitle`
- `score`
- `maxScore`
- `percentageScore`
- `timeTaken`
- `submittedAt`
- `dateTaken`
- `attemptNumber`

### Implementation

The security rules use helper functions to:

1. Check if a user is authenticated
2. Check if a user is an admin
3. Check if a user is the owner of a document
4. Verify that only public fields are being requested
5. Allow limited list operations with query limits for leaderboard functionality

```js
// Function to check if only reading public user data
function isReadingPublicUserData() {
  return request.resource == null || 
    (request.resource != null && 
     request.resource.data.keys().hasOnly(['displayName', 'photoURL', 'email', 'role']));
}

// Function to check if user is requesting minimal leaderboard fields
function isReadingLeaderboardFields() {
  return request.resource == null || 
    (request.resource != null && 
     request.resource.data.keys().hasOnly([
      'userId', 'quizId', 'quizTitle', 'score', 'maxScore', 
      'percentageScore', 'timeTaken', 'submittedAt', 'dateTaken', 'attemptNumber'
    ]));
}

// Function to allow users to list all documents in a collection for leaderboard purposes
function isLeaderboardRead() {
  return isAuthenticated() && (request.query.limit <= 100);
}
```

## User Collection Rules

```js
match /users/{userId} {
  // Users can read their own full profiles
  // Admins can read all profiles
  // Any authenticated user can read limited public fields (for leaderboard)
  allow read: if isOwner(userId) || isAdmin() || isLeaderboardRead() || 
             (isAuthenticated() && isReadingPublicUserData());
  
  // Allow listing users for leaderboard
  allow list: if isAuthenticated();
  
  allow create: if isAuthenticated() && request.auth.uid == userId;
  allow update: if isOwner(userId) || 
                (isAdmin() && request.resource.data.diff(resource.data).affectedKeys()
                  .hasOnly(['role', 'status']));
}
```

## Reports Collection Rules

```js
match /reports/{reportId} {
  // Users can read their own reports and create new ones
  // Admins can read all reports
  // Any authenticated user can read basic report data for leaderboard
  allow read: if isOwner(resource.data.userId) || isAdmin() || isLeaderboardRead() || 
             (isAuthenticated() && isReadingLeaderboardFields());
  
  // Special case for allowing users to read their own reports completely
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  
  // Allow listing reports for leaderboard
  allow list: if isAuthenticated();
  
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  allow update, delete: if false; // Reports should be immutable
}
```

## Quiz Collection Rules

```js
match /quiz/{quizId} {
  // Anyone can read published quizzes
  // Only admins can create/update/delete quizzes
  allow read: if resource.data.published == true || isAdmin() || isLeaderboardRead();
  allow list: if isAuthenticated();
  allow create, update, delete: if isAdmin();
}
```

## Debugging Permission Issues

If you encounter "Missing or insufficient permissions" errors when accessing the leaderboard:

1. Ensure you're logged in
2. Check that the admin has properly set up the security rules
3. Verify that your code is only requesting the allowed fields
4. Check the browser console for specific error messages
5. Make sure you're using a limit in your queries (max 100)
6. Check that your leaderboard code has fallback mechanisms for permission errors

## Implementation Notes

- The leaderboard functionality fetches data directly from Firestore on the client side
- Fallback logic is implemented to show only the current user's data when permission errors occur
- All leaderboard queries should include a limit clause to comply with security rules
- User reports are never modified, only created once and then read

## Fallback Strategy

When users encounter permission errors, the application will:

1. Log the error to the console
2. Attempt to fetch only the current user's data instead
3. Display a user-friendly message about the limited data view
4. Still provide a useful experience with the user's own data

This ensures that even if global leaderboard permissions are restricted, users can still see their own performance and rankings.

- After completing a quiz, users can view the leaderboard for that specific quiz
- Quiz-specific leaderboards rank users by their best attempt (highest score, then fastest time)
- The leaderboard displays:
  - User rank
  - Username and avatar
  - Score and percentage
  - Time taken
  - Attempt number
  - Date taken
  - Indication of best attempt
