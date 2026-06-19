import { defineFunction } from '@aws-amplify/backend'

export const adminToggleSuspend = defineFunction({
  name: 'admin-toggle-suspend',
  entry: './handler.ts'
})
