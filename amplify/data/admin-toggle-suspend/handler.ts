import { 
  CognitoIdentityProviderClient, 
  AdminDisableUserCommand, 
  AdminEnableUserCommand,
  AdminGetUserCommand
} from '@aws-sdk/client-cognito-identity-provider'
import type { Schema } from '../resource'
import { env } from '$amplify/env/admin-toggle-suspend'

const client = new CognitoIdentityProviderClient({})

export const handler: Schema['adminToggleSuspend']['functionHandler'] = async (event) => {
  const { username } = event.arguments
  const userPoolId = env.AMPLIFY_AUTH_USER_POOL_ID
  const requesterUsername = (event.identity as any)?.username

  try {
    if (username === requesterUsername) {
      return { 
        success: false, 
        error: '自分自身のアカウントを無効化（サスペンド）することはできません。' 
      }
    }

    // 1. 現在のユーザーの状態（Enabledかどうか）を取得
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    })
    const userResult = await client.send(getUserCommand)
    const currentEnabled = userResult.Enabled; // true または false

    // 2. 状態を反転させる
    if (currentEnabled) {
      // 現在有効なら、無効化（サスペンド）する
      const disableCommand = new AdminDisableUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      })
      await client.send(disableCommand)
    } else {
      // 現在無効なら、有効化（解除）する
      const enableCommand = new AdminEnableUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      });
      await client.send(enableCommand)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' }
  }
}
