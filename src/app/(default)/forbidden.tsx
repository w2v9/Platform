import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Forbidden() {
    return (
        <div>
            <h2>Forbidden</h2>
            <p>You are not authorized to access this resource.</p>

            <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
                Go Back
            </Button>
        </div>
    )
}