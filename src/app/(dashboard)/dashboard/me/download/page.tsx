'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, AlertCircle, RefreshCw, Info, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/context/authContext';
import { getUserById } from '@/lib/db_user';

import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';


interface PDFFile {
    name: string;
    size: number;
    lastModified: string;
    displayName: string;
}

export default function DownloadPage() {
    const { user } = useAuth();
    const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
    const [userData, setUserData] = useState<any>(null);
    const [isSamsungBrowser, setIsSamsungBrowser] = useState(false);
    const [showFileLocationHelp, setShowFileLocationHelp] = useState(false);

    useEffect(() => {
        document.title = 'PDF File Download Center - AzoozGAT Platform';
        
        // Detect Samsung browser
        const userAgent = navigator.userAgent.toLowerCase();
        const isSamsung = userAgent.includes('samsung') || 
                         userAgent.includes('samsungbrowser') || 
                         (userAgent.includes('android') && userAgent.includes('samsung'));
        setIsSamsungBrowser(isSamsung);
    }, []);


    const fetchPDFs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/pdfs');

            if (!response.ok) {
                throw new Error('Failed to fetch PDF files');
            }

            const data = await response.json();
            setPdfFiles(data.files || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load PDF files');
            toast.error('Failed to load PDF files');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserData = async () => {
        if (user) {
            try {
                const userDoc = await getUserById(user.uid);
                setUserData(userDoc);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
    };

    useEffect(() => {
        fetchPDFs();
        fetchUserData();
    }, [user]);

    const handleDownload = async (filename: string) => {
        if (!user || !userData) {
            toast.error('User authentication required');
            return;
        }

        try {
            setDownloadingFiles(prev => new Set(prev).add(filename));

            const response = await fetch(`/api/download/${encodeURIComponent(filename)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.uid,
                    userEmail: user.email,
                    userName: userData.displayName || user.displayName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to download file');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error('Download processing failed');
            }

            // Convert base64 to blob and download
            const pdfBytes = Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0));
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(`Downloaded ${filename} successfully with security watermark`);
            
            // Show file location help for Samsung browser users
            if (isSamsungBrowser) {
                setShowFileLocationHelp(true);
                setTimeout(() => {
                    setShowFileLocationHelp(false);
                }, 10000); // Hide after 10 seconds
            }
        } catch (err) {
            console.error('Download error:', err);
            toast.error(`Failed to download ${filename}`);
        } finally {
            setDownloadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(filename);
                return newSet;
            });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <SidebarInset>
                <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard/me">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Download PDF</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="container mx-auto p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Download Center</h1>
                            <p className="text-muted-foreground mt-1">
                                Download available PDF documents and resources
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </SidebarInset>
        );
    }

    return (
        <SidebarInset>
            <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/dashboard/me">
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Download PDF</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Download Center</h1>
                        <p className="text-muted-foreground mt-1">
                            Download available PDF documents and resources
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {isSamsungBrowser && (
                            <Button
                                onClick={() => setShowFileLocationHelp(true)}
                                variant="outline"
                                size="sm"
                            >
                                <Smartphone className="h-4 w-4 mr-2" />
                                Samsung Help
                            </Button>
                        )}
                        <Button
                            onClick={fetchPDFs}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Security Notice */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Security Notice:</strong> All downloaded PDFs are watermarked with your user information for security and tracking purposes.
                        This helps protect intellectual property and ensures responsible document sharing.
                        <strong> Administrators can verify and trace any PDF back to its original downloader.</strong>
                    </AlertDescription>
                </Alert>

                {/* Samsung Browser File Location Help */}
                {isSamsungBrowser && (
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
                        <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                            <strong>Samsung Browser Users:</strong> After downloading, you may need to check your device&apos;s 
                            <strong> Downloads folder</strong> or <strong>My Files app</strong> to locate the PDF file. 
                            Samsung browser sometimes doesn&apos;t show downloaded files immediately in the browser&apos;s download manager.
                        </AlertDescription>
                    </Alert>
                )}

                {/* File Location Help (shown after download) */}
                {showFileLocationHelp && (
                    <div className="space-y-3">
                        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 animate-pulse">
                            <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                                <strong>File Downloaded Successfully!</strong> To find your file:
                                <ul className="mt-2 ml-4 list-disc space-y-1">
                                    <li>Open <strong>My Files</strong> app on your device</li>
                                    <li>Navigate to <strong>Downloads</strong> folder</li>
                                    <li>Look for the file with today&apos;s date</li>
                                    <li>Or check <strong>Recent Files</strong> in My Files</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                        
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    // Try to open My Files app or Downloads folder
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Find Downloaded PDF',
                                            text: 'Your PDF has been downloaded. Check your Downloads folder or My Files app.',
                                            url: window.location.href
                                        });
                                    } else {
                                        // Fallback: show instructions
                                        toast.info('Open My Files app → Downloads folder to find your file');
                                    }
                                }}
                                className="flex-1"
                            >
                                <Smartphone className="h-4 w-4 mr-2" />
                                Find My Files
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowFileLocationHelp(false)}
                            >
                                Got it
                            </Button>
                        </div>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {pdfFiles.length === 0 && !loading && !error && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No PDF files available</h3>
                            <p className="text-muted-foreground text-center">
                                There are currently no PDF documents available for download.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {pdfFiles.length > 0 && (
                    <>
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-sm">
                                {pdfFiles.length} file{pdfFiles.length !== 1 ? 's' : ''} available
                            </Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pdfFiles.map((file) => (
                                <Card key={file.name} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                                <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base line-clamp-2">
                                                    {file.displayName}
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-1">
                                                    {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => handleDownload(file.name)}
                                            disabled={downloadingFiles.has(file.name) || !user}
                                            className="w-full"
                                            size="sm"
                                        >
                                            {downloadingFiles.has(file.name) ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                    Watermarking & Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download PDF
                                                </>
                                            )}
                                        </Button>
                                        {!user && (
                                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                                Login required to download
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </SidebarInset>
    );
}