import { db } from './config/firebase-config';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Announcement, UserAnnouncement } from '@/data/announcement';

// Create a new announcement
export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'announcements'), {
            ...announcement,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating announcement:', error);
        throw error;
    }
}

// Get all active announcements
export async function getActiveAnnouncements(): Promise<Announcement[]> {
    try {
        const q = query(
            collection(db, 'announcements'),
            where('isActive', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        const announcements: Announcement[] = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            announcements.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                createdBy: data.createdBy,
                isActive: data.isActive,
                priority: data.priority,
                expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
            });
        });
        
        // Sort in memory instead of using orderBy in query
        announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return announcements;
    } catch (error) {
        console.error('Error getting active announcements:', error);
        throw error;
    }
}

// Get all announcements (for admin)
export async function getAllAnnouncements(): Promise<Announcement[]> {
    try {
        const querySnapshot = await getDocs(collection(db, 'announcements'));
        const announcements: Announcement[] = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            announcements.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                createdBy: data.createdBy,
                isActive: data.isActive,
                priority: data.priority,
                expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
            });
        });
        
        // Sort in memory instead of using orderBy in query
        announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return announcements;
    } catch (error) {
        console.error('Error getting all announcements:', error);
        throw error;
    }
}

// Update announcement
export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
    try {
        const docRef = doc(db, 'announcements', id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        throw error;
    }
}

// Delete announcement
export async function deleteAnnouncement(id: string): Promise<void> {
    try {
        const docRef = doc(db, 'announcements', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting announcement:', error);
        throw error;
    }
}

// Mark announcement as read for a user
export async function markAnnouncementAsRead(userId: string, announcementId: string): Promise<void> {
    try {
        await addDoc(collection(db, 'userAnnouncements'), {
            userId,
            announcementId,
            readAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error marking announcement as read:', error);
        throw error;
    }
}

// Dismiss announcement for a user
export async function dismissAnnouncement(userId: string, announcementId: string): Promise<void> {
    try {
        await addDoc(collection(db, 'userAnnouncements'), {
            userId,
            announcementId,
            dismissedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error dismissing announcement:', error);
        throw error;
    }
}

// Get unread announcements for a user
export async function getUnreadAnnouncements(userId: string): Promise<Announcement[]> {
    try {
        console.log('Getting unread announcements for user:', userId);
        
        // Get all active announcements
        const activeAnnouncements = await getActiveAnnouncements();
        console.log('Active announcements:', activeAnnouncements);
        
        // Get user's read/dismissed announcements
        const querySnapshot = await getDocs(collection(db, 'userAnnouncements'));
        const userAnnouncements = new Set<string>();
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('User announcement data:', data);
            if (data.userId === userId && (data.readAt || data.dismissedAt)) {
                userAnnouncements.add(data.announcementId);
            }
        });
        
        console.log('User announcements to filter out:', Array.from(userAnnouncements));
        
        // Filter out read/dismissed announcements
        const unreadAnnouncements = activeAnnouncements.filter(announcement => 
            !userAnnouncements.has(announcement.id)
        );
        
        console.log('Final unread announcements:', unreadAnnouncements);
        return unreadAnnouncements;
    } catch (error) {
        console.error('Error getting unread announcements:', error);
        throw error;
    }
}
