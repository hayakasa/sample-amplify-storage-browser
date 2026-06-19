import { defineFunction } from '@aws-amplify/backend'

export const adminUpdateUser = defineFunction({
  name: 'admin-update-user',
  entry: './handler.ts'
})