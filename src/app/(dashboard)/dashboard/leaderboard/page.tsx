import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClientLeaderboard } from '@/components/ClientLeaderboard';

export default async function AdminLeaderboardPage() {
    // For server-side rendering, we can't access Firebase Auth
    // The client component will handle data fetching with proper authentication
    return (
        <ClientLeaderboard 
            initialLeaderboard={[]}
            initialStats={{
                totalUsers: 0,
                totalQuizzes: 0,
                averageScore: 0,
                topScore: 0
            }}
            isAdmin={true}
        />
    );
}
