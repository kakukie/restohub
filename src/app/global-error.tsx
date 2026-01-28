'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">Critical System Error</h2>
                    <p className="text-red-600 mb-4">{error.message}</p>
                    <button
                        className="bg-emerald-600 text-white px-4 py-2 rounded"
                        onClick={() => {
                            localStorage.clear()
                            window.location.href = '/'
                        }}
                    >
                        Hard Reset App
                    </button>
                </div>
            </body>
        </html>
    )
}
