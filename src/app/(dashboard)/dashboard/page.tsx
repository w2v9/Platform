'use client'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/authContext"
import { getUserById } from "@/lib/db_user"
import { Loader2 } from "lucide-react"


export default function Dashboard() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [isRedirecting, setIsRedirecting] = useState(false)

    useEffect(() => {
        if (authLoading) return

        async function redirectBasedOnRole() {
            setIsRedirecting(true)

            if (!user) {
                router.push('/login')
                return
            }

            try {
                const userData = await getUserById(user.uid)

                if (!userData) {
                    console.error("User data not found in database")
                    router.push('/auth/login')
                    return
                }

                if (userData.role === 'admin') {
                    router.push('/dashboard/admin')
                } else if (userData.role === 'user') {
                    router.push('/dashboard/me')
                } else {
                    console.error("User role not recognized")
                    router.push('/login')
                }
            } catch (error) {
                console.error("Error fetching user data:", error)
                router.push('/login')
            } finally {
                setIsRedirecting(false)
            }

        }

        redirectBasedOnRole()
    }, [user, authLoading, router])

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-4 text-muted-foreground">Redirecting to appropriate dashboard...</p>
        </div>
    )
}