import { type NextRequest } from 'next/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import { authenticatorDB } from '@/lib/db'
import { clearChallenge, createSession, getChallenge } from '@/lib/auth'
import { verifyRegistration } from '@/lib/webauthn'
import { jsonError, jsonOk, safeHandler } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const body = (await request.json()) as { response?: RegistrationResponseJSON }
    if (!body.response) return jsonError('Missing registration response', 400)

    const challenge = await getChallenge()
    if (!challenge || challenge.type !== 'register') {
      return jsonError('No registration in progress. Please start again.', 400)
    }

    const verification = await verifyRegistration({
      response: body.response,
      expectedChallenge: challenge.challenge,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return jsonError('Passkey registration could not be verified.', 400)
    }

    const cred = verification.registrationInfo.credential
    authenticatorDB.create({
      userId: challenge.userId,
      credentialId: cred.id,
      publicKey: Buffer.from(cred.publicKey),
      counter: cred.counter ?? 0,
      transports: body.response.response.transports ?? cred.transports ?? null,
    })

    await clearChallenge()
    await createSession({ userId: challenge.userId, username: challenge.username })

    return jsonOk({ userId: challenge.userId, username: challenge.username })
  })
}
