'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function Forbidden() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="mx-auto max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                        <ShieldAlert className="h-10 w-10 text-red-600" />
                    </div>
                    <CardTitle className="mt-6 text-2xl font-bold">Access Denied</CardTitle>
                    <CardDescription className="mt-1 text-muted-foreground">
                        Error 403: Forbidden
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Authorization Required</AlertTitle>
                        <AlertDescription>
                            You don&apos;t have permission to access this resource. If you believe this is an error, please contact an administrator.
                        </AlertDescription>
                    </Alert>

                    <p className="text-center text-sm text-muted-foreground">
                        Please check that you have the correct permissions or navigate to a different area of the site.
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