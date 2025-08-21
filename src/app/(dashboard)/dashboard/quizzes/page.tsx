import React from 'react';
import { getQuizzes } from '@/lib/db_quiz';
import { ClientQuizzes } from '@/components/ClientQuizzes';

export default async function QuizzesPage() {
    try {
        // Fetch data on the server
        const quizzes = await getQuizzes();
        
        return (
            <ClientQuizzes 
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