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

interface AuthContextType {
    user: User | null;
    loading: boolean;
    markSessionChecked: () => void;
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
            }
        };

        // Check every 30 seconds
        const interval = setInterval(checkSession, 30000);

        return () => clearInterval(interval);
    }, [user, sessionChecked]);

    const markSessionChecked = () => {
        setSessionChecked(true);
    };

    return (
        <AuthContext.Provider value={{ user, loading, markSessionChecked }}>
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
