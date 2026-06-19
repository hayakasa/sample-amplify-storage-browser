import { defineFunction } from '@aws-amplify/backend'

export const adminCreateUser = defineFunction({
  name: 'admin-create-user',
  entry: './handler.ts'
})