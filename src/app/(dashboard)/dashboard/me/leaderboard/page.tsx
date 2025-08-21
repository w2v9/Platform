import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClientUserLeaderboard } from '@/components/ClientUserLeaderboard';

export default async function LeaderboardPage() {
    // For server-side rendering, we can't access Firebase Auth
    // The client component will handle data fetching with proper authentication
    return (
        <ClientUserLeaderboard 
            initialLeaderboard={[]}
            initialStats={{
                totalUsers: 0,
                totalQuizzes: 0,
                averageScore: 0,
                topScore: 0
            }}
        />
    );
}
