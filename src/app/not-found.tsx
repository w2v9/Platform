'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, ArrowLeft, Home, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="mx-auto max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                        <FileQuestion className="h-10 w-10 text-blue-600" />
                    </div>
                    <CardTitle className="mt-6 text-2xl font-bold">Page Not Found</CardTitle>
                    <CardDescription className="mt-1 text-muted-foreground">
                        Error 404: The requested resource could not be found
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Alert className="mb-4">
                        <Search className="h-4 w-4" />
                        <AlertTitle>We couldn&apos;t find that page</AlertTitle>
                        <AlertDescription>
                            The page you&apos;re looking for doesn&apos;t exist or has been moved to another location.
                        </AlertDescription>
                    </Alert>

                    <p className="text-center text-sm text-muted-foreground">
                        You might have typed the address incorrectly or the page may have been moved.
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>

                    <Button
                        className="w-full sm:w-auto"
                        asChild
                    >
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Return to Home
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}