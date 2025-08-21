export type Announcement = {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    createdBy: string;
    isActive: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    expiresAt?: string;
}

export type UserAnnouncement = {
    userId: string;
    announcementId: string;
    readAt?: string;
    dismissedAt?: string;
    createdAt: string;
}
