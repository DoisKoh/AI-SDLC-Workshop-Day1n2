import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">404 — Page not found</h1>
      <p className="text-gray-500 dark:text-gray-400">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Back to Todos
      </Link>
    </main>
  )
}
