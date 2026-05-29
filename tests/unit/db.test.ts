import { beforeEach, describe, expect, it } from 'vitest'
import {
  authenticatorDB,
  holidayDB,
  subtaskDB,
  tagDB,
  templateDB,
  todoDB,
  userDB,
} from '@/lib/db'

// Each test gets fresh users (the in-memory DB is shared within this file), so
// per-user scoping keeps tests isolated.
let counter = 0
const freshUser = () => userDB.create(`user_${counter++}`)

const futureIso = (days: number) => new Date(Date.now() + days * 86400000).toISOString()
const pastIso = (days: number) => new Date(Date.now() - days * 86400000).toISOString()

describe('userDB + authenticatorDB', () => {
  it('creates and looks up users', () => {
    const u = userDB.create(`alice_${counter++}`)
    expect(u.id).toBeGreaterThan(0)
    expect(userDB.findById(u.id)?.username).toBe(u.username)
    expect(userDB.findByUsername(u.username)?.id).toBe(u.id)
    expect(userDB.authenticatorCount(u.id)).toBe(0)
  })

  it('stores and updates authenticators', () => {
    const u = freshUser()
    const auth = authenticatorDB.create({
      userId: u.id,
      credentialId: `cred_${counter++}`,
      publicKey: Buffer.from([1, 2, 3]),
      counter: 0,
      transports: ['internal'],
    })
    expect(userDB.authenticatorCount(u.id)).toBe(1)
    expect(authenticatorDB.findByCredentialId(auth.credential_id)?.user_id).toBe(u.id)
    expect(authenticatorDB.findByUserId(u.id)).toHaveLength(1)
    authenticatorDB.updateCounter(auth.credential_id, 5)
    expect(authenticatorDB.findByCredentialId(auth.credential_id)?.counter).toBe(5)
  })
})

describe('tagDB', () => {
  it('creates, finds (case-insensitive), updates and deletes', () => {
    const u = freshUser()
    const tag = tagDB.create(u.id, 'Work', '#3B82F6')
    expect(tagDB.findByName(u.id, 'work')?.id).toBe(tag.id) // case-insensitive
    expect(tagDB.findByUserId(u.id)).toHaveLength(1)
    const updated = tagDB.update(tag.id, u.id, { name: 'Office', color: '#EF4444' })
    expect(updated?.name).toBe('Office')
    expect(updated?.color).toBe('#EF4444')
    expect(tagDB.delete(tag.id, u.id)).toBe(true)
    expect(tagDB.findByUserId(u.id)).toHaveLength(0)
  })

  it('scopes tags to the owner', () => {
    const a = freshUser()
    const b = freshUser()
    const tagA = tagDB.create(a.id, 'a-tag', '#000000')
    expect(tagDB.findById(tagA.id, b.id)).toBeNull()
  })
})

describe('subtaskDB', () => {
  it('auto-increments position and resolves owner', () => {
    const u = freshUser()
    const todo = todoDB.create(u.id, { title: 'parent' })
    const s1 = subtaskDB.create(todo.id, 'one')
    const s2 = subtaskDB.create(todo.id, 'two')
    expect(s1.position).toBe(0)
    expect(s2.position).toBe(1)
    expect(subtaskDB.ownerUserId(s1.id)).toBe(u.id)
    const done = subtaskDB.update(s1.id, { completed: true })
    expect(done?.completed).toBe(true)
    expect(subtaskDB.delete(s2.id)).toBe(true)
    expect(subtaskDB.findByTodoId(todo.id)).toHaveLength(1)
  })
})

describe('todoDB', () => {
  it('creates with defaults and explicit fields', () => {
    const u = freshUser()
    const minimal = todoDB.create(u.id, { title: 'min' })
    expect(minimal.priority).toBe('medium')
    expect(minimal.completed).toBe(false)
    expect(minimal.progress).toEqual({ completed: 0, total: 0, percent: 0 })

    const full = todoDB.create(u.id, {
      title: 'full',
      priority: 'high',
      due_date: futureIso(2),
      reminder_minutes: 60,
      completed: true,
      completed_at: pastIso(1),
      created_at: pastIso(3),
    })
    expect(full.priority).toBe('high')
    expect(full.completed).toBe(true)
    expect(full.completed_at).toBe(pastIso(1))
    expect(full.created_at).toBe(pastIso(3))
  })

  it('computes progress from subtasks', () => {
    const u = freshUser()
    const todo = todoDB.create(u.id, { title: 'p' })
    subtaskDB.create(todo.id, 'a')
    const s2 = subtaskDB.create(todo.id, 'b')
    subtaskDB.update(s2.id, { completed: true })
    const fresh = todoDB.findById(todo.id, u.id)
    expect(fresh?.progress).toEqual({ completed: 1, total: 2, percent: 50 })
  })

  it('attaches only tags owned by the user (setTags)', () => {
    const a = freshUser()
    const b = freshUser()
    const tagA = tagDB.create(a.id, 'mine', '#111111')
    const tagB = tagDB.create(b.id, 'theirs', '#222222')
    const todo = todoDB.create(a.id, { title: 't' })
    const updated = todoDB.setTags(todo.id, a.id, [tagA.id, tagB.id])
    expect(updated?.tags.map((t) => t.id)).toEqual([tagA.id])
  })

  it('sets completed_at on completion and re-arms reminder on reschedule', () => {
    const u = freshUser()
    const todo = todoDB.create(u.id, { title: 'r', due_date: futureIso(1), reminder_minutes: 60 })
    todoDB.markNotificationSent(todo.id, new Date().toISOString())
    expect(todoDB.findById(todo.id, u.id)?.last_notification_sent).not.toBeNull()

    // Rescheduling to a new due date clears last_notification_sent.
    const rescheduled = todoDB.update(todo.id, u.id, { due_date: futureIso(5) })
    expect(rescheduled?.last_notification_sent).toBeNull()

    // Completing sets completed_at.
    const completed = todoDB.update(todo.id, u.id, { completed: true })
    expect(completed?.completed).toBe(true)
    expect(completed?.completed_at).not.toBeNull()
  })

  it('does NOT re-arm reminder when due date is unchanged (same instant)', () => {
    const u = freshUser()
    const due = futureIso(1)
    const todo = todoDB.create(u.id, { title: 'r2', due_date: due, reminder_minutes: 60 })
    todoDB.markNotificationSent(todo.id, new Date().toISOString())
    const updated = todoDB.update(todo.id, u.id, { title: 'r2-renamed', due_date: due })
    expect(updated?.last_notification_sent).not.toBeNull()
  })

  it('cascades delete to subtasks and tag links (tag itself survives)', () => {
    const u = freshUser()
    const tag = tagDB.create(u.id, 'keep', '#333333')
    const todo = todoDB.create(u.id, { title: 'del', tagIds: [tag.id] })
    subtaskDB.create(todo.id, 'child')
    expect(todoDB.delete(todo.id, u.id)).toBe(true)
    expect(subtaskDB.findByTodoId(todo.id)).toHaveLength(0)
    expect(tagDB.findById(tag.id, u.id)).not.toBeNull() // tag row survives
  })

  it('createNextInstance advances past now and inherits metadata', () => {
    const u = freshUser()
    const tag = tagDB.create(u.id, 'inherit', '#444444')
    const todo = todoDB.create(u.id, {
      title: 'standup',
      due_date: pastIso(3), // overdue
      priority: 'high',
      is_recurring: true,
      recurrence_pattern: 'daily',
      reminder_minutes: 30,
      tagIds: [tag.id],
    })
    const next = todoDB.createNextInstance(todo)
    expect(next).not.toBeNull()
    expect(next!.is_recurring).toBe(true)
    expect(next!.priority).toBe('high')
    expect(next!.reminder_minutes).toBe(30)
    expect(next!.tags.map((t) => t.id)).toEqual([tag.id])
    expect(new Date(next!.due_date!).getTime()).toBeGreaterThan(Date.now())
  })

  it('findReminderCandidates returns only un-notified, incomplete, due+reminder todos', () => {
    const u = freshUser()
    const yes = todoDB.create(u.id, { title: 'y', due_date: futureIso(1), reminder_minutes: 60 })
    todoDB.create(u.id, { title: 'no-reminder', due_date: futureIso(1) })
    const candidates = todoDB.findReminderCandidates(u.id)
    expect(candidates.map((c) => c.id)).toContain(yes.id)
    expect(candidates.every((c) => c.reminder_minutes != null && c.due_date)).toBe(true)
  })

  it('sorts incomplete-by-priority and places completed last', () => {
    const u = freshUser()
    todoDB.create(u.id, { title: 'low', priority: 'low' })
    todoDB.create(u.id, { title: 'high', priority: 'high' })
    const done = todoDB.create(u.id, { title: 'done', priority: 'high' })
    todoDB.update(done.id, u.id, { completed: true })
    const list = todoDB.findByUserId(u.id)
    expect(list[0].title).toBe('high')
    expect(list[list.length - 1].title).toBe('done')
  })
})

describe('templateDB', () => {
  it('creates and instantiates a template (todo + subtasks + due offset)', () => {
    const u = freshUser()
    const tpl = templateDB.create(u.id, {
      name: 'Sprint',
      title_template: 'Sprint planning',
      priority: 'high',
      due_date_offset_days: 7,
      subtasks: [
        { title: 'agenda', position: 0 },
        { title: 'invite', position: 1 },
      ],
    })
    expect(templateDB.findById(tpl.id, u.id)?.subtasks).toHaveLength(2)
    const todo = templateDB.use(tpl.id, u.id)
    expect(todo?.title).toBe('Sprint planning')
    expect(todo?.priority).toBe('high')
    expect(todo?.subtasks).toHaveLength(2)
    expect(todo?.due_date).not.toBeNull()
  })

  it('does not create a recurring todo from a template with no due-date offset', () => {
    const u = freshUser()
    const tpl = templateDB.create(u.id, {
      name: 'Bad recurring',
      title_template: 'Weekly review',
      is_recurring: true,
      recurrence_pattern: 'weekly',
      due_date_offset_days: null,
    })
    const todo = templateDB.use(tpl.id, u.id)
    expect(todo?.is_recurring).toBe(false) // guard: no due date -> not recurring
    expect(todo?.due_date).toBeNull()
  })

  it('updates and deletes templates', () => {
    const u = freshUser()
    const tpl = templateDB.create(u.id, { name: 'x', title_template: 'X' })
    const updated = templateDB.update(tpl.id, u.id, { name: 'y', title_template: 'Y' })
    expect(updated?.name).toBe('y')
    expect(templateDB.delete(tpl.id, u.id)).toBe(true)
    expect(templateDB.findById(tpl.id, u.id)).toBeNull()
  })
})

describe('holidayDB (auto-seeded on startup)', () => {
  it('is seeded with Singapore holidays', () => {
    expect(holidayDB.count()).toBeGreaterThanOrEqual(20)
  })

  it('finds holidays in a date range', () => {
    const dec = holidayDB.findInRange('2025-12-01', '2025-12-31')
    expect(dec.some((h) => h.date === '2025-12-25' && /Christmas/.test(h.name))).toBe(true)
  })

  it('upsert updates the name for an existing date', () => {
    holidayDB.upsert('2025-12-25', 'Christmas Day (updated)')
    const dec = holidayDB.findInRange('2025-12-25', '2025-12-25')
    expect(dec[0].name).toBe('Christmas Day (updated)')
  })
})
