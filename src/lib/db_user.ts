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
export type UserStatus = "inactive" | "active" | "warned" | "banned" | "pending_setup";
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
    tempPassword?: string;
    setupRequired?: boolean;
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
    nickname?: string;
    leaderboardEnabled?: boolean;
    role: "user" | "admin";
    status?: "inactive" | "active" | "warned" | "banned" | "pending_setup";
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
            nickname: "",
            leaderboardEnabled: false,
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

// New function for admin user creation
export async function createUserByAdmin(data: User, password: string) {
    try {
        // Generate a unique ID for the user
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const userData: User = {
            ...data,
            id: userId,
            status: "pending_setup", // New status for users created by admin
            nickname: "",
            leaderboardEnabled: false,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                sessions: [],
                tempPassword: password, // Store temporary password
                setupRequired: true
            },
            quizResults: []
        };

        // Create the user document in Firestore
        await setDoc(doc(db, "users", userId), userData);

        // Note: The user will need to set up their own Firebase Auth account
        // They can do this by going to the registration page and using their email
        // The system will recognize their email and link it to the existing document

        return userData;
    } catch (error) {
        console.error("Error creating user by admin:", error);
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
            // Check if there's an existing user document with this email (created by admin)
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", user.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                // User document exists but with different ID (created by admin)
                const existingUserDoc = querySnapshot.docs[0];
                const existingUserData = existingUserDoc.data() as User;
                
                // Update the existing document with the Firebase Auth UID
                await setDoc(doc(db, "users", user.uid), {
                    ...existingUserData,
                    id: user.uid,
                    status: "inactive", // Change from pending_setup to inactive
                    metadata: {
                        ...existingUserData.metadata,
                        updatedAt: new Date().toISOString(),
                        setupRequired: false,
                        tempPassword: undefined // Remove temp password
                    }
                });
                
                // Delete the old document
                await deleteDoc(existingUserDoc.ref);
            } else {
                // Create new user document
                const userData: User = {
                    id: user.uid,
                    displayName: user.displayName || "",
                    email: user.email || "",
                    role: "user",
                    status: "inactive",
                    nickname: "",
                    leaderboardEnabled: false,
                    metadata: {
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    quizResults: []
                };
                await setDoc(doc(db, "users", user.uid), userData);
            }
        }

        userDoc = await getDoc(userRef);
        let userData = userDoc.data() as User;
        
        // Ensure userData has all required fields for existing users
        if (!userData.nickname) userData.nickname = "";
        if (userData.leaderboardEnabled === undefined) userData.leaderboardEnabled = false;
        if (!userData.metadata) userData.metadata = { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        if (!userData.metadata.sessions) userData.metadata.sessions = [];
        // Don't set currentSession to undefined - it can be null/undefined naturally

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

        // Ensure metadata structure exists
        if (!userData.metadata) {
            userData.metadata = {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                sessions: []
            };
        }
        if (!userData.metadata.sessions) {
            userData.metadata.sessions = [];
        }

        const updateData: any = {
            status: "active",
            "metadata.lastLoginAt": new Date().toISOString(),
            "metadata.updatedAt": new Date().toISOString(),
        };

        // For users with "user" role, implement single session management
        let sessionTerminated = false;
        if (userData.role === "user") {
            // If there's an existing current session, end it and add to sessions history
            if (userData.metadata?.currentSession && userData.metadata.currentSession !== null) {
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

        console.log("About to update user document with:", updateData);
        
        // Use setDoc with merge to ensure all fields are properly set
        await setDoc(userRef, updateData, { merge: true });
        console.log("User document updated successfully");

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
        
        // Log error with user details for debugging
        const currentUser = auth.currentUser;
        if (currentUser) {
            console.error("Error occurred for user:", {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                error: error
            });
        }
        
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
            if (userData.role === "user" && userData.metadata?.currentSession && userData.metadata.currentSession !== null) {
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

            await setDoc(userRef, updateData, { merge: true });
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
            
            await setDoc(userRef, {
                status: "inactive",
                "metadata.currentSession": null,
                "metadata.sessions": [
                    ...(userData.metadata.sessions || []),
                    endedSession
                ],
                "metadata.updatedAt": new Date().toISOString()
            }, { merge: true });
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

// Function to migrate existing user data to include new fields
async function migrateUserData(userData: any): Promise<any> {
    const migratedData: any = { ...userData };
    
    // Add missing fields with default values
    if (!migratedData.nickname) {
        migratedData.nickname = "";
    }
    
    if (migratedData.leaderboardEnabled === undefined) {
        migratedData.leaderboardEnabled = false;
    }
    
    // Ensure metadata structure exists
    if (!migratedData.metadata) {
        migratedData.metadata = {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    
    // Ensure sessions array exists
    if (!migratedData.metadata.sessions) {
        migratedData.metadata.sessions = [];
    }
    
    // Ensure currentSession field exists (but keep it null for existing users)
    if (migratedData.metadata.currentSession === undefined) {
        migratedData.metadata.currentSession = null;
    }
    
    return migratedData;
}

// One-time migration function to update all existing users
export async function migrateAllUsers(): Promise<void> {
    try {
        console.log("Starting migration of all users...");
        
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        let migratedCount = 0;
        let errorCount = 0;
        
        // Process users in batches to avoid memory issues
        const batchSize = 10;
        const allDocs = usersSnapshot.docs;
        
        for (let i = 0; i < allDocs.length; i += batchSize) {
            const batch = allDocs.slice(i, i + batchSize);
            
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allDocs.length/batchSize)}`);
            
            // Process batch in parallel with Promise.all
            const batchPromises = batch.map(async (userDoc) => {
                try {
                    const userData = userDoc.data();
                    
                                    // Check if user needs migration
                const needsMigration = 
                    !userData.nickname || 
                    userData.leaderboardEnabled === undefined ||
                    !userData.metadata?.sessions;
                    
                    if (needsMigration) {
                        const updateData: any = {};
                        
                        if (!userData.nickname) updateData.nickname = "";
                        if (userData.leaderboardEnabled === undefined) updateData.leaderboardEnabled = false;
                        if (!userData.metadata?.sessions) updateData["metadata.sessions"] = [];
                        
                        updateData["metadata.updatedAt"] = new Date().toISOString();
                        
                        await setDoc(doc(db, "users", userDoc.id), updateData, { merge: true });
                        migratedCount++;
                        console.log(`Migrated user: ${userData.email || userDoc.id}`);
                    }
                } catch (error) {
                    console.error(`Error migrating user ${userDoc.id}:`, error);
                    errorCount++;
                }
            });
            
            // Wait for batch to complete before processing next batch
            await Promise.all(batchPromises);
            
            // Small delay between batches to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`Migration complete. Migrated: ${migratedCount}, Errors: ${errorCount}`);
    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
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