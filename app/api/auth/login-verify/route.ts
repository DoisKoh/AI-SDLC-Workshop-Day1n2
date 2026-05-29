import { type NextRequest } from 'next/server'
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server'
import { authenticatorDB } from '@/lib/db'
import { clearChallenge, createSession, getChallenge } from '@/lib/auth'
import { verifyAuthentication } from '@/lib/webauthn'
import { jsonError, jsonOk, safeHandler } from '@/lib/api-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return safeHandler(async () => {
    const body = (await request.json()) as { response?: AuthenticationResponseJSON }
    if (!body.response) return jsonError('Missing authentication response', 400)

    const challenge = await getChallenge()
    if (!challenge || challenge.type !== 'login') {
      return jsonError('No login in progress. Please start again.', 400)
    }

    const authenticator = authenticatorDB.findByCredentialId(body.response.id)
    if (!authenticator || authenticator.user_id !== challenge.userId) {
      return jsonError('Unrecognised passkey for this account.', 400)
    }

    const verification = await verifyAuthentication({
      response: body.response,
      expectedChallenge: challenge.challenge,
      credential: {
        id: authenticator.credential_id,
        publicKey: authenticator.credential_public_key,
        counter: authenticator.counter,
        transports: (authenticator.transports ?? undefined) as
          | AuthenticatorTransportFuture[]
          | undefined,
      },
    })

    if (!verification.verified) {
      return jsonError('Passkey authentication failed.', 400)
    }

    authenticatorDB.updateCounter(
      authenticator.credential_id,
      verification.authenticationInfo.newCounter,
    )

    await clearChallenge()
    await createSession({ userId: challenge.userId, username: challenge.username })

    return jsonOk({ userId: challenge.userId, username: challenge.username })
  })
}
