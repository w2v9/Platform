import React from 'react';
import { getAllUsers } from '@/lib/db_user';
import { ClientUsers } from '@/components/ClientUsers';

export default async function UsersPage() {
    try {
        // Fetch data on the server
        const users = await getAllUsers();
        
        return (
            <ClientUsers 
                initialUsers={users}
            />
        );
    } catch (error) {
        console.error('Error fetching users:', error);
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Error Loading Users</h1>
                    <p className="text-muted-foreground">
                        Failed to load users. Please try refreshing the page.
                    </p>
                </div>
            </div>
        );
    }
}