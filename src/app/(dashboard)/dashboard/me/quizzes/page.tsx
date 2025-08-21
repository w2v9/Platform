import React from 'react';
import { getQuizzes } from '@/lib/db_quiz';
import { ClientUserQuizzes } from '@/components/ClientUserQuizzes';

export default async function UserQuizzesPage() {
    try {
        // Fetch data on the server
        const quizzes = await getQuizzes();
        
        return (
            <ClientUserQuizzes 
                initialQuizzes={quizzes}
            />
        );
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Error Loading Quizzes</h1>
                    <p className="text-muted-foreground">
                        Failed to load quizzes. Please try refreshing the page.
                    </p>
                </div>
            </div>
        );
    }
}