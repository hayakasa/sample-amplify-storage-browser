import type { Schema } from '../resource'
import { env } from "$amplify/env/admin-create-user"
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand
} from '@aws-sdk/client-cognito-identity-provider'

type Handler = Schema["adminCreateUser"]["functionHandler"]
const client = new CognitoIdentityProviderClient()

export const handler: Handler = async (event) => {
  const { email, preferredUsername } = event.arguments
  const command = new AdminCreateUserCommand({
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'preferred_username', Value: preferredUsername },
    ],
    UserPoolId: env.AMPLIFY_AUTH_USER_POOL_ID,
    DesiredDeliveryMediums: ['EMAIL'], // ユーザーに招待メールを送信
  })

  try {
    const response = await client.send(command)
    return {
      success: true,
      username: response.User?.Username || '',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}
