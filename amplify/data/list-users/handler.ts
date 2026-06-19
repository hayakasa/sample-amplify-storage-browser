import type { Schema } from "../resource"
import { env } from "$amplify/env/list-users"
import {
  ListUsersCommand,
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
} from "@aws-sdk/client-cognito-identity-provider"

type Handler = Schema["listUsers"]["functionHandler"]
const client = new CognitoIdentityProviderClient()

export const handler: Handler = async (event) => {
  const { userId, groupName } = event.arguments
  const userPoolId = env.AMPLIFY_AUTH_USER_POOL_ID
  const listCommand = new ListUsersCommand({
    UserPoolId: userPoolId,
  })
  const listResult = await client.send(listCommand)

  const cognitoUsers = listResult.Users || []

  const usersWithGroups = await Promise.all(
    cognitoUsers.map(async (user) => {
      const username = user.Username || ''

      const groupsCommand = new AdminListGroupsForUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      })
      const groupsResult = await client.send(groupsCommand)
      const groupNames: string[] = groupsResult.Groups
        ?.map((g) => g.GroupName)
        .filter((name): name is string => Boolean(name)) || []

      return {
        Username: username,
        Attributes: user.Attributes?.map((attr) => ({
          Name: attr.Name || "",
          Value: attr.Value || "",
        })) || [],
        UserCreateDate: user.UserCreateDate?.toISOString() || "",
        UserLastModifiedDate: user.UserLastModifiedDate?.toISOString() || "",
        Enabled: user.Enabled || false,
        UserStatus: user.UserStatus || "",
        Groups: groupNames || [],
      }
    })
  )

  return { Users: usersWithGroups }
}