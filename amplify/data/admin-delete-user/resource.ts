import { defineFunction } from '@aws-amplify/backend'

export const adminDeleteUser = defineFunction({
  name: 'admin-delete-user',
  entry: './handler.ts'
})