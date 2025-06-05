'use client'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { loginUser } from "@/lib/db_user"
import { useAuth } from "@/lib/context/authContext"
import { useEffect, useState } from "react"

const formSchema = z.object({
    email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email address" }),
    password: z.string().min(8).max(50),
})

export default function LoginPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (user) {
            router.push("/dashboard")
        }

    }, [user, router])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)

        const promise = loginUser(values.email, values.password)
            .then((response) => {
                if (response.statusMessage === "banned") {
                    toast.error(response.message);
                } else {
                    if (response.statusMessage === "warned") {
                        toast.warning(response.message);
                    } else if (response.statusMessage === "activated") {
                        toast.info(response.message);
                    } else if (response.statusMessage === "new_account") {
                        toast.info(response.message);
                    }
                    toast.success("Login successful!");
                }
            })
            .catch((error) => {
                switch (error.code) {
                    case 'auth/user-not-found':
                        toast.error('No user found with this email.')
                        break;
                    case 'auth/wrong-password':
                        toast.error('Incorrect password. Please try again.')
                        break;
                    case 'auth/invalid-email':
                        toast.error('Invalid email address format.')
                        break;
                    case 'auth/too-many-requests':
                        toast.error('Too many requests. Please try again later.')
                        break;
                    default:
                        toast.error("Sign-in error: " + error.message);
                }
            })
            .finally(() => {
                setIsSubmitting(false)
            });

        toast.promise(promise, {
            loading: 'Logging in...',
            success: null,
            error: null,
        });
    } return (
        <section className="py-4 px-4 flex flex-col items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-md mx-auto bg-card border rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
                <h1 className="text-2xl font-bold text-center mb-6">Login to AzoozGAT</h1>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your email" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-xs">Enter your email address.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter your password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </Form>
            </div>
        </section>
    )
}