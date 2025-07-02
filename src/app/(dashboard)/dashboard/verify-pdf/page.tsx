'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Upload,
    FileText,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Info,
    Clock,
    User,
    Mail,
    Calendar,
    BadgeCheck,
    Phone,
    MapPin,
    Monitor,
    Globe,
    Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserById, User as UserType } from '@/lib/db_user';

interface VerificationResult {
    status: 'verified' | 'likely_verified' | 'not_verified' | 'unknown';
    confidence: number;
    watermarkData: Array<{
        location: string;
        type: string;
        data: any;
    }>;
    matchingDownloads: Array<{
        userId: string;
        userEmail: string;
        userName: string;
        fileName: string;
        downloadTime: string;
        ipAddress: string;
        watermarkData?: any;
    }>;
    metadata: {
        title?: string;
        subject?: string;
        keywords?: string[];
        creator?: string;
    };
}

interface EnhancedUserInfo extends UserType {
    downloadInfo: {
        downloadTime: string;
        ipAddress: string;
        fileName: string;
    };
}

export default function VerifyPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<EnhancedUserInfo[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Please select a PDF file');
                return;
            }
            setFile(selectedFile);
            setResult(null);
            setError(null);
            setUserDetails([]);
        }
    };

    const extractUserIdFromMetadata = (metadata: VerificationResult['metadata']): string | null => {
        if (!metadata?.keywords || !Array.isArray(metadata.keywords)) return null;

        console.log('Extracting userId from keywords:', metadata.keywords);

        // Keywords format: ["userId timestamp"] - both in one string
        for (const keyword of metadata.keywords) {
            const keywordStr = keyword.toString().trim();
            console.log('Processing keyword:', keywordStr);

            // Look for pattern: userId followed by space and timestamp
            const match = keywordStr.match(/^([a-zA-Z0-9]+)\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
            if (match) {
                console.log('Found userId via regex match:', match[1]);
                return match[1]; // Return the userId part
            }

            // Fallback: if keyword contains space, try to extract the first part
            if (keywordStr.includes(' ')) {
                const parts = keywordStr.split(' ');
                const potentialUserId = parts[0].trim();
                console.log('Trying fallback extraction, potential userId:', potentialUserId);
                // Check if it looks like a userId (alphanumeric, reasonable length)
                if (potentialUserId.length > 10 && /^[a-zA-Z0-9]+$/.test(potentialUserId)) {
                    console.log('Found userId via fallback:', potentialUserId);
                    return potentialUserId;
                }
            }
        }

        console.log('No userId found in keywords');
        return null;
    };

    const fetchUserDetails = async (downloads: VerificationResult['matchingDownloads'], metadata?: VerificationResult['metadata']) => {
        console.log('Fetching user details for downloads:', downloads, 'and metadata:', metadata);

        try {
            setLoadingUsers(true);
            let users: EnhancedUserInfo[] = [];

            // First, try to get users from download logs
            if (downloads && downloads.length > 0) {
                const userPromises = downloads.map(async (download) => {
                    try {
                        const userData = await getUserById(download.userId);
                        if (userData) {
                            return {
                                ...userData,
                                downloadInfo: {
                                    downloadTime: download.downloadTime,
                                    ipAddress: download.ipAddress,
                                    fileName: download.fileName
                                }
                            } as EnhancedUserInfo;
                        }
                        return null;
                    } catch (error) {
                        console.error(`Failed to fetch user ${download.userId}:`, error);
                        return null;
                    }
                });

                users = (await Promise.all(userPromises)).filter(Boolean) as EnhancedUserInfo[];
            }


            // If no users from downloads but we have metadata, try to extract userId from keywords
            if (users.length === 0 && metadata) {
                const extractedUserId = extractUserIdFromMetadata(metadata);
                if (extractedUserId) {
                    console.log('Extracted userId from metadata:', extractedUserId);
                    try {
                        const userData = await getUserById(extractedUserId);
                        if (userData) {
                            users.push({
                                ...userData,
                                downloadInfo: {
                                    downloadTime: 'Unknown (no log record)',
                                    ipAddress: 'Unknown (no log record)',
                                    fileName: metadata.title || 'Unknown'
                                }
                            } as EnhancedUserInfo);
                        }
                    } catch (error) {
                        console.error(`Failed to fetch user from metadata ${extractedUserId}:`, error);
                    }
                }
            }

            setUserDetails(users);
        } catch (error) {
            console.error('Error fetching user details:', error);
            toast.error('Failed to fetch user details');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleVerify = async () => {
        if (!file) {
            toast.error('Please select a PDF file first');
            return;
        }

        try {
            setVerifying(true);
            setError(null);

            const formData = new FormData();
            formData.append('pdf', file);

            const response = await fetch('/api/verify-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to verify PDF');
            }

            const data = await response.json();

            if (data.success) {
                setResult(data.verification);
                // Fetch detailed user information
                await fetchUserDetails(data.verification.matchingDownloads, data.verification.metadata);
                toast.success('PDF verification completed');
            } else {
                throw new Error('Verification failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to verify PDF';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setVerifying(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            case 'likely_verified':
                return <Info className="h-5 w-5 text-blue-600" />;
            case 'not_verified':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'likely_verified':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'not_verified':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getUserStatusColor = (status?: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'warned':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'banned':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'inactive':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">PDF Verification Center</h1>
                <p className="text-muted-foreground mt-1">
                    Administrative tool to verify PDF authenticity and track document origins
                </p>
            </div>

            {/* Admin Notice */}
            <Alert>
                <BadgeCheck className="h-4 w-4" />
                <AlertDescription>
                    <strong>Admin Tool:</strong> This verification system allows you to trace any PDF back to its original downloader.
                    Use this tool to investigate unauthorized document sharing or verify document authenticity.
                </AlertDescription>
            </Alert>

            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload PDF for Verification
                    </CardTitle>
                    <CardDescription>
                        Upload a PDF file to check if it contains our security watermarks and track its download history.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="pdf-upload">Select PDF File</Label>
                        <Input
                            id="pdf-upload"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                    </div>

                    {file && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                        </div>
                    )}

                    <Button
                        onClick={handleVerify}
                        disabled={!file || verifying}
                        className="w-full"
                    >
                        {verifying ? (
                            <>
                                <BadgeCheck className="h-4 w-4 mr-2 animate-spin" />
                                Verifying PDF...
                            </>
                        ) : (
                            <>
                                <BadgeCheck className="h-4 w-4 mr-2" />
                                Verify PDF
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Results Section */}
            {result && (
                <div className="space-y-6">
                    {/* Verification Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {getStatusIcon(result.status)}
                                Verification Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                <Badge className={getStatusColor(result.status)}>
                                    {result.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Confidence:</span>
                                <Badge variant="outline">
                                    {result.confidence}%
                                </Badge>
                            </div>

                            {result.status === 'verified' && (
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        This PDF was verified as downloaded from our platform.
                                        Watermark and download records match.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {result.status === 'likely_verified' && (
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        This PDF appears to be from our platform but complete verification data is not available.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {result.status === 'not_verified' && (
                                <Alert variant="destructive">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        This PDF does not appear to be downloaded from our platform or watermarks have been removed.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Enhanced User Details */}
                    {userDetails && userDetails.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    User Details - PDF Downloaded By
                                </CardTitle>
                                <CardDescription>
                                    Comprehensive information about {userDetails.length} user(s) who downloaded this PDF
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {userDetails.map((user, index) => (
                                        <div key={index} className="p-6 border rounded-lg space-y-4 bg-muted/30">
                                            {/* User Header */}
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                                                    <AvatarFallback>
                                                        {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-semibold">{user.displayName}</h3>
                                                        <Badge className={getUserStatusColor(user.status)}>
                                                            {user.status?.toUpperCase() || 'UNKNOWN'}
                                                        </Badge>
                                                        {user.role === 'admin' && (
                                                            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                ADMIN
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>

                                            {/* User Information Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Email:</span>
                                                    <span>{user.email}</span>
                                                </div>

                                                {user.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">Phone:</span>
                                                        <span>{user.phone}</span>
                                                    </div>
                                                )}

                                                {user.username && (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">Username:</span>
                                                        <span>{user.username}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Downloaded:</span>
                                                    <span>{formatDate(user.downloadInfo.downloadTime)}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">File:</span>
                                                    <span>{user.downloadInfo.fileName}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">IP Address:</span>
                                                    <span>{user.downloadInfo.ipAddress}</span>
                                                </div>
                                            </div>

                                            {/* Account Information */}
                                            <Separator />
                                            <div>
                                                <h4 className="text-sm font-medium mb-3">Account Information</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">Account Created:</span>
                                                        <span>{formatDate(user.metadata.createdAt)}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">Last Updated:</span>
                                                        <span>{formatDate(user.metadata.updatedAt)}</span>
                                                    </div>

                                                    {user.metadata.lastLoginAt && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">Last Login:</span>
                                                            <span>{formatDate(user.metadata.lastLoginAt)}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2">
                                                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">User ID:</span>
                                                        <span className="font-mono text-xs">{user.id}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location & Device Info */}
                                            {user.metadata.sessions && user.metadata.sessions.length > 0 && (
                                                <>
                                                    <Separator />
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-3">Recent Session Info</h4>
                                                        {user.metadata.sessions.slice(0, 1).map((session, sessionIndex) => (
                                                            <div key={sessionIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                {session.location && (
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="font-medium">Location:</span>
                                                                        <span>
                                                                            {[session.location.city, session.location.region, session.location.country]
                                                                                .filter(Boolean).join(', ')}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {session.device && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Monitor className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="font-medium">Device:</span>
                                                                        <span>
                                                                            {[session.device.browser, session.device.os, session.device.type]
                                                                                .filter(Boolean).join(' on ')}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {/* Quiz Performance Summary */}
                                            {user.quizResults && user.quizResults.length > 0 && (
                                                <>
                                                    <Separator />
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-3">Quiz Performance</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">Quizzes Taken:</span>
                                                                <span>{user.quizResults.length}</span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">Avg Score:</span>
                                                                <span>
                                                                    {(user.quizResults.reduce((acc, quiz) => acc + quiz.percentageScore, 0) / user.quizResults.length).toFixed(1)}%
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">Last Quiz:</span>
                                                                <span>
                                                                    {formatDate(user.quizResults[user.quizResults.length - 1]?.dateTaken || '')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* No Downloads but User Found from Metadata */}
                    {(!result.matchingDownloads || result.matchingDownloads.length === 0) && userDetails.length > 0 && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>User identified from PDF metadata:</strong> This PDF contains watermark information that allowed us to identify the original downloader, even though no download log was found in our system.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Simple Download History (fallback) */}
                    {result.matchingDownloads && result.matchingDownloads.length > 0 && userDetails.length === 0 && !loadingUsers && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Download History (Basic)
                                </CardTitle>
                                <CardDescription>
                                    Found {result.matchingDownloads.length} matching download record(s) - User details unavailable
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {result.matchingDownloads.map((download, index) => (
                                        <div key={index} className="p-4 border rounded-lg space-y-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">User:</span>
                                                    <span>{download.userName || 'Unknown'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Email:</span>
                                                    <span>{download.userEmail}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Downloaded:</span>
                                                    <span>{formatDate(download.downloadTime)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">File:</span>
                                                    <span>{download.fileName}</span>
                                                </div>
                                            </div>
                                            <Separator />
                                            <div className="text-xs text-muted-foreground">
                                                <span className="font-medium">User ID:</span> {download.userId} •
                                                <span className="font-medium"> IP:</span> {download.ipAddress}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* No User Information Available */}
                    {(!result.matchingDownloads || result.matchingDownloads.length === 0) && userDetails.length === 0 && !loadingUsers && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-500" />
                                    No User Information Available
                                </CardTitle>
                                <CardDescription>
                                    Unable to identify the original downloader
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        This PDF does not contain sufficient watermark information to identify the original downloader.
                                        This could happen if:
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>The PDF was not downloaded from our platform</li>
                                            <li>The watermarks have been removed or corrupted</li>
                                            <li>The download logs have been purged from our system</li>
                                            <li>The PDF predates our watermarking system</li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}

                    {/* Loading State for User Details */}
                    {loadingUsers && (
                        <Card>
                            <CardContent className="flex items-center justify-center py-8">
                                <div className="flex items-center gap-3">
                                    <BadgeCheck className="h-5 w-5 animate-spin text-primary" />
                                    <span>Loading detailed user information...</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* PDF Metadata */}
                    {(result.metadata || result.watermarkData.length > 0) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Technical Details</CardTitle>
                                <CardDescription>
                                    Extracted metadata and watermark information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {result.metadata && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">PDF Metadata</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            {result.metadata.title && (
                                                <div><span className="font-medium">Title:</span> {result.metadata.title}</div>
                                            )}
                                            {result.metadata.subject && (
                                                <div><span className="font-medium">Subject:</span> {result.metadata.subject}</div>
                                            )}
                                            {result.metadata.creator && (
                                                <div><span className="font-medium">Creator:</span> {result.metadata.creator}</div>
                                            )}
                                            {result.metadata.keywords && result.metadata.keywords.length > 0 && (
                                                <div><span className="font-medium">Keywords:</span> {result.metadata.keywords.join(', ')}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {result.watermarkData.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Watermark Data</h4>
                                        <div className="space-y-2">
                                            {result.watermarkData.map((watermark, index) => (
                                                <div key={index} className="text-xs p-2 bg-muted rounded">
                                                    <div><span className="font-medium">Location:</span> {watermark.location}</div>
                                                    <div><span className="font-medium">Type:</span> {watermark.type}</div>
                                                    <div><span className="font-medium">Data:</span> {JSON.stringify(watermark.data)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
