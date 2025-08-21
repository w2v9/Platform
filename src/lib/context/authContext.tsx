'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { getUserById } from '../db_user';
import { toast } from 'sonner';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    markSessionChecked: () => void;
    handleError: (error: any, context?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionChecked, setSessionChecked] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            
            if (user) {
                // Don't check session immediately - let login process complete
                setSessionChecked(false);
            } else {
                setSessionChecked(false);
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Periodic session check for logged-in users
    useEffect(() => {
        if (!user || !sessionChecked) return;

        const checkSession = async () => {
            try {
                const userData = await getUserById(user.uid);
                
                // If user has "user" role and no current session, log them out
                if (userData && userData.role === "user" && (!userData.metadata?.currentSession || userData.metadata.currentSession === null)) {
                    console.log("User session terminated during periodic check, logging out...");
                    await auth.signOut();
                }
            } catch (error) {
                console.error("Error during periodic session check:", error);
                // Use the error handler for session check errors
                handleError(error, "Periodic Session Check");
            }
        };

        // Check every 30 seconds
        const interval = setInterval(checkSession, 30000);

        return () => clearInterval(interval);
    }, [user, sessionChecked]);

    const markSessionChecked = () => {
        setSessionChecked(true);
    };

    const handleError = async (error: any, context: string = "Unknown") => {
        try {
            // Get current user details for logging
            const currentUser = auth.currentUser;
            let userDetails = {
                uid: currentUser?.uid || "Unknown",
                email: currentUser?.email || "Unknown",
                displayName: currentUser?.displayName || "Unknown"
            };

            // Try to get additional user details from Firestore
            if (currentUser?.uid) {
                try {
                    const userData = await getUserById(currentUser.uid);
                    if (userData) {
                        userDetails = {
                            uid: userData.id || currentUser.uid,
                            email: userData.email || currentUser.email || "Unknown",
                            displayName: userData.displayName || currentUser.displayName || "Unknown"
                        };
                    }
                } catch (firestoreError) {
                    console.error("Error getting user details from Firestore:", firestoreError);
                }
            }

            // Log the error with user details
            console.error("Application Error:", {
                context: context,
                user: userDetails,
                error: {
                    message: error.message || "Unknown error",
                    code: error.code || "NO_CODE",
                    stack: error.stack || "No stack trace"
                },
                timestamp: new Date().toISOString()
            });

            // Show user-friendly error message
            toast.error("An error has occurred. You will be logged out for security reasons.");

            // Wait a moment for the toast to be visible
            setTimeout(async () => {
                try {
                    // Sign out the user
                    await auth.signOut();
                    console.log("User logged out due to error:", userDetails);
                } catch (logoutError) {
                    console.error("Error during logout:", logoutError);
                }
            }, 2000);

        } catch (handlerError) {
            console.error("Error in error handler:", handlerError);
            // Fallback: just sign out
            try {
                await auth.signOut();
            } catch (fallbackError) {
                console.error("Fallback logout failed:", fallbackError);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, markSessionChecked, handleError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
