import { db } from "./config/firebase-config";
import { addDoc, collection, doc, getDocs, query, updateDoc, where, getDoc, deleteDoc } from "firebase/firestore";
import type { Quiz } from "@/data/quiz";

const COLLECTION_NAME = "quiz";

export async function getQuizzes() {
    const quizzesRef = collection(db, COLLECTION_NAME);
    const quizzes: Quiz[] = [];
    const querySnapshot = await getDocs(quizzesRef);
    querySnapshot.forEach((doc) => {
        quizzes.push(doc.data() as Quiz);
    });

    return quizzes;
}

export async function getQuizById(id: string): Promise<Quiz | null> {
    const quizzesRef = collection(db, COLLECTION_NAME);
    let quiz: Quiz | null = null;
    const q = query(quizzesRef, where("id", "==", id));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        quiz = doc.data() as Quiz;
    });
    return quiz;
}

export function createQuiz(quiz: Quiz) {
    const quizzesRef = collection(db, COLLECTION_NAME);
    return addDoc(quizzesRef, quiz);
}

export function deleteQuiz(id: string) {
    const quizzesRef = collection(db, COLLECTION_NAME);

    const q = query(quizzesRef, where("id", "==", id));
    return getDocs(q).then((querySnapshot) => {
        if (querySnapshot.empty) {
            throw new Error(`Quiz with ID ${id} not found in collection ${COLLECTION_NAME}`);
        }
        const firestoreDocId = querySnapshot.docs[0].id;
        const quizDocRef = doc(db, COLLECTION_NAME, firestoreDocId);
        return deleteDoc(quizDocRef);
    });
}


export async function updateQuiz(quiz: Quiz): Promise<void> {
    try {
        const quizzesRef = collection(db, COLLECTION_NAME);
        const q = query(quizzesRef, where("id", "==", quiz.id));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error(`Quiz with ID ${quiz.id} not found in collection ${COLLECTION_NAME}`);
        }

        const firestoreDocId = querySnapshot.docs[0].id;

        const quizDocRef = doc(db, COLLECTION_NAME, firestoreDocId);

        await updateDoc(quizDocRef, {
            ...quiz,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error updating quiz:", error);
        throw error;
    }
}