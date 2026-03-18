import type { ClientSchema } from "@aws-amplify/backend"
import { a, defineData } from "@aws-amplify/backend"
import { addUserToGroup } from "./resource"

const schema = a.schema({
  addUserToGroup: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      groupName: a.string.required(),
    })
    .authorization((allow) => [allow.group("admin")])
  .handler(a.handler.function(addUserToGroup))
  .returns(a.json())
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam"
  },
})