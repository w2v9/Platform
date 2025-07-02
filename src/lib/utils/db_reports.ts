import type { Quiz, Question, Option } from "@/data/quiz";
import { db, auth } from "../config/firebase-config";
import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    where,
    getDoc
} from "firebase/firestore";
import { getUserById } from "../db_user";

export type QuizReports = QuizReport[];

export type SelectedOption = {
    questionId: string;
    optionSetId: string;
    selectedOptionId: string[];
};

export interface QuizReport {
    id: string;
    quizId: string;
    quizTitle: string;
    answeredQuestions: Question[];
    selectedOptions: SelectedOption[];
    timeTaken: number;
    userId: string;
    userName: string;
    score?: number;
    maxScore?: number;
    percentageScore?: number;
    dateTaken?: string;
    attemptNumber?: number; // Added for tracking attempts count
}

async function isUserAdmin(): Promise<boolean> {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const userData = await getUserById(currentUser.uid);
    return userData?.role === "admin";
}

export async function getAllReports(): Promise<QuizReports> {
    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            console.warn("Only admins can access all reports");
            return [];
        }

        const reportsRef = collection(db, "reports");
        const querySnapshot = await getDocs(reportsRef);
        const reports: QuizReports = [];

        querySnapshot.forEach((doc) => {
            reports.push({
                ...doc.data(),
                id: doc.id
            } as QuizReport);
        });

        return reports;
    } catch (error) {
        console.error("Error fetching quiz reports:", error);
        return [];
    }
}

export async function getReportById(id: string): Promise<QuizReport | null> {
    try {
        const reportDocRef = doc(db, "reports", id);
        const reportDoc = await getDoc(reportDocRef);

        if (!reportDoc.exists()) {
            return null;
        }

        const reportData = reportDoc.data() as QuizReport;
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.warn("User not authenticated");
            return null;
        }

        const isAdmin = await isUserAdmin();

        if (isAdmin || reportData.userId === currentUser.uid) {
            return {
                ...reportData,
                id: reportDoc.id
            } as QuizReport;
        } else {
            console.warn("User not authorized to access this report");
            return null;
        }
    } catch (error) {
        console.error("Error fetching quiz report:", error);
        return null;
    }
}

export async function getReportsByUserId(userId: string): Promise<QuizReports> {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.warn("User not authenticated");
            return [];
        }

        const isAdmin = await isUserAdmin();

        if (!isAdmin && userId !== currentUser.uid) {
            console.warn("User not authorized to access these reports");
            return [];
        }

        const reportsRef = collection(db, "reports");
        const q = query(reportsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const reports: QuizReports = [];

        querySnapshot.forEach((doc) => {
            reports.push({
                ...doc.data(),
                id: doc.id
            } as QuizReport);
        });

        return reports;
    } catch (error) {
        console.error("Error fetching quiz reports by user ID:", error);
        return [];
    }
}

export async function getReportsByQuizId(quizId: string): Promise<QuizReports> {
    try {
        const isAdmin = await isUserAdmin();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.warn("User not authenticated");
            return [];
        }

        const reportsRef = collection(db, "reports");
        let q;

        if (isAdmin) {
            q = query(reportsRef, where("quizId", "==", quizId));
        } else {
            q = query(
                reportsRef,
                where("quizId", "==", quizId),
                where("userId", "==", currentUser.uid)
            );
        }

        const querySnapshot = await getDocs(q);
        const reports: QuizReports = [];

        querySnapshot.forEach((doc) => {
            reports.push({
                ...doc.data(),
                id: doc.id
            } as QuizReport);
        });

        return reports;
    } catch (error) {
        console.error("Error fetching quiz reports by quiz ID:", error);
        return [];
    }
}

export async function createReport(report: Omit<QuizReport, 'id'>): Promise<QuizReport> {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            throw new Error("User not authenticated");
        }

        if (report.userId !== currentUser.uid) {
            throw new Error("Cannot create reports for other users");
        }

        // Get previous attempts for this quiz by this user to determine attempt number
        const reportsRef = collection(db, "reports");
        const q = query(
            reportsRef,
            where("quizId", "==", report.quizId),
            where("userId", "==", report.userId)
        );
        const existingReports = await getDocs(q);
        const attemptNumber = existingReports.size + 1;

        const reportData = {
            ...report,
            dateTaken: report.dateTaken || new Date().toISOString(),
            attemptNumber: attemptNumber
        };

        const docRef = await addDoc(reportsRef, reportData);

        return {
            ...reportData,
            id: docRef.id
        } as QuizReport;
    } catch (error) {
        console.error("Error creating quiz report:", error);
        throw error;
    }
}