import type { Quiz, Question, Option } from "@/data/quiz";
import { db } from "../config/firebase-config";
import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    where,
    getDoc
} from "firebase/firestore";

export type QuizReports = QuizReport[];

export type SelectedOption = {
    questionId: string;
    selectedOptionId: string;
};

export interface QuizReport {
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
}

export async function getAllReports(): Promise<QuizReports> {
    try {
        const reportsRef = collection(db, "reports");
        const querySnapshot = await getDocs(reportsRef);
        const reports: QuizReports = [];
        querySnapshot.forEach((doc) => {
            reports.push(doc.data() as QuizReport);
        });
        return reports;
    } catch (error) {
        console.error("Error fetching quiz reports:", error);
        throw error;
    }
}

export async function getReportById(id: string): Promise<QuizReport | null> {
    try {
        const reportRef = doc(db, "reports", id);
        const reportSnapshot = await getDoc(reportRef);
        if (reportSnapshot.exists()) {
            return reportSnapshot.data() as QuizReport;
        } else {
            console.error("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching quiz report:", error);
        throw error;
    }
}
export async function getReportsByUserId(userId: string): Promise<QuizReports> {
    try {
        const reportsRef = collection(db, "reports");
        const q = query(reportsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const reports: QuizReports = [];
        querySnapshot.forEach((doc) => {
            reports.push(doc.data() as QuizReport);
        });
        return reports;
    } catch (error) {
        console.error("Error fetching quiz reports by user ID:", error);
        throw error;
    }
}

export async function getReportsByQuizId(quizId: string): Promise<QuizReports> {
    try {
        const reportsRef = collection(db, "reports");
        const q = query(reportsRef, where("quizId", "==", quizId));
        const querySnapshot = await getDocs(q);
        const reports: QuizReports = [];
        querySnapshot.forEach((doc) => {
            reports.push(doc.data() as QuizReport);
        });
        return reports;
    } catch (error) {
        console.error("Error fetching quiz reports by quiz ID:", error);
        throw error;
    }
}

export async function createReport(report: QuizReport) {
    try {
        const reportsRef = collection(db, "reports");
        return await addDoc(reportsRef, report);
    } catch (error) {
        console.error("Error creating quiz report:", error);
        throw error;
    }
}