import type { ClientSchema } from "@aws-amplify/backend"
import { a, defineData } from "@aws-amplify/backend"
import { listUsers } from "./list-users/resource"
import { adminCreateUser } from "./admin-create-user/resource"
import { adminDeleteUser } from "./admin-delete-user/resource"
import { adminUpdateUser } from "./admin-update-user/resource"
import { adminToggleSuspend } from './admin-toggle-suspend/resource'

const schema = a.schema({
  // ユーザー管理
  CognitoUserAttribute: a.customType({
    Name: a.string().required(),
    Value: a.string()
  }),
  CognitoUser: a.customType({
    Username: a.string(),
    Attributes: a.ref("CognitoUserAttribute").array(),
    UserCreateDate: a.string(),
    UserLastModifiedDate: a.string(),
    Enabled: a.boolean(),
    UserStatus: a.string(),
    MFAOptions: a.json(),
    Groups: a.string().array(),
  }),
  CognitoMetadata: a.customType({
    httpStatusCode: a.integer(),
    requestId: a.string(),
    attempts: a.integer(),
    totalRetryDelay: a.integer(),
  }),
  ListUsersResult: a.customType({
    success: a.boolean(),
    error: a.string(),
    Users: a.ref("CognitoUser").array(),
  }),

  listUsers: a
    .query()
    .arguments({
      userId: a.string(),
      groupName: a.string(),
    })
    .authorization((allow) => [allow.group("ADMINS")])
    .handler(a.handler.function(listUsers))
    .returns(a.ref("ListUsersResult")),


  result: a.customType({
    success: a.boolean().required(),
    error: a.string(),
  }),

  adminCreateUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      preferredUsername: a.string().required(),
    })
    .authorization((allow) => [allow.group("ADMINS")])
    .handler(a.handler.function(adminCreateUser))
    .returns(a.ref('result')),
  adminUpdateUser: a
    .mutation()
    .arguments({
      username: a.string().required(),
      preferredUsername: a.string().required(),
    })
    .authorization((allow) => [allow.group("ADMINS")])
    .handler(a.handler.function(adminUpdateUser))
    .returns(a.ref('result')),
  adminDeleteUser: a
    .mutation()
    .arguments({
      username: a.string().required(),
    })
    .returns(a.ref('result'))
    .authorization((allow) => [allow.group("ADMINS")])
    .handler(a.handler.function(adminDeleteUser)),

    adminToggleSuspend: a
    .mutation()
    .arguments({
      username: a.string().required(),
    })
    .returns(a.ref('result'))
    .authorization((allow) => [allow.group("ADMINS")])
    .handler(a.handler.function(adminToggleSuspend)),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam",
  },
})