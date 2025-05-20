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
    sessions?: Array<{
        loginAt: string;
        ip?: string;
        location?: Location;
        device?: Device;
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

        const sessionData = {
            loginAt: new Date().toISOString(),
            ip,
            location,
            device: deviceInfo
        };

        const updateData: any = {
            status: "active",
            "metadata.lastLoginAt": new Date().toISOString(),
            "metadata.sessions": [...(userData.metadata.sessions || []), sessionData],
            "metadata.updatedAt": new Date().toISOString(),
        };

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
        await updateDoc(userRef, {
            status: "inactive",
            "metadata.updatedAt": new Date().toISOString()
        });
    }

    return signOut(auth);
}

export async function resetPasswordMail(email: string) {
    return sendPasswordResetEmail(auth, email);
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