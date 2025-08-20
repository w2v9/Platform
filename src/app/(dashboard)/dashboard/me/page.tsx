"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/authContext";
import { User, getUserById, UserStatusColor } from "@/lib/db_user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateDoc, doc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "@/lib/config/firebase-config";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Calendar, Mail, Shield, GraduationCap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";


const statusColors: UserStatusColor = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
    warned: "bg-yellow-500",
    banned: "bg-red-500"
};

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        displayName: "",
        phone: "",
        photoURL: "",
        nickname: "",
        leaderboardEnabled: true
    });

    useEffect(() => {
        async function fetchUserData() {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                const data = await getUserById(user.uid);
                setUserData(data);
                setFormData({
                    displayName: data?.displayName || "",
                    phone: data?.phone || "",
                    photoURL: data?.photoURL || "",
                    nickname: data?.nickname || "",
                    leaderboardEnabled: data?.leaderboardEnabled !== false
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
                toast.error("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        }

        fetchUserData();
    }, [user, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newData = {
                ...prev,
                [name]: value
            };
            
            // If nickname is cleared and leaderboard is enabled, disable leaderboard participation
            if (name === "nickname" && (!value || value.trim() === "") && newData.leaderboardEnabled) {
                newData.leaderboardEnabled = false;
            }
            
            return newData;
        });
    };

    const handleUpdateProfile = async () => {
        if (!user || !userData) return;

        // Validate nickname requirement for leaderboard participation
        if (userData.role === "user" && formData.leaderboardEnabled && (!formData.nickname || formData.nickname.trim() === "")) {
            toast.error("You must set a nickname to participate in the leaderboard.");
            return;
        }

        try {
            setUpdating(true);

            // For users with "user" role, only allow updating photoURL
            const updateData: any = {
                "metadata.updatedAt": new Date().toISOString()
            };

            if (userData.role === "admin") {
                // Admins can update all fields
                updateData.displayName = formData.displayName;
                updateData.phone = formData.phone;
                updateData.photoURL = formData.photoURL;
            } else {
                // Users can update photoURL, nickname, and leaderboard settings
                updateData.photoURL = formData.photoURL;
                updateData.nickname = formData.nickname;
                updateData.leaderboardEnabled = formData.leaderboardEnabled;
            }

            // Update Firestore document
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, updateData);

            // Update Firebase Auth profile
            if (auth.currentUser) {
                const authUpdateData: any = {
                    photoURL: formData.photoURL
                };
                
                if (userData.role === "admin") {
                    authUpdateData.displayName = formData.displayName;
                }
                
                await updateProfile(auth.currentUser, authUpdateData);
            }

            // Refresh user data
            const updatedUserData = await getUserById(user.uid);
            setUserData(updatedUserData);

            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <SidebarInset>
                <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Results</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-col items-center justify-center h-screen">
                    <Alert className="max-w-md">
                        <AlertDescription>
                            User profile information could not be loaded. Please try again later.
                        </AlertDescription>
                    </Alert>
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
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Results</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="container max-w-6xl py-8 px-4 md:px-8">
                <h1 className="text-3xl font-bold mb-6">My Profile</h1>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="mb-8">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                        <TabsTrigger value="history">Login History</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="md:col-span-2">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        {userData.photoURL ? (
                                            <AvatarImage src={userData.photoURL} alt={userData.displayName} />
                                        ) : (
                                            <AvatarFallback className="text-lg">
                                                {userData.displayName?.charAt(0) || userData.email?.charAt(0)}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl">{userData.displayName}</CardTitle>
                                        <CardDescription className="flex items-center">
                                            <Mail className="w-4 h-4 mr-2" />
                                            {userData.email}
                                        </CardDescription>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`${statusColors[userData.status || 'inactive']} text-white`}>
                                                {userData.status || 'inactive'}
                                            </Badge>
                                            <Badge variant="secondary">
                                                <Shield className="w-3 h-3 mr-1" /> {userData.role}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Display Name</p>
                                        <p className="font-medium">{userData.displayName}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{userData.email}</p>
                                    </div>

                                    {userData.phone && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Phone</p>
                                            <p className="font-medium">{userData.phone}</p>
                                        </div>
                                    )}

                                    {userData.username && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Username</p>
                                            <p className="font-medium">{userData.username}</p>
                                        </div>
                                    )}

                                    {userData.role === "user" && userData.nickname && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Nickname (Leaderboard)</p>
                                            <p className="font-medium">{userData.nickname}</p>
                                        </div>
                                    )}

                                    {userData.role === "user" && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Leaderboard Participation</p>
                                            <p className="font-medium">
                                                {userData.leaderboardEnabled !== false ? (
                                                    <Badge variant="default" className="text-xs">Enabled</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs">Disabled</Badge>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Account Created</p>
                                        <p className="font-medium">
                                            {userData.metadata.createdAt ? (
                                                format(new Date(userData.metadata.createdAt), "PPP")
                                            ) : (
                                                "N/A"
                                            )}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Last Login</p>
                                        <p className="font-medium">
                                            {userData.metadata.lastLoginAt ? (
                                                format(new Date(userData.metadata.lastLoginAt), "PPp")
                                            ) : (
                                                "N/A"
                                            )}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Last Updated</p>
                                        <p className="font-medium">
                                            {userData.metadata.updatedAt ? (
                                                format(new Date(userData.metadata.updatedAt), "PPp")
                                            ) : (
                                                "N/A"
                                            )}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Quiz Results</p>
                                        <p className="font-medium">{userData.quizResults?.length || 0} quizzes taken</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {userData.quizResults && userData.quizResults.length > 0 && (
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Recent Quiz Results</CardTitle>
                                        <CardDescription>Your most recent quiz performances</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Quiz</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Score</TableHead>
                                                    <TableHead>Time</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {userData.quizResults.slice(0, 5).map((result, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{result.quizId}</TableCell>
                                                        <TableCell>
                                                            {format(new Date(result.dateTaken), "PPp")}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={result.percentageScore >= 70 ? "default" : "destructive"}>
                                                                {result.score}/{result.maxScore} ({result.percentageScore.toFixed(0)}%)
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{result.completionTime} min</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/me/quizzes/results")}>
                                            View All Results
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Edit Profile Tab */}
                    <TabsContent value="edit">
                        <Card>
                            <CardHeader>
                                <CardTitle>Update Your Profile</CardTitle>
                                <CardDescription>Make changes to your profile information here</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleInputChange}
                                        placeholder="Your name"
                                        disabled={userData.role === "user"}
                                    />
                                    {userData.role === "user" && (
                                        <p className="text-sm text-muted-foreground">
                                            Display name cannot be changed for user accounts. Contact an administrator if you need to update this information.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleInputChange}
                                        placeholder="Your phone number"
                                        disabled={userData.role === "user"}
                                    />
                                    {userData.role === "user" && (
                                        <p className="text-sm text-muted-foreground">
                                            Phone number cannot be changed for user accounts. Contact an administrator if you need to update this information.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="photoURL">Profile Photo URL</Label>
                                    <Input
                                        id="photoURL"
                                        name="photoURL"
                                        value={formData.photoURL || ''}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/your-photo.jpg"
                                    />
                                    {formData.photoURL && (
                                        <div className="mt-2 flex justify-center">
                                            <Avatar className="h-20 w-20">
                                                <AvatarImage src={formData.photoURL} alt="Preview" />
                                                <AvatarFallback>
                                                    {formData.displayName?.charAt(0) || userData.email?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    )}
                                </div>

                                {userData.role === "user" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="nickname">Nickname (for Leaderboard) *</Label>
                                            <Input
                                                id="nickname"
                                                name="nickname"
                                                value={formData.nickname || ''}
                                                onChange={handleInputChange}
                                                placeholder="Enter your nickname"
                                                maxLength={20}
                                                className={formData.leaderboardEnabled && (!formData.nickname || formData.nickname.trim() === "") ? "border-red-500" : ""}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Your nickname will be displayed on the leaderboard instead of your real name.
                                                {formData.leaderboardEnabled && (!formData.nickname || formData.nickname.trim() === "") && (
                                                    <span className="text-red-500 block mt-1">Nickname is required for leaderboard participation.</span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="leaderboardEnabled">Leaderboard Participation</Label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="leaderboardEnabled"
                                                    name="leaderboardEnabled"
                                                    checked={formData.leaderboardEnabled}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            leaderboardEnabled: e.target.checked
                                                        }));
                                                    }}
                                                    className="rounded border-gray-300"
                                                    disabled={!formData.nickname || formData.nickname.trim() === ""}
                                                />
                                                <Label htmlFor="leaderboardEnabled" className="text-sm font-normal">
                                                    Participate in leaderboard rankings
                                                </Label>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {!formData.nickname || formData.nickname.trim() === "" 
                                                    ? "You must set a nickname first to participate in the leaderboard."
                                                    : formData.leaderboardEnabled 
                                                        ? "You will appear on the leaderboard with your nickname."
                                                        : "You will not appear on the leaderboard."
                                                }
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => {
                                    setFormData({
                                        displayName: userData.displayName || "",
                                        phone: userData.phone || "",
                                        photoURL: userData.photoURL || "",
                                        nickname: userData.nickname || "",
                                        leaderboardEnabled: userData.leaderboardEnabled !== false
                                    });
                                }}>
                                    Reset
                                </Button>
                                <Button onClick={handleUpdateProfile} disabled={updating}>
                                    {updating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Login History Tab */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Login History</CardTitle>
                                <CardDescription>Your recent login sessions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px]">
                                    {userData.metadata.sessions && userData.metadata.sessions.length > 0 ? (
                                        <div className="space-y-6">
                                            {userData.metadata.sessions.slice().reverse().map((session, index) => (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Badge variant="outline" className="mb-2">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {format(new Date(session.loginAt), "PPpp")}
                                                        </Badge>
                                                        <p className="text-sm text-muted-foreground">
                                                            {session.ip || "Unknown IP"}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm font-medium flex items-center">
                                                                <Globe className="w-4 h-4 mr-2" />
                                                                Location
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {session.location?.city ? (
                                                                    `${session.location.city}, ${session.location.region}, ${session.location.country}`
                                                                ) : (
                                                                    "Location not available"
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-medium">Device</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {session.device ? (
                                                                    `${session.device.browser} on ${session.device.os} (${session.device.type})`
                                                                ) : (
                                                                    "Device info not available"
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">No login history available</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </SidebarInset>
    );
}