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
import { Metadata } from "next"

const metadata: Metadata = {
    title: "Login - AzoozGAT Platform",
    description: "Login to your account to access the AzoozGAT Platform.",
}

const formSchema = z.object({
    email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email address" }),
    password: z.string().min(8).max(50),
})

export default function LoginPage() {
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        const promise = loginUser(values.email, values.password)
            .then((userCredential) => {
                toast.success("Login successful!");
                router.push("/dashboard");
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
            });

        toast.promise(promise, {
            loading: 'Logging in...',
            success: null,
            error: null,
        });
    }

    return (
        <section className="py-4 px-4 flex flex-col items-center justify-center min-h-[70vh] ">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md md:w-1/3 lg:w-1/3 mx-auto mt-10">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="mb-4">
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter your email" {...field} />
                                </FormControl>
                                <FormDescription>Enter your email.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="mb-4">
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Enter your password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full">Login</Button>
                </form>
            </Form>
        </section>
    )
}