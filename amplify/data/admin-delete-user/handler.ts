import { 
  CognitoIdentityProviderClient, 
  AdminListGroupsForUserCommand, 
  AdminDeleteUserCommand 
} from '@aws-sdk/client-cognito-identity-provider'
import type { Schema } from '../../data/resource'
import { env } from '$amplify/env/admin-delete-user'

const client = new CognitoIdentityProviderClient({})

export const handler: Schema['adminDeleteUser']['functionHandler'] = async (event) => {
  const { username } = event.arguments
  const userPoolId = env.AMPLIFY_AUTH_USER_POOL_ID
  const requesterUsername = (event.identity as any)?.username

  try {
    if (username === requesterUsername) {
      return { 
        success: false, 
        error: '自分自身のアカウントを削除することはできません。' 
      }
    }
    
    // 1. 対象ユーザーの所属グループをチェック
    const groupsCommand = new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    })
    const groupsResult = await client.send(groupsCommand)
    const groupNames = groupsResult.Groups?.map(g => g.GroupName) || []

    // 2. ADMINS グループに所属している場合はエラーを返す
    if (groupNames.includes('ADMINS')) {
      return { 
        success: false, 
        error: '管理者権限（ADMINSグループ）を持つユーザーを削除することはできません。' 
      }
    }

    // 3. 一般ユーザーであれば削除を実行
    const deleteCommand = new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    })
    await client.send(deleteCommand)

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' }
  }
}
