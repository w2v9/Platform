'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Announcement } from '@/data/announcement';
import { createAnnouncement, getAllAnnouncements, updateAnnouncement, deleteAnnouncement } from '@/lib/db_announcement';
import { useAuth } from '@/lib/context/authContext';

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [isActive, setIsActive] = useState(true);
    const [expiresAt, setExpiresAt] = useState('');

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await getAllAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setIsActive(true);
        setExpiresAt('');
        setEditingAnnouncement(null);
    };

    const handleCreate = async () => {
        if (!title.trim() || !description.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const announcementData = {
                title: title.trim(),
                description: description.trim(),
                priority,
                isActive,
                createdBy: user?.uid || 'unknown',
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            };

            await createAnnouncement(announcementData);
            toast.success('Announcement created successfully');
            setIsCreateDialogOpen(false);
            resetForm();
            fetchAnnouncements();
        } catch (error) {
            console.error('Error creating announcement:', error);
            toast.error('Failed to create announcement');
        }
    };

    const handleEdit = async () => {
        if (!editingAnnouncement || !title.trim() || !description.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const updates = {
                title: title.trim(),
                description: description.trim(),
                priority,
                isActive,
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            };

            await updateAnnouncement(editingAnnouncement.id, updates);
            toast.success('Announcement updated successfully');
            setIsEditDialogOpen(false);
            resetForm();
            fetchAnnouncements();
        } catch (error) {
            console.error('Error updating announcement:', error);
            toast.error('Failed to update announcement');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        try {
            await deleteAnnouncement(id);
            toast.success('Announcement deleted successfully');
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast.error('Failed to delete announcement');
        }
    };

    const openEditDialog = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setTitle(announcement.title);
        setDescription(announcement.description);
        setPriority(announcement.priority);
        setIsActive(announcement.isActive);
        setExpiresAt(announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : '');
        setIsEditDialogOpen(true);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return <AlertTriangle className="h-4 w-4" />;
            case 'high': return <AlertTriangle className="h-4 w-4" />;
            case 'medium': return <Info className="h-4 w-4" />;
            case 'low': return <CheckCircle className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Announcements</h1>
                    <p className="text-muted-foreground">Manage system-wide announcements for all users</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => resetForm()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Announcement</DialogTitle>
                            <DialogDescription>
                                Create a new announcement that will be shown to all users.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter announcement title"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter announcement description"
                                    rows={4}
                                />
                            </div>
                            <div>
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                            <div>
                                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                                <Input
                                    id="expiresAt"
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate}>
                                    Create Announcement
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading announcements...</p>
                    </div>
                </div>
            ) : announcements.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <Info className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
                        <p className="text-muted-foreground text-center">
                            No announcements have been created yet. Create your first announcement to get started.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {announcements.map((announcement) => (
                        <Card key={announcement.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CardTitle className="text-lg">{announcement.title}</CardTitle>
                                            <Badge className={getPriorityColor(announcement.priority)}>
                                                {getPriorityIcon(announcement.priority)}
                                                <span className="ml-1 capitalize">{announcement.priority}</span>
                                            </Badge>
                                            {announcement.isActive ? (
                                                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <EyeOff className="h-3 w-3 mr-1" />
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>
                                            Created on {formatDate(announcement.createdAt)}
                                            {announcement.expiresAt && (
                                                <span className="ml-4">
                                                    <Calendar className="h-3 w-3 inline mr-1" />
                                                    Expires: {formatDate(announcement.expiresAt)}
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(announcement)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(announcement.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {announcement.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Announcement</DialogTitle>
                        <DialogDescription>
                            Update the announcement details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-title">Title *</Label>
                            <Input
                                id="edit-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter announcement title"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description *</Label>
                            <Textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter announcement description"
                                rows={4}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-priority">Priority</Label>
                            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <Label htmlFor="edit-isActive">Active</Label>
                        </div>
                        <div>
                            <Label htmlFor="edit-expiresAt">Expires At (Optional)</Label>
                            <Input
                                id="edit-expiresAt"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEdit}>
                                Update Announcement
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
