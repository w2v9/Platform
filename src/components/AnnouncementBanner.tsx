'use client';
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { Announcement } from '@/data/announcement';
import { getUnreadAnnouncements, markAnnouncementAsRead, dismissAnnouncement } from '@/lib/db_announcement';
import { useAuth } from '@/lib/context/authContext';
import { toast } from 'sonner';

interface AnnouncementBannerProps {
    className?: string;
}

export default function AnnouncementBanner({ className = '' }: AnnouncementBannerProps) {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (user?.uid) {
            checkUserRoleAndFetchAnnouncements();
        }
    }, [user?.uid]);

    const checkUserRoleAndFetchAnnouncements = async () => {
        try {
            const { getUserById } = await import('@/lib/db_user');
            const userData = await getUserById(user!.uid);
            setUserRole(userData?.role || null);
            
            // Only fetch announcements for regular users, not admins
            if (userData?.role !== 'admin') {
                await fetchAnnouncements();
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error checking user role:', error);
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            console.log('Fetching announcements for user:', user!.uid);
            const unreadAnnouncements = await getUnreadAnnouncements(user!.uid);
            console.log('Unread announcements:', unreadAnnouncements);
            setAnnouncements(unreadAnnouncements);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (announcementId: string) => {
        try {
            await markAnnouncementAsRead(user!.uid, announcementId);
            setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
            toast.success('Announcement marked as read');
        } catch (error) {
            console.error('Error marking announcement as read:', error);
            toast.error('Failed to mark announcement as read');
        }
    };

    const handleDismiss = async (announcementId: string) => {
        try {
            await dismissAnnouncement(user!.uid, announcementId);
            setDismissedAnnouncements(prev => new Set(prev).add(announcementId));
            setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
            toast.success('Announcement dismissed');
        } catch (error) {
            console.error('Error dismissing announcement:', error);
            toast.error('Failed to dismiss announcement');
        }
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev + 1) % announcements.length);
    };

    const handlePrevious = () => {
        setCurrentIndex(prev => (prev - 1 + announcements.length) % announcements.length);
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
            case 'medium': return <Info className="h-5 w-5 text-blue-600" />;
            case 'low': return <CheckCircle className="h-5 w-5 text-green-600" />;
            default: return <Info className="h-5 w-5 text-blue-600" />;
        }
    };

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'destructive';
            case 'high': return 'default';
            case 'medium': return 'default';
            case 'low': return 'default';
            default: return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return null;
    }

    // Don't show announcements to admin users
    if (userRole === 'admin') {
        return null;
    }

    if (announcements.length === 0) {
        return null;
    }

    const currentAnnouncement = announcements[currentIndex];
    const isDismissed = dismissedAnnouncements.has(currentAnnouncement.id);

    if (isDismissed) {
        return null;
    }

    return (
        <div className={`w-full ${className}`}>
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg border-l-4 border-l-red-500 p-4">
                <div className="flex justify-between items-start">
                    {/* LEFT SIDE - CONTENT */}
                    <div className="flex-1 pr-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                {getPriorityIcon(currentAnnouncement.priority)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        {currentAnnouncement.title}
                                    </h3>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        {formatDate(currentAnnouncement.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {currentAnnouncement.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE - ACTIONS */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {announcements.length > 1 && (
                            <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlePrevious}
                                    className="h-6 w-6 p-0 hover:bg-gray-200"
                                >
                                    ‹
                                </Button>
                                <span className="text-xs font-medium px-1">
                                    {currentIndex + 1}/{announcements.length}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleNext}
                                    className="h-6 w-6 p-0 hover:bg-gray-200"
                                >
                                    ›
                                </Button>
                            </div>
                        )}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(currentAnnouncement.id)}
                            className="h-8 px-3 text-xs font-medium hover:bg-green-50 hover:border-green-300"
                        >
                            Mark Read
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismiss(currentAnnouncement.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
