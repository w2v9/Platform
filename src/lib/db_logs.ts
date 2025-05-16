export type Log = {
    id: string;
    userId: string;
    action: string;
    timestamp: string;
    details: string;
};


import { db } from "@/lib/config/firebase-config";
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore";



export async function recordLog(log: Log) {
    try {
        const docRef = await addDoc(collection(db, "logs"), log);
    } catch (e) {
        console.error("Error adding log: ", e);
    }
}
export async function getLogById(logId: string): Promise<Log | null> {
    try {
        const docRef = doc(db, "logs", logId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Log;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (e) {
        console.error("Error getting log: ", e);
        return null;
    }
}
export async function getAllLogs(): Promise<Log[]> {
    try {
        const logsRef = collection(db, "logs");
        const querySnapshot = await getDocs(logsRef);
        const logs: Log[] = [];
        querySnapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as Log);
        });
        return logs;
    } catch (e) {
        console.error("Error getting logs: ", e);
        return [];
    }
}

export async function getLogsByUserId(userId: string): Promise<Log[]> {
    try {
        const logsRef = collection(db, "logs");
        const q = query(logsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const logs: Log[] = [];
        querySnapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as Log);
        });
        return logs;
    } catch (e) {
        console.error("Error getting logs: ", e);
        return [];
    }
}