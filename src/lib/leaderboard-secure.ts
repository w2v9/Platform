import { collection, getDocs, query, orderBy, limit as firestoreLimit, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "./config/firebase-config";
import { User, getUserById } from "./db_user";
import { QuizReport } from "./utils/db_reports";
import { QuizLeaderboardEntry, QuizLeaderboardStats } from "./leaderboard";

/**
 * Improved version of getQuizLeaderboard that better handles security rules
 * @param quizId The ID of the quiz
 * @param limit_count Maximum number of entries to return
 * @returns Quiz-specific leaderboard data and stats
 */
export async function getQuizLeaderboardSecure(
    quizId: string,
    limit_count: number = 50
): Promise<{
    leaderboard: QuizLeaderboardEntry[],
    stats: QuizLeaderboardStats
}> {
    try {
        // Check if the current user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error("You must be logged in to view the leaderboard");
        }

        // Try to determine if user is admin - this is for UI display only, security is enforced by rules
        let isAdmin = false;
        try {
            const userData = await getUserById(currentUser.uid);
            isAdmin = userData?.role === "admin";
        } catch (err) {
            console.log("Could not determine admin status, continuing with regular user access");
        }

        // Get all users with only public fields for leaderboard - with a limit to respect security rules
        const usersRef = collection(db, "users");
        const usersQuery = query(usersRef, firestoreLimit(100));
        const usersSnapshot = await getDocs(usersQuery);

        // Create a map of user IDs to user data for quick lookups
        const usersMap = new Map<string, User>();
        usersSnapshot.forEach((doc) => {
            const userData = doc.data() as User;
            const userId = userData.id || userData.uid || '';
            // Only store minimal public data to respect security rules
            usersMap.set(userId, {
                id: userId,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                email: userData.email,
                role: userData.role,
                // Don't include other sensitive fields
                metadata: { createdAt: '', updatedAt: '' },
                quizResults: []
            } as User);
        });

        // Get all reports for this specific quiz
        const reportsRef = collection(db, "reports");
        const q = query(
            reportsRef,
            where("quizId", "==", quizId),
            firestoreLimit(100) // Add limit to respect rules
        );
        const reportsSnapshot = await getDocs(q);

        // Group reports by userId to track attempts
        const userAttempts: { [userId: string]: QuizReport[] } = {};
        reportsSnapshot.forEach((doc) => {
            const report = { ...doc.data(), id: doc.id } as QuizReport;
            if (!userAttempts[report.userId]) {
                userAttempts[report.userId] = [];
            }
            userAttempts[report.userId].push(report);
        });

        // Process all attempts and mark best attempts
        const allAttempts: QuizLeaderboardEntry[] = [];
        let totalAttempts = 0;
        let totalUsers = 0;
        let totalScoreSum = 0;
        let bestScore = 0;
        let fastestTime = Number.MAX_VALUE;

        // Process each user's attempts
        Object.entries(userAttempts).forEach(([userId, attempts]) => {
            if (attempts.length === 0) return;

            const user = usersMap.get(userId);
            if (!user) return;

            // For users with "user" role, check if they meet leaderboard criteria
            if (user.role === "user") {
                // Skip users without nicknames
                if (!user.nickname || user.nickname.trim() === "") {
                    return;
                }
                
                // Skip users who have disabled leaderboard participation
                if (user.leaderboardEnabled === false) {
                    return;
                }
                
                // Skip banned or disabled users
                if (user.status === "banned" || user.status === "inactive") {
                    return;
                }
            }

            totalUsers++;
            totalAttempts += attempts.length;

            // Sort attempts by score (descending) and then by time (ascending)
            const sortedAttempts = [...attempts].sort((a, b) => {
                const scoreA = a.percentageScore || 0;
                const scoreB = b.percentageScore || 0;

                if (scoreA !== scoreB) {
                    return scoreB - scoreA; // Higher score first
                }

                const timeA = a.timeTaken || 0;
                const timeB = b.timeTaken || 0;
                return timeA - timeB; // Faster time first
            });

            // Mark the best attempt (first after sorting)
            const bestAttempt = sortedAttempts[0];

            // Update stats
            bestScore = Math.max(bestScore, bestAttempt.percentageScore || 0);
            fastestTime = Math.min(fastestTime, bestAttempt.timeTaken || Number.MAX_VALUE);

            // Add all attempts to the leaderboard entries
            attempts.forEach((attempt, index) => {
                const user = usersMap.get(userId);
                if (!user) return;

                const isBestAttempt = attempt.id === bestAttempt.id;
                if (isBestAttempt) {
                    totalScoreSum += attempt.percentageScore || 0;
                }

                allAttempts.push({
                    id: userId,
                    displayName: user.role === "user" ? (user.nickname || user.displayName) : user.displayName,
                    photoURL: user.photoURL,
                    email: user.email,
                    score: attempt.score || 0,
                    percentageScore: attempt.percentageScore || 0,
                    timeTaken: attempt.timeTaken || 0,
                    rank: 0, // Will be set after sorting
                    attemptNumber: index + 1,
                    isBestAttempt,
                    dateTaken: attempt.dateTaken || ''
                });
            });
        });

        // For the leaderboard, we only want to show the best attempt per user
        const bestAttemptsLeaderboard = allAttempts
            .filter(entry => entry.isBestAttempt)
            .sort((a, b) => {
                // Sort by percentage score (descending)
                if (a.percentageScore !== b.percentageScore) {
                    return b.percentageScore - a.percentageScore;
                }
                // If scores are equal, sort by time taken (ascending)
                return a.timeTaken - b.timeTaken;
            });

        // Assign ranks
        bestAttemptsLeaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        // Limit the number of entries if requested
        const limitedLeaderboard = limit_count > 0
            ? bestAttemptsLeaderboard.slice(0, limit_count)
            : bestAttemptsLeaderboard;

        // Calculate stats
        const stats: QuizLeaderboardStats = {
            totalAttempts,
            totalUsers,
            averageScore: totalUsers > 0
                ? Math.round((totalScoreSum / totalUsers) * 100) / 100
                : 0,
            bestScore: Math.round(bestScore * 100) / 100,
            fastestTime: fastestTime === Number.MAX_VALUE ? 0 : fastestTime
        };

        return {
            leaderboard: limitedLeaderboard,
            stats
        };
    } catch (error) {
        console.error(`Error fetching leaderboard for quiz ${quizId}:`, error);

        // Fallback to showing only the current user's data
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("You must be logged in to view the leaderboard");
            }

            console.log("Falling back to showing only current user's attempts");

            // Get only the current user's reports for this quiz
            const reportsRef = collection(db, "reports");
            const q = query(
                reportsRef,
                where("quizId", "==", quizId),
                where("userId", "==", currentUser.uid),
                firestoreLimit(50)
            );
            const reportsSnapshot = await getDocs(q);

            if (reportsSnapshot.empty) {
                return {
                    leaderboard: [],
                    stats: {
                        totalAttempts: 0,
                        totalUsers: 0,
                        averageScore: 0,
                        bestScore: 0,
                        fastestTime: 0
                    }
                };
            }

            // Get user data
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (!userDoc.exists()) {
                throw new Error("User data not found");
            }

            const userData = userDoc.data() as User;

            // Process the user's attempts
            const userReports: QuizReport[] = [];
            reportsSnapshot.forEach(doc => {
                userReports.push({ ...doc.data(), id: doc.id } as QuizReport);
            });

            // Sort attempts by score (descending) and then by time (ascending)
            const sortedAttempts = [...userReports].sort((a, b) => {
                const scoreA = a.percentageScore || 0;
                const scoreB = b.percentageScore || 0;

                if (scoreA !== scoreB) {
                    return scoreB - scoreA; // Higher score first
                }

                const timeA = a.timeTaken || 0;
                const timeB = b.timeTaken || 0;
                return timeA - timeB; // Faster time first
            });

            // Get the best attempt
            const bestAttempt = sortedAttempts[0];

            // Create leaderboard entries
            const attempts: QuizLeaderboardEntry[] = userReports.map((attempt, index) => {
                const isBestAttempt = attempt.id === bestAttempt.id;

                return {
                    id: userData.id || userData.uid || '',
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                    email: userData.email,
                    score: attempt.score || 0,
                    percentageScore: attempt.percentageScore || 0,
                    timeTaken: attempt.timeTaken || 0,
                    rank: 1, // Only showing current user
                    attemptNumber: index + 1,
                    isBestAttempt,
                    dateTaken: attempt.dateTaken || ''
                };
            });

            // Find the best attempt entry
            const bestAttemptEntry = attempts.find(a => a.isBestAttempt) || attempts[0];

            return {
                leaderboard: [bestAttemptEntry],
                stats: {
                    totalAttempts: attempts.length,
                    totalUsers: 1,
                    averageScore: bestAttemptEntry.percentageScore,
                    bestScore: bestAttemptEntry.percentageScore,
                    fastestTime: bestAttemptEntry.timeTaken
                }
            };
        } catch (fallbackError) {
            console.error("Fallback error:", fallbackError);
            throw error; // Throw the original error
        }
    }
}
