import { db, auth } from "./config/firebase-config";

import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

import type { Quiz } from "@/data/quiz";

export async function getQuizzes() {
    const quizzesRef = collection(db, "quiz");
    let quizzes: Quiz[] = [];
    const querySnapshot = await getDocs(quizzesRef);
    querySnapshot.forEach((doc) => {
        quizzes.push(doc.data() as Quiz);
    });

    return quizzes;
}

export function getQuizById(id: string) {
    const quizzesRef = collection(db, "quiz");
    const q = query(quizzesRef, where("isDeleted", "==", false), where("id", "==", id));
    console.log(q);
    return getDocs(q);
}

export function createQuiz(quiz: Quiz) {
    const quizzesRef = collection(db, "quiz");
    return addDoc(quizzesRef, quiz);
}