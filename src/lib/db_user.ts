import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    addDoc
} from "firebase/firestore";
import { db, auth } from "./config/firebase-config";
import { getDeviceInfo } from "./utils/getDeviceInfo";
import { getIpAndLocation } from "./utils/getIpLocation";
import { deleteUser as firebaseDeleteUser } from "firebase/auth";

// Utility function to generate unique session ID
function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export type UserRole = "user" | "admin";
export type UserStatus = "inactive" | "active" | "warned" | "banned";
export type UserStatusColor = {
    [key in UserStatus]: string;
};
export type Location = {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
};
export type Device = {
    type?: string;
    browser?: string;
    os?: string;
    userAgent?: string;
}

export type Metadata = {
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    currentSession?: {
        loginAt: string;
        ip?: string;
        location?: Location;
        device?: Device;
        sessionId: string;
    };
    sessions?: Array<{
        loginAt: string;
        ip?: string;
        location?: Location;
        device?: Device;
        sessionId: string;
        endedAt?: string;
    }>;
};

export type QuizReport = Array<{
    quizId: string;
    attemptId: string;
    score: number;
    maxScore: number;
    percentageScore: number;
    dateTaken: string;
    completionTime: number;
    answers: Array<{
        questionId: string;
        selectedOptionIds: string[];
        isCorrect: boolean;
        timeTaken: number;
    }>;
}>;

export type User = {
    uid?: string;
    id: string;
    displayName: string;
    photoURL?: string;
    phone?: string;
    email: string;
    username?: string;
    role: "user" | "admin";
    status?: "inactive" | "active" | "warned" | "banned";
    metadata: Metadata
    quizResults: QuizReport;
};


export async function registerUser(data: User, password: string) {
    try {

        const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
        await sendPasswordResetEmail(auth, data.email);

        const user = userCredential.user;

        const { displayName, email } = data;

        await updateProfile(user, {
            displayName: data.displayName,
        });

        const userData: User = {
            ...data,
            id: user.uid,
            displayName,
            email,
            role: "user",
            status: "inactive",
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            quizResults: []
        };

        await setDoc(doc(db, "users", user.uid), userData);

        auth.signOut();

        loginUser(process.env.NEXT_PUBLIC_ADMIN_EMAIL || '', process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '');

        return userData;
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
}

export async function loginUser(email: string, password: string) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userRef = doc(db, "users", user.uid);
        let userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            const userData: User = {
                id: user.uid,
                displayName: user.displayName || "",
                email: user.email || "",
                role: "user",
                status: "inactive",
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                quizResults: []
            };
            await setDoc(doc(db, "users", user.uid), userData);
        }

        userDoc = await getDoc(userRef);
        const userData = userDoc.data() as User;

        if (userData.status === "banned") {
            return {
                user: null,
                statusMessage: "banned",
                message: "Your account has been banned. Please contact support."
            };
        }

        const deviceInfo: Device = getDeviceInfo();
        const { ip, location } = await getIpAndLocation();
        const sessionId = generateSessionId();

        const sessionData = {
            loginAt: new Date().toISOString(),
            ip,
            location,
            device: deviceInfo,
            sessionId
        };

        const updateData: any = {
            status: "active",
            "metadata.lastLoginAt": new Date().toISOString(),
            "metadata.updatedAt": new Date().toISOString(),
        };

        // For users with "user" role, implement single session management
        let sessionTerminated = false;
        if (userData.role === "user") {
            // If there's an existing current session, end it and add to sessions history
            if (userData.metadata.currentSession) {
                const endedSession = {
                    ...userData.metadata.currentSession,
                    endedAt: new Date().toISOString()
                };
                
                updateData["metadata.sessions"] = [
                    ...(userData.metadata.sessions || []),
                    endedSession
                ];
                sessionTerminated = true;
            }
            
            // Set the new current session
            updateData["metadata.currentSession"] = sessionData;
        } else {
            // For admins, allow multiple sessions (just add to sessions array)
            updateData["metadata.sessions"] = [
                ...(userData.metadata.sessions || []),
                sessionData
            ];
        }

        await updateDoc(userRef, updateData);

        const updatedUserData = await getUserById(user.uid);

        if (userData.status === "warned") {
            return {
                user: updatedUserData,
                statusMessage: "warned",
                message: "Your account has been warned. Please follow our guidelines to avoid account suspension."
            };
        }

        if (userData.status === "inactive") {
            return {
                user: updatedUserData,
                statusMessage: "activated",
                message: "Activating your account. Your location, device, and network details will be recorded."
            };
        }

        // Add session termination message for user role
        if (userData.role === "user" && sessionTerminated) {
            return {
                user: updatedUserData,
                statusMessage: "session_terminated",
                message: "Your previous session has been terminated. You can now only be logged in from one device at a time."
            };
        }

        return {
            user: updatedUserData,
            statusMessage: "success",
            message: "Login successful"
        };

    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
}

export async function logoutUser() {
    const user = auth.currentUser;
    if (user) {
        const userRef = doc(db, "users", user.uid);
        
        // Get current user data to check role and current session
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            
            const updateData: any = {
                status: "inactive",
                "metadata.updatedAt": new Date().toISOString()
            };

            // For users with "user" role, end the current session
            if (userData.role === "user" && userData.metadata.currentSession) {
                const endedSession = {
                    ...userData.metadata.currentSession,
                    endedAt: new Date().toISOString()
                };
                
                updateData["metadata.sessions"] = [
                    ...(userData.metadata.sessions || []),
                    endedSession
                ];
                updateData["metadata.currentSession"] = null;
            }

            await updateDoc(userRef, updateData);
        }
    }

    return signOut(auth);
}

export async function resetPasswordMail(email: string) {
    return sendPasswordResetEmail(auth, email);
}

// Function to check if user has an active session (for user role only)
export async function checkActiveSession(userId: string): Promise<boolean> {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) return false;
        
        const userData = userDoc.data() as User;
        
        // Only check for user role (admins can have multiple sessions)
        if (userData.role !== "user") return false;
        
        return userData.metadata.currentSession !== undefined && 
               userData.metadata.currentSession !== null;
    } catch (error) {
        console.error("Error checking active session:", error);
        return false;
    }
}

// Function to force logout all sessions for a user (admin function)
export async function forceLogoutUser(userId: string): Promise<void> {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) return;
        
        const userData = userDoc.data() as User;
        
        if (userData.role === "user" && userData.metadata.currentSession) {
            const endedSession = {
                ...userData.metadata.currentSession,
                endedAt: new Date().toISOString()
            };
            
            await updateDoc(userRef, {
                status: "inactive",
                "metadata.currentSession": null,
                "metadata.sessions": [
                    ...(userData.metadata.sessions || []),
                    endedSession
                ],
                "metadata.updatedAt": new Date().toISOString()
            });
        }
    } catch (error) {
        console.error("Error forcing logout:", error);
        throw error;
    }
}

export async function getUserById(userId: string): Promise<User | null> {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as User;
        }
        return null;
    } catch (error) {
        console.error("Error getting user:", error);
        throw error;
    }
}

export async function getCurrentUser(): Promise<User | null> {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                try {
                    const userData = await getUserById(user.uid);
                    resolve(userData);
                } catch (error) {
                    reject(error);
                }
            } else {
                resolve(null);
            }
        }, reject);
    });
}


export async function grantQuizAccess(userId: string, quizId: string, expiresAt?: Date) {
    try {
        const userRef = doc(db, "users", userId);

        const accessData = {
            [`quizAccess.${quizId}`]: {
                grantedAt: new Date().toISOString(),
                ...(expiresAt && { expiresAt: expiresAt.toISOString() })
            }
        };

        await updateDoc(userRef, accessData);
        return true;
    } catch (error) {
        console.error("Error granting quiz access:", error);
        throw error;
    }
}

export async function saveQuizResult(userId: string, quizResult: User['quizResults'][0]) {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error("User not found");
        }

        const userData = userDoc.data() as User;
        const updatedResults = [...userData.quizResults, quizResult];

        await updateDoc(userRef, {
            quizResults: updatedResults,
            "metadata.updatedAt": new Date().toISOString()
        });

        return true;
    } catch (error) {
        console.error("Error saving quiz result:", error);
        throw error;
    }
}

export async function deleteUser(userId: string) {
    try {
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);
        return true;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
}