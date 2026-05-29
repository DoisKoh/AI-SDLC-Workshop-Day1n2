/**
 * Client-safe re-export of domain types. Importing from here (instead of
 * `@/lib/db`) guarantees no server-only / native modules leak into the client
 * bundle.
 */
export * from './db/types'
