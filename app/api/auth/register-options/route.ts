import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { authenticatorDB, userDB } from '@/lib/db'
import { setChallenge } from '@/lib/auth'
import { createRegistrationOptions } from '@/lib/webauthn'
import { jsonError, jsonOk, safeHandler } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .max(50, 'Username is too long')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, . _ -'),
})

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const { username } = schema.parse(await request.json())

    const existing = userDB.findByUsername(username)
    if (existing && userDB.authenticatorCount(existing.id) > 0) {
      return jsonError('That username is already registered. Try logging in instead.', 409)
    }

    const user = existing ?? userDB.create(username)
    const existingCredentialIds = authenticatorDB
      .findByUserId(user.id)
      .map((a) => a.credential_id)

    const options = await createRegistrationOptions({
      userId: user.id,
      username,
      existingCredentialIds,
    })

    await setChallenge({
      challenge: options.challenge,
      userId: user.id,
      username,
      type: 'register',
    })

    return jsonOk(options)
  })
}
