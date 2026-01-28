'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Next.js Client Error:', error)
    }, [error])

    const handleReset = () => {
        // Clear potentially corrupted storage
        try {
            localStorage.removeItem('user')
            localStorage.removeItem('app-storage') // zustand persist default key
        } catch (e) {
            console.error('Failed to clear storage', e)
        }
        reset()
        window.location.href = '/'
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
                <p className="text-gray-500 mb-6 text-sm">
                    {error.message || 'An unexpected error occurred.'}
                </p>
                <div className="bg-gray-100 p-3 rounded text-left text-xs font-mono text-gray-700 mb-6 overflow-auto max-h-32">
                    {error.stack}
                </div>
                <div className="flex gap-3 justify-center">
                    <Button onClick={handleReset} variant="destructive">
                        Reset App Data & Reload
                    </Button>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    )
}
