/** Shared Tailwind class strings for consistent form controls and buttons. */
export const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'

export const selectCls = inputCls

export const labelCls = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

const btnBase =
  'inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50'

export const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700`
export const btnSecondary = `${btnBase} bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600`
export const btnDanger = `${btnBase} bg-red-600 text-white hover:bg-red-700`
export const btnSuccess = `${btnBase} bg-green-600 text-white hover:bg-green-700`
export const btnGhost = 'text-sm font-medium text-blue-600 hover:underline dark:text-blue-400'
export const btnGhostDanger = 'text-sm font-medium text-red-600 hover:underline dark:text-red-400'
