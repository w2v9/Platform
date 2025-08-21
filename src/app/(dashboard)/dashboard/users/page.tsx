import React from 'react';
import { ClientUsers } from '@/components/ClientUsers';

export default async function UsersPage() {
    // For server-side rendering, we can't access Firebase Auth
    // The client component will handle data fetching with proper authentication
    return (
        <ClientUsers 
            initialUsers={[]}
        />
    );
}