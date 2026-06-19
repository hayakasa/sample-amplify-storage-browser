import type { Schema } from '../resource'
import { env } from "$amplify/env/admin-update-user"
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({})

export const handler: Schema['adminUpdateUser']['functionHandler'] = async (event) => {
  const { username, preferredUsername } = event.arguments
  const userPoolId = env.AMPLIFY_AUTH_USER_POOL_ID

  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: [
      { Name: 'preferred_username', Value: preferredUsername },
    ],
  })

  try {
    await client.send(command)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' }
  }
}