'use client'

import type { TodoSections as Sections } from '@/lib/filtering'
import { TID } from '@/lib/testids'
import type { Todo } from '@/lib/types'
import { TodoItem } from './TodoItem'

export interface TodoItemHandlers {
  onToggle: (todo: Todo) => Promise<void>
  onEdit: (todo: Todo) => void
  onDelete: (id: number) => Promise<void>
  onTagClick: (tagId: number) => void
  onAddSubtask: (todoId: number, title: string) => Promise<void>
  onToggleSubtask: (todoId: number, subtaskId: number, completed: boolean) => Promise<void>
  onDeleteSubtask: (todoId: number, subtaskId: number) => Promise<void>
}

interface SectionProps {
  title: string
  count: number
  todos: Todo[]
  now: Date
  handlers: TodoItemHandlers
  sectionTestId: string
  countTestId: string
  accent?: string
}

function Section({
  title,
  count,
  todos,
  now,
  handlers,
  sectionTestId,
  countTestId,
  accent,
}: SectionProps) {
  if (todos.length === 0) return null
  return (
    <section data-testid={sectionTestId} className="mb-6">
      <h2 className={`mb-2 text-sm font-semibold uppercase tracking-wide ${accent ?? 'text-gray-600 dark:text-gray-400'}`}>
        {title} (<span data-testid={countTestId}>{count}</span>)
      </h2>
      <ul className="space-y-3">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} now={now} {...handlers} />
        ))}
      </ul>
    </section>
  )
}

interface TodoSectionsProps {
  sections: Sections
  now: Date
  handlers: TodoItemHandlers
}

export function TodoSectionsView({ sections, now, handlers }: TodoSectionsProps) {
  const empty =
    sections.overdue.length === 0 &&
    sections.pending.length === 0 &&
    sections.completed.length === 0

  if (empty) {
    return (
      <p
        data-testid={TID.emptyState}
        className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-400"
      >
        No todos to show. Add one above, or adjust your filters.
      </p>
    )
  }

  return (
    <div>
      <div className={sections.overdue.length > 0 ? 'rounded-xl bg-red-50 p-3 dark:bg-red-950/30' : ''}>
        <Section
          title="⚠️ Overdue"
          count={sections.overdue.length}
          todos={sections.overdue}
          now={now}
          handlers={handlers}
          sectionTestId={TID.overdueSection}
          countTestId={TID.overdueCount}
          accent="text-red-600 dark:text-red-400"
        />
      </div>
      <Section
        title="Pending"
        count={sections.pending.length}
        todos={sections.pending}
        now={now}
        handlers={handlers}
        sectionTestId={TID.pendingSection}
        countTestId={TID.pendingCount}
      />
      <Section
        title="Completed"
        count={sections.completed.length}
        todos={sections.completed}
        now={now}
        handlers={handlers}
        sectionTestId={TID.completedSection}
        countTestId={TID.completedCount}
      />
    </div>
  )
}
