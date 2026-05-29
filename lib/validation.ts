import { z } from 'zod'
import { REMINDER_OPTIONS } from './db/types'

export const prioritySchema = z.enum(['high', 'medium', 'low'])
export const recurrenceSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly'])

export const reminderSchema = z
  .number()
  .int()
  .refine((v) => (REMINDER_OPTIONS as readonly number[]).includes(v), {
    message: 'Invalid reminder timing',
  })

const isoDateString = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: 'Invalid date',
})

const titleSchema = z.string().trim().min(1, 'Title is required').max(500, 'Title is too long')

const tagIdsSchema = z.array(z.number().int().positive())

/** Minimum lead time enforced on newly created due dates: 1 minute. */
const MIN_FUTURE_MS = 60 * 1000

export const createTodoSchema = z
  .object({
    title: titleSchema,
    due_date: isoDateString.nullable().optional(),
    priority: prioritySchema.optional(),
    is_recurring: z.boolean().optional(),
    recurrence_pattern: recurrenceSchema.nullable().optional(),
    reminder_minutes: reminderSchema.nullable().optional(),
    tagIds: tagIdsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_recurring) {
      if (!data.recurrence_pattern) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recurring todos require a recurrence pattern',
          path: ['recurrence_pattern'],
        })
      }
      if (!data.due_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recurring todos require a due date',
          path: ['due_date'],
        })
      }
    }
    if (data.reminder_minutes != null && !data.due_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reminders require a due date',
        path: ['reminder_minutes'],
      })
    }
    if (data.due_date) {
      const due = Date.parse(data.due_date)
      if (due < Date.now() + MIN_FUTURE_MS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Due date must be at least 1 minute in the future',
          path: ['due_date'],
        })
      }
    }
  })

export const updateTodoSchema = z
  .object({
    title: titleSchema.optional(),
    due_date: isoDateString.nullable().optional(),
    priority: prioritySchema.optional(),
    is_recurring: z.boolean().optional(),
    recurrence_pattern: recurrenceSchema.nullable().optional(),
    reminder_minutes: reminderSchema.nullable().optional(),
    completed: z.boolean().optional(),
    tagIds: tagIdsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_recurring && data.recurrence_pattern === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recurring todos require a recurrence pattern',
        path: ['recurrence_pattern'],
      })
    }
  })

export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a 6-digit hex value like #3B82F6')

export const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(50, 'Tag name is too long'),
  color: colorSchema.optional(),
})

export const updateTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(50, 'Tag name is too long').optional(),
  color: colorSchema.optional(),
})

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, 'Subtask title is required').max(500, 'Subtask title is too long'),
})

export const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  completed: z.boolean().optional(),
})

const templateSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  position: z.number().int().nonnegative(),
})

export const createTemplateSchema = z
  .object({
    name: z.string().trim().min(1, 'Template name is required').max(100),
    description: z.string().trim().max(1000).nullable().optional(),
    category: z.string().trim().max(50).nullable().optional(),
    title_template: titleSchema,
    priority: prioritySchema.optional(),
    is_recurring: z.boolean().optional(),
    recurrence_pattern: recurrenceSchema.nullable().optional(),
    reminder_minutes: reminderSchema.nullable().optional(),
    due_date_offset_days: z.number().int().min(0).max(3650).nullable().optional(),
    subtasks: z.array(templateSubtaskSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_recurring) {
      if (!data.recurrence_pattern) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recurring templates require a recurrence pattern',
          path: ['recurrence_pattern'],
        })
      }
      // A recurring template needs a due-date offset so the created todo has a
      // due date — otherwise its recurrence could never spawn the next instance.
      if (data.due_date_offset_days == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recurring templates require a "due in N days" value',
          path: ['due_date_offset_days'],
        })
      }
    }
  })

// --- Import format (lenient: accepts our own export shape) ---

const importSubtaskSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean().optional(),
  position: z.number().int().optional(),
})

const importTodoSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean().optional(),
  // Validate dates so a corrupt import can't persist an unparseable due_date
  // (which would silently disable that todo's reminder).
  due_date: isoDateString.nullable().optional(),
  priority: prioritySchema.optional(),
  is_recurring: z.boolean().optional(),
  recurrence_pattern: recurrenceSchema.nullable().optional(),
  reminder_minutes: z.number().int().nullable().optional(),
  completed_at: isoDateString.nullable().optional(),
  created_at: isoDateString.optional(),
  subtasks: z.array(importSubtaskSchema).optional(),
  tags: z.array(z.string()).optional(),
})

const importTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
})

export const importSchema = z.object({
  version: z.number().optional(),
  exported_at: z.string().optional(),
  tags: z.array(importTagSchema).optional(),
  todos: z.array(importTodoSchema),
})

export type ImportPayload = z.infer<typeof importSchema>
export type ImportTodo = z.infer<typeof importTodoSchema>
