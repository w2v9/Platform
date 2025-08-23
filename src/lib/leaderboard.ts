import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    doc,
    getDoc,
    Timestamp,
  } from "firebase/firestore";
  import { db, auth } from "./config/firebase-config";
  import { User } from "./db_user";
  import { QuizReport } from "./utils/db_reports";
  import { getUserById } from "./db_user";
  
  export enum TimeFilter {
    ALL_TIME = "all_time",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly",
  }
  
  export interface LeaderboardEntry {
    id: string;
    displayName: string;
    photoURL?: string;
    email: string;
    totalQuizzes: number;
    averageScore: number;
    totalScore: number;
    maxScore: number;
    bestScore: number;
    totalCompletionTime: number;
    averageCompletionTime: number;
    rank: number;
    badges: string[];
    lastQuizDate?: string;
  }
  
  export interface QuizLeaderboardEntry {
    id: string;
    displayName: string;
    photoURL?: string;
    email: string;
    score: number;
    percentageScore: number;
    timeTaken: number;
    rank: number;
    attemptNumber: number;
    isBestAttempt: boolean;
    dateTaken: string;
  }
  
  export interface LeaderboardStats {
    totalUsers: number;
    totalQuizzes: number;
    averageScore: number;
    topScore: number;
  }
  
  export interface QuizLeaderboardStats {
    totalAttempts: number;
    totalUsers: number;
    averageScore: number;
    bestScore: number;
    fastestTime: number;
  }
  
  export async function getLeaderboardData(
    timeFilter: TimeFilter = TimeFilter.ALL_TIME
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    stats: LeaderboardStats;
  }> {
    try {
      // Check if the current user is logged in
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
        console.log(
          "Could not determine admin status, continuing with regular user access"
        );
      }
  
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef);
      const usersSnapshot = await getDocs(usersQuery);
  
      // Get all reports (the security rules will filter appropriately)
      const reportsRef = collection(db, "reports");
      // Calculate the start date based on the time filter
      const startDate = getStartDateForTimeFilter(timeFilter);
  
      // Build the query based on the time filter - ALL users should see ALL users in leaderboard
      let reportsQuery;
      if (startDate && timeFilter !== TimeFilter.ALL_TIME) {
        reportsQuery = query(
          reportsRef,
          where("dateTaken", ">=", startDate),
          limit(500)
        );
      } else {
        reportsQuery = query(
          reportsRef,
          limit(500)
        );
      }
  
      let reportsSnapshot;
  
      try {
        reportsSnapshot = await getDocs(reportsQuery);
      } catch (err) {
        console.error(
          "Error fetching reports, falling back to limited reports:",
          err
        );
        // If getting all reports fails, try getting limited reports
        const fallbackQuery = query(
          collection(db, "reports"),
          limit(100)
        );
        reportsSnapshot = await getDocs(fallbackQuery);
      }
  
      // Group reports by userId
      const userReports: { [userId: string]: QuizReport[] } = {};
      reportsSnapshot.forEach((doc: any) => {
        const report = { ...doc.data(), id: doc.id } as QuizReport;
        if (!userReports[report.userId]) {
          userReports[report.userId] = [];
        }
        userReports[report.userId].push(report);
      });
  
      const leaderboardData: LeaderboardEntry[] = [];
      let totalQuizzes = 0;
      let totalScoreSum = 0;
      let totalScoreCount = 0;
      let topScore = 0;
  
      usersSnapshot.forEach((doc) => {
        const user = doc.data() as User;
        const userId = user.id || user.uid || "";
        const quizResults = userReports[userId] || [];
  
        // Only include users with quiz results AND who meet leaderboard criteria
        if (quizResults && quizResults.length > 0) {
          // For users with "user" role, check if they have nickname and leaderboard enabled
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
          const totalUserQuizzes = quizResults.length;
  
          // Calculate statistics - handle cases where percentageScore might be undefined
          const scores = quizResults
            .map((q: QuizReport) => q.percentageScore || 0)
            .filter((score: number) => !isNaN(score));
  
          if (scores.length === 0) return; // Skip if no valid scores
  
          const totalScore = scores.reduce(
            (sum: number, score: number) => sum + score,
            0
          );
          const averageScore = totalScore / scores.length;
          const bestScore = Math.max(...scores);
  
          const maxPossibleScore = quizResults.reduce(
            (sum: number, q: QuizReport) => sum + (q.maxScore || 0),
            0
          );
          const actualTotalScore = quizResults.reduce(
            (sum: number, q: QuizReport) => sum + (q.score || 0),
            0
          );
  
          const completionTimes = quizResults.map(
            (q: QuizReport) => q.timeTaken || 0
          );
          const totalCompletionTime = completionTimes.reduce(
            (sum: number, time: number) => sum + time,
            0
          );
          const averageCompletionTime = totalCompletionTime / totalUserQuizzes;
  
          // Get last quiz date - sort by date and get the most recent
          const sortedReports = [...quizResults].sort((a, b) => {
            const dateA = new Date(a.dateTaken || "").getTime();
            const dateB = new Date(b.dateTaken || "").getTime();
            return dateB - dateA;
          });
          const lastQuizDate = sortedReports[0]?.dateTaken;
  
          // Calculate badges
          const badges = calculateBadges(user, quizResults);
  
          leaderboardData.push({
            id: user.id || user.uid || "",
            displayName:
              user.role === "user"
                ? user.nickname || user.displayName
                : user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            totalQuizzes: totalUserQuizzes,
            averageScore: Math.round(averageScore * 100) / 100,
            totalScore: actualTotalScore,
            maxScore: maxPossibleScore,
            bestScore: Math.round(bestScore * 100) / 100,
            totalCompletionTime,
            averageCompletionTime: Math.round(averageCompletionTime),
            rank: 0, // Will be set after sorting
            badges,
            lastQuizDate,
          });
  
          // Update overall stats
          totalQuizzes += totalUserQuizzes;
          totalScoreSum += totalScore;
          totalScoreCount += totalUserQuizzes;
          topScore = Math.max(topScore, bestScore);
        }
      });
  
      // Sort by average score (descending), then by total quizzes (descending)
      leaderboardData.sort((a, b) => {
        if (a.averageScore !== b.averageScore) {
          return b.averageScore - a.averageScore;
        }
        return b.totalQuizzes - a.totalQuizzes;
      });
  
      // Assign ranks
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });
  
      const stats: LeaderboardStats = {
        totalUsers: leaderboardData.length,
        totalQuizzes,
        averageScore:
          totalScoreCount > 0
            ? Math.round((totalScoreSum / totalScoreCount) * 100) / 100
            : 0,
        topScore: Math.round(topScore * 100) / 100,
      };
  
      return { leaderboard: leaderboardData, stats };
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
  
      // Provide a fallback for when security rules prevent the full query
      try {
        // Only get the current user's data and reports
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("You must be logged in to view the leaderboard");
        }
  
        console.log("Falling back to showing only current user's data");
  
        // Get current user's profile
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          throw new Error("User data not found");
        }
  
        const userData = userDoc.data() as User;
  
        // Get only the current user's reports
        const userReportsQuery = query(
          collection(db, "reports"),
          where("userId", "==", currentUser.uid)
        );
        const userReportsSnapshot = await getDocs(userReportsQuery);
  
        const userReports: QuizReport[] = [];
        userReportsSnapshot.forEach((doc) => {
          userReports.push({ ...doc.data(), id: doc.id } as QuizReport);
        });
  
        if (userReports.length === 0) {
          return {
            leaderboard: [],
            stats: {
              totalUsers: 0,
              totalQuizzes: 0,
              averageScore: 0,
              topScore: 0,
            },
          };
        }
  
        // Calculate stats for the current user only
        const scores = userReports
          .map((q: QuizReport) => q.percentageScore || 0)
          .filter((score: number) => !isNaN(score));
  
        const totalScore = scores.reduce(
          (sum: number, score: number) => sum + score,
          0
        );
        const averageScore = totalScore / scores.length;
        const bestScore = Math.max(...scores);
  
        const leaderboardEntry: LeaderboardEntry = {
          id: userData.id || userData.uid || "",
          displayName:
            userData.role === "user"
              ? userData.nickname || userData.displayName
              : userData.displayName,
          photoURL: userData.photoURL,
          email: userData.email,
          totalQuizzes: userReports.length,
          averageScore: Math.round(averageScore * 100) / 100,
          totalScore: userReports.reduce(
            (sum: number, q: QuizReport) => sum + (q.score || 0),
            0
          ),
          maxScore: userReports.reduce(
            (sum: number, q: QuizReport) => sum + (q.maxScore || 0),
            0
          ),
          bestScore: Math.round(bestScore * 100) / 100,
          totalCompletionTime: userReports.reduce(
            (sum: number, q: QuizReport) => sum + (q.timeTaken || 0),
            0
          ),
          averageCompletionTime: Math.round(
            userReports.reduce(
              (sum: number, q: QuizReport) => sum + (q.timeTaken || 0),
              0
            ) / userReports.length
          ),
          rank: 1, // Only showing the current user
          badges: calculateBadges(userData, userReports),
          lastQuizDate: userReports[0]?.dateTaken,
        };
  
        return {
          leaderboard: [leaderboardEntry],
          stats: {
            totalUsers: 1,
            totalQuizzes: userReports.length,
            averageScore: Math.round(averageScore * 100) / 100,
            topScore: Math.round(bestScore * 100) / 100,
          },
        };
      } catch (fallbackError) {
        console.error("Fallback leaderboard error:", fallbackError);
        throw error; // Throw the original error
      }
    }
  }
  
  function calculateBadges(user: User, quizResults: QuizReport[]): string[] {
    const badges: string[] = [];
  
    const totalQuizzes = quizResults.length;
  
    // Calculate average score with null checks
    const validScores = quizResults
      .map((q: QuizReport) => q.percentageScore || 0)
      .filter((score: number) => !isNaN(score) && score >= 0);
  
    if (validScores.length === 0) return badges;
  
    const averageScore =
      validScores.reduce((sum: number, score: number) => sum + score, 0) /
      validScores.length;
    const perfectScores = validScores.filter(
      (score: number) => score === 100
    ).length;
    const highScores = validScores.filter((score: number) => score >= 90).length;
  
    // Quiz completion badges
    if (totalQuizzes >= 1) badges.push("First Quiz");
    if (totalQuizzes >= 5) badges.push("Quiz Explorer");
    if (totalQuizzes >= 10) badges.push("Quiz Enthusiast");
    if (totalQuizzes >= 25) badges.push("Quiz Master");
    if (totalQuizzes >= 50) badges.push("Quiz Legend");
  
    // Performance badges
    if (averageScore >= 95) badges.push("Perfectionist");
    else if (averageScore >= 85) badges.push("High Achiever");
    else if (averageScore >= 75) badges.push("Good Student");
  
    // Perfect score badges
    if (perfectScores >= 1) badges.push("Perfect Score");
    if (perfectScores >= 5) badges.push("Consistency King");
    if (perfectScores >= 10) badges.push("Flawless Performer");
  
    // High score badges
    if (highScores >= 10) badges.push("Top Performer");
    if (highScores >= 20) badges.push("Elite Scorer");
  
    // Speed badges (using timeTaken from QuizReport)
    const validTimes = quizResults
      .map((q: QuizReport) => q.timeTaken || 0)
      .filter((time: number) => time > 0);
  
    if (validTimes.length > 0) {
      const avgCompletionTime =
        validTimes.reduce((sum: number, time: number) => sum + time, 0) /
        validTimes.length;
      if (avgCompletionTime < 120) {
        // Less than 2 minutes average
        badges.push("Speed Demon");
      }
    }
  
    // Streak badges (consecutive days - simplified)
    if (quizResults.length >= 7) {
      badges.push("Weekly Warrior");
    }
  
    return badges;
  }
  
  export async function getUserRank(userId: string): Promise<number | null> {
    try {
      const { leaderboard } = await getLeaderboardData();
      const userEntry = leaderboard.find((entry) => entry.id === userId);
      return userEntry ? userEntry.rank : null;
    } catch (error) {
      console.error("Error getting user rank:", error);
      return null;
    }
  }
  
  export async function getTopPerformers(
    limit_count: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const { leaderboard } = await getLeaderboardData();
      return leaderboard.slice(0, limit_count);
    } catch (error) {
      console.error("Error getting top performers:", error);
      return [];
    }
  }
  
  // New functions for quiz-specific leaderboards
  
  /**
   * Get leaderboard data for a specific quiz
   * @param quizId The ID of the quiz
   * @param limit_count Maximum number of entries to return
   * @returns Quiz-specific leaderboard data and stats
   */
  export async function getQuizLeaderboard(
    quizId: string,
    limit_count: number = 50,
    timeFilter: TimeFilter = TimeFilter.ALL_TIME
  ): Promise<{
    leaderboard: QuizLeaderboardEntry[];
    stats: QuizLeaderboardStats;
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
        console.log(
          "Could not determine admin status, continuing with regular user access"
        );
      }
  
      // Get all users with only public fields for leaderboard
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef); // Add limit to respect rules
      const usersSnapshot = await getDocs(usersQuery);
  
      // Create a map of user IDs to user data for quick lookups
      const usersMap = new Map<string, User>();
      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as User;
        const userId = userData.id || userData.uid || "";
        // Only store minimal public data to respect security rules
        usersMap.set(userId, {
          id: userId,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          email: userData.email,
          role: userData.role,
          // Don't include other sensitive fields
          metadata: { createdAt: "", updatedAt: "" },
          quizResults: [],
        } as User);
      });
  
      // Get all reports for this specific quiz
      const reportsRef = collection(db, "reports");
  
      // Calculate the start date based on the time filter
      const startDate = getStartDateForTimeFilter(timeFilter);
  
      let reportsSnapshot;
  
      try {
        // Try to get all reports for this quiz - will succeed for admins
        let q;
        if (startDate && timeFilter !== TimeFilter.ALL_TIME) {
          q = query(
            reportsRef,
            where("quizId", "==", quizId),
            where("dateTaken", ">=", startDate)
          );
        } else {
          q = query(reportsRef, where("quizId", "==", quizId));
        }
        reportsSnapshot = await getDocs(q);
      } catch (err) {
        // If that fails due to permissions, get only the current user's reports
        console.error(
          "Permission error getting all quiz reports, falling back to user's reports only:",
          err
        );
  
        let q;
        if (startDate && timeFilter !== TimeFilter.ALL_TIME) {
          q = query(
            reportsRef,
            where("quizId", "==", quizId),
            where("userId", "==", currentUser.uid),
            where("dateTaken", ">=", startDate)
          );
        } else {
          q = query(
            reportsRef,
            where("quizId", "==", quizId),
            where("userId", "==", currentUser.uid)
          );
        }
        reportsSnapshot = await getDocs(q);
      }
  
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
        fastestTime = Math.min(
          fastestTime,
          bestAttempt.timeTaken || Number.MAX_VALUE
        );
  
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
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            score: attempt.score || 0,
            percentageScore: attempt.percentageScore || 0,
            timeTaken: attempt.timeTaken || 0,
            rank: 0, // Will be set after sorting
            attemptNumber: index + 1,
            isBestAttempt,
            dateTaken: attempt.dateTaken || "",
          });
        });
      });
  
      // For the leaderboard, we only want to show the best attempt per user
      const bestAttemptsLeaderboard = allAttempts
        .filter((entry) => entry.isBestAttempt)
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
      const limitedLeaderboard = bestAttemptsLeaderboard;
  
      // Calculate stats
      const stats: QuizLeaderboardStats = {
        totalAttempts,
        totalUsers,
        averageScore:
          totalUsers > 0
            ? Math.round((totalScoreSum / totalUsers) * 100) / 100
            : 0,
        bestScore: Math.round(bestScore * 100) / 100,
        fastestTime: fastestTime === Number.MAX_VALUE ? 0 : fastestTime,
      };
  
      return {
        leaderboard: limitedLeaderboard,
        stats,
      };
    } catch (error) {
      console.error(`Error fetching leaderboard for quiz ${quizId}:`, error);
  
      // Provide a fallback for when security rules prevent the full query
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("You must be logged in to view the leaderboard");
        }
  
        console.log("Falling back to showing only current user's attempts");
  
        // Get only the current user's reports for this quiz
        const userAttempts = await getUserQuizAttempts(quizId, currentUser.uid);
  
        if (userAttempts.length === 0) {
          return {
            leaderboard: [],
            stats: {
              totalAttempts: 0,
              totalUsers: 0,
              averageScore: 0,
              bestScore: 0,
              fastestTime: 0,
            },
          };
        }
  
        // Find best attempt
        const bestAttempt =
          userAttempts.find((a) => a.isBestAttempt) || userAttempts[0];
        bestAttempt.rank = 1; // Set rank to 1 since we're only showing one user
  
        return {
          leaderboard: [bestAttempt],
          stats: {
            totalAttempts: userAttempts.length,
            totalUsers: 1,
            averageScore: bestAttempt.percentageScore,
            bestScore: bestAttempt.percentageScore,
            fastestTime: bestAttempt.timeTaken,
          },
        };
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        throw error; // Throw the original error
      }
    }
  }
  
  /**
   * Get all attempts for a specific user on a specific quiz
   * @param quizId The ID of the quiz
   * @param userId The ID of the user
   * @returns All attempts by the user for the quiz
   */
  export async function getUserQuizAttempts(
    quizId: string,
    userId: string,
    timeFilter: TimeFilter = TimeFilter.ALL_TIME
  ): Promise<QuizLeaderboardEntry[]> {
    try {
      // Check if user is requesting their own attempts
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to view quiz attempts");
      }
  
      const isOwnAttempts = currentUser.uid === userId;
      let isAdmin = false;
  
      // Try to determine if user is admin
      try {
        const userData = await getUserById(currentUser.uid);
        isAdmin = userData?.role === "admin";
      } catch (err) {
        console.log(
          "Could not determine admin status, continuing with regular user access"
        );
      }
  
      // Non-admins can only see their own attempts
      if (!isOwnAttempts && !isAdmin) {
        console.warn("Non-admin users can only see their own attempts");
        throw new Error(
          "You don't have permission to view other users' attempts"
        );
      }
  
      // Get user data - users can read their own data or public fields of other users
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found`);
      }
  
      const userData = userDoc.data() as User;
  
      // Get all reports for this user and quiz
      // Security rules should enforce that users can only see their own attempts
      // or public fields of other users' attempts
      const reportsRef = collection(db, "reports");
  
      // Calculate the start date based on the time filter
      const startDate = getStartDateForTimeFilter(timeFilter);
  
      let q;
      if (startDate && timeFilter !== TimeFilter.ALL_TIME) {
        q = query(
          reportsRef,
          where("quizId", "==", quizId),
          where("userId", "==", userId),
          where("dateTaken", ">=", startDate)
        );
      } else {
        q = query(
          reportsRef,
          where("quizId", "==", quizId),
          where("userId", "==", userId)
        );
      }
      const reportsSnapshot = await getDocs(q);
  
      if (reportsSnapshot.empty) {
        return [];
      }
  
      // Convert to QuizLeaderboardEntry objects
      const attempts: QuizLeaderboardEntry[] = [];
  
      // Get all attempts and sort by date (most recent first)
      const allAttempts: QuizReport[] = [];
      reportsSnapshot.forEach((doc) => {
        allAttempts.push({ ...doc.data(), id: doc.id } as QuizReport);
      });
  
      // Sort attempts by date
      allAttempts.sort((a, b) => {
        const dateA = new Date(a.dateTaken || "").getTime();
        const dateB = new Date(b.dateTaken || "").getTime();
        return dateB - dateA; // Most recent first
      });
  
      // Find the best attempt (highest score, then fastest time)
      const bestAttempt = [...allAttempts].sort((a, b) => {
        const scoreA = a.percentageScore || 0;
        const scoreB = b.percentageScore || 0;
  
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Higher score first
        }
  
        const timeA = a.timeTaken || 0;
        const timeB = b.timeTaken || 0;
        return timeA - timeB; // Faster time first
      })[0];
  
      // Convert all attempts to QuizLeaderboardEntry objects
      allAttempts.forEach((attempt, index) => {
        attempts.push({
          id: userId,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          email: userData.email,
          score: attempt.score || 0,
          percentageScore: attempt.percentageScore || 0,
          timeTaken: attempt.timeTaken || 0,
          rank: 0, // Not applicable for a single user's attempts
          attemptNumber: index + 1,
          isBestAttempt: attempt.id === bestAttempt.id,
          dateTaken: attempt.dateTaken || "",
        });
      });
  
      return attempts;
    } catch (error) {
      console.error(
        `Error fetching attempts for user ${userId} on quiz ${quizId}:`,
        error
      );
      throw error;
    }
  }
  
  /**
   * Get a user's rank for a specific quiz
   * @param quizId The ID of the quiz
   * @param userId The ID of the user
   * @returns The user's rank on the quiz leaderboard, or null if not found
   */
  export async function getUserQuizRank(
    quizId: string,
    userId: string
  ): Promise<number | null> {
    try {
      const { leaderboard } = await getQuizLeaderboard(quizId);
      const userEntry = leaderboard.find((entry) => entry.id === userId);
      return userEntry ? userEntry.rank : null;
    } catch (error) {
      console.error(`Error getting user rank for quiz ${quizId}:`, error);
      return null;
    }
  }
  
  /**
   * Helper function to get the start date for a time filter
   * @param timeFilter The time filter to get the start date for
   * @returns A Date object representing the start date for the time filter, or null for ALL_TIME
   */
  function getStartDateForTimeFilter(timeFilter: TimeFilter): string | null {
    const now = new Date();
  
    switch (timeFilter) {
      case TimeFilter.WEEKLY:
        // Go back 7 days
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo.toISOString();
  
      case TimeFilter.MONTHLY:
        // Go back 30 days
        const monthAgo = new Date(now);
        monthAgo.setDate(now.getDate() - 30);
        return monthAgo.toISOString();
  
      case TimeFilter.YEARLY:
        // Go back 365 days
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return yearAgo.toISOString();
  
      case TimeFilter.ALL_TIME:
      default:
        return null;
    }
  }