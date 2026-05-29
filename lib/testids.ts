/**
 * Central registry of `data-testid` values. Components render these and tests
 * query them, so both sides share one source of truth and stay in sync.
 *
 * Static ids are plain strings. Per-entity ids are functions returning a string.
 */
export const TID = {
  // --- Auth / login ---
  authTabLogin: 'auth-tab-login',
  authTabRegister: 'auth-tab-register',
  authUsernameInput: 'auth-username-input',
  authSubmit: 'auth-submit',
  authError: 'auth-error',
  authStatus: 'auth-status',

  // --- Header / global actions ---
  headerUsername: 'header-username',
  logoutButton: 'logout-button',
  calendarLink: 'calendar-link',
  homeLink: 'home-link',
  enableNotificationsButton: 'enable-notifications-button',
  manageTagsButton: 'manage-tags-button',
  templatesButton: 'templates-button',
  exportJsonButton: 'export-json-button',
  exportCsvButton: 'export-csv-button',
  importButton: 'import-button',
  importInput: 'import-input',
  importStatus: 'import-status',

  // --- Todo form ---
  todoForm: 'todo-form',
  todoTitleInput: 'todo-title-input',
  todoPrioritySelect: 'todo-priority-select',
  todoDueInput: 'todo-due-input',
  todoRecurringCheckbox: 'todo-recurring-checkbox',
  todoRecurrenceSelect: 'todo-recurrence-select',
  todoReminderSelect: 'todo-reminder-select',
  todoAddButton: 'todo-add-button',
  saveTemplateButton: 'save-template-button',
  useTemplateSelect: 'use-template-select',
  formTagToggle: (tagId: number) => `form-tag-toggle-${tagId}`,

  // --- Search / filters ---
  searchInput: 'search-input',
  searchClear: 'search-clear',
  priorityFilter: 'priority-filter',
  tagFilter: 'tag-filter',
  advancedToggle: 'advanced-toggle',
  advancedPanel: 'advanced-panel',
  completionFilter: 'completion-filter',
  dateFromInput: 'date-from-input',
  dateToInput: 'date-to-input',
  clearFiltersButton: 'clear-filters-button',
  saveFilterButton: 'save-filter-button',
  presetPill: (name: string) => `preset-pill-${name}`,
  presetDelete: (name: string) => `preset-delete-${name}`,

  // --- Sections ---
  overdueSection: 'overdue-section',
  pendingSection: 'pending-section',
  completedSection: 'completed-section',
  overdueCount: 'overdue-count',
  pendingCount: 'pending-count',
  completedCount: 'completed-count',
  emptyState: 'empty-state',

  // --- Todo item ---
  todoItem: (id: number) => `todo-item-${id}`,
  todoCheckbox: (id: number) => `todo-checkbox-${id}`,
  todoTitle: (id: number) => `todo-title-${id}`,
  priorityBadge: (id: number) => `priority-badge-${id}`,
  recurrenceBadge: (id: number) => `recurrence-badge-${id}`,
  reminderBadge: (id: number) => `reminder-badge-${id}`,
  tagBadge: (todoId: number, tagId: number) => `tag-badge-${todoId}-${tagId}`,
  dueLabel: (id: number) => `due-label-${id}`,
  progressBar: (id: number) => `progress-bar-${id}`,
  progressText: (id: number) => `progress-text-${id}`,
  subtasksToggle: (id: number) => `subtasks-toggle-${id}`,
  editButton: (id: number) => `edit-button-${id}`,
  deleteButton: (id: number) => `delete-button-${id}`,

  // --- Subtasks ---
  subtaskList: (todoId: number) => `subtask-list-${todoId}`,
  subtaskInput: (todoId: number) => `subtask-input-${todoId}`,
  subtaskAdd: (todoId: number) => `subtask-add-${todoId}`,
  subtaskItem: (id: number) => `subtask-item-${id}`,
  subtaskCheckbox: (id: number) => `subtask-checkbox-${id}`,
  subtaskDelete: (id: number) => `subtask-delete-${id}`,

  // --- Edit modal ---
  editModal: 'edit-modal',
  editTitleInput: 'edit-title-input',
  editPrioritySelect: 'edit-priority-select',
  editDueInput: 'edit-due-input',
  editRecurringCheckbox: 'edit-recurring-checkbox',
  editRecurrenceSelect: 'edit-recurrence-select',
  editReminderSelect: 'edit-reminder-select',
  editTagToggle: (tagId: number) => `edit-tag-toggle-${tagId}`,
  editSave: 'edit-save',
  editCancel: 'edit-cancel',

  // --- Tag manager modal ---
  tagModal: 'tag-modal',
  tagNameInput: 'tag-name-input',
  tagColorInput: 'tag-color-input',
  tagCreateButton: 'tag-create-button',
  tagModalClose: 'tag-modal-close',
  tagRow: (id: number) => `tag-row-${id}`,
  tagEditButton: (id: number) => `tag-edit-button-${id}`,
  tagDeleteButton: (id: number) => `tag-delete-button-${id}`,
  tagUpdateButton: (id: number) => `tag-update-button-${id}`,
  tagModalError: 'tag-modal-error',

  // --- Template modals ---
  templateModal: 'template-modal',
  templateModalClose: 'template-modal-close',
  templateRow: (id: number) => `template-row-${id}`,
  templateUseButton: (id: number) => `template-use-button-${id}`,
  templateDeleteButton: (id: number) => `template-delete-button-${id}`,
  saveTemplateModal: 'save-template-modal',
  templateNameInput: 'template-name-input',
  templateDescInput: 'template-desc-input',
  templateCategoryInput: 'template-category-input',
  templateOffsetInput: 'template-offset-input',
  templateSaveButton: 'template-save-button',
  templateSaveCancel: 'template-save-cancel',
  templateCategoryFilter: 'template-category-filter',

  // --- Save filter modal ---
  saveFilterModal: 'save-filter-modal',
  filterNameInput: 'filter-name-input',
  filterSaveButton: 'filter-save-button',
  filterSaveCancel: 'filter-save-cancel',

  // --- Calendar ---
  calendarGrid: 'calendar-grid',
  calendarTitle: 'calendar-title',
  calendarPrev: 'calendar-prev',
  calendarNext: 'calendar-next',
  calendarToday: 'calendar-today',
  calendarDay: (dateKey: string) => `calendar-day-${dateKey}`,
  calendarDayCount: (dateKey: string) => `calendar-day-count-${dateKey}`,
  calendarHoliday: (dateKey: string) => `calendar-holiday-${dateKey}`,
  dayModal: 'day-modal',
  dayModalClose: 'day-modal-close',
} as const
