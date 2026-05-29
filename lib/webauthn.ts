/**
 * Thin wrappers around @simplewebauthn/server (v13) with our relying-party
 * config injected. Server-only — used by the auth API routes.
 */
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server'
import { rpConfig } from './session'

export async function createRegistrationOptions(params: {
  userId: number
  username: string
  existingCredentialIds: string[]
}): Promise<PublicKeyCredentialCreationOptionsJSON> {
  return generateRegistrationOptions({
    rpName: rpConfig.rpName,
    rpID: rpConfig.rpID,
    userName: params.username,
    userID: new TextEncoder().encode(String(params.userId)),
    attestationType: 'none',
    excludeCredentials: params.existingCredentialIds.map((id) => ({ id })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })
}

export async function verifyRegistration(params: {
  response: RegistrationResponseJSON
  expectedChallenge: string
}): Promise<VerifiedRegistrationResponse> {
  return verifyRegistrationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: rpConfig.origin,
    expectedRPID: rpConfig.rpID,
    requireUserVerification: false,
  })
}

export async function createAuthenticationOptions(params: {
  allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[]
}): Promise<PublicKeyCredentialRequestOptionsJSON> {
  return generateAuthenticationOptions({
    rpID: rpConfig.rpID,
    allowCredentials: params.allowCredentials,
    userVerification: 'preferred',
  })
}

export async function verifyAuthentication(params: {
  response: AuthenticationResponseJSON
  expectedChallenge: string
  credential: {
    id: string
    publicKey: Uint8Array
    counter: number
    transports?: AuthenticatorTransportFuture[]
  }
}): Promise<VerifiedAuthenticationResponse> {
  return verifyAuthenticationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: rpConfig.origin,
    expectedRPID: rpConfig.rpID,
    credential: {
      ...params.credential,
      // Copy into a fresh ArrayBuffer-backed view to satisfy the library's
      // Uint8Array<ArrayBuffer> type (DB returns a Buffer = ArrayBufferLike).
      publicKey: new Uint8Array(params.credential.publicKey),
    },
    requireUserVerification: false,
  })
}
