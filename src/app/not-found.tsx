import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className='flex w-full flex-col items-center justify-center gap-4 bg-background py-8 px-4'>
            <h2 className='text-4xl font-bold'>Not Found</h2>
            <p>Could not find requested resource</p>
            <Button variant={"default"} asChild>
                <Link href="/">Return Home</Link>
            </Button>
        </div>
    )
}