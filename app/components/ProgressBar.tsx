'use client'

import { TID } from '@/lib/testids'
import type { Progress } from '@/lib/types'

export function ProgressBar({ todoId, progress }: { todoId: number; progress: Progress }) {
  if (progress.total === 0) return null
  const complete = progress.percent === 100
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span data-testid={TID.progressText(todoId)}>
          {progress.completed}/{progress.total} subtasks
        </span>
        <span>{progress.percent}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid={TID.progressBar(todoId)}
      >
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  )
}
