import { type NextRequest } from 'next/server'
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { z } from 'zod'
import { authenticatorDB, userDB } from '@/lib/db'
import { setChallenge } from '@/lib/auth'
import { createAuthenticationOptions } from '@/lib/webauthn'
import { jsonError, jsonOk, safeHandler } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(50),
})

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const { username } = schema.parse(await request.json())

    const user = userDB.findByUsername(username)
    const authenticators = user ? authenticatorDB.findByUserId(user.id) : []
    if (!user || authenticators.length === 0) {
      return jsonError('No passkey found for that username. Please register first.', 404)
    }

    const options = await createAuthenticationOptions({
      allowCredentials: authenticators.map((a) => ({
        id: a.credential_id,
        transports: (a.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
      })),
    })

    await setChallenge({
      challenge: options.challenge,
      userId: user.id,
      username: user.username,
      type: 'login',
    })

    return jsonOk(options)
  })
}
