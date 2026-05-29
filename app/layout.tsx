import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'Feature-rich todo app with recurring tasks, subtasks, tags, templates and a calendar — Singapore timezone.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 antialiased dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
        {children}
      </body>
    </html>
  )
}
