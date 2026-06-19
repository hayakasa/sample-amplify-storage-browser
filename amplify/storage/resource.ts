import { defineStorage } from '@aws-amplify/backend'
import { Duration } from 'aws-cdk-lib'
import { LifecycleRule, StorageClass } from 'aws-cdk-lib/aws-s3'
import type { IBucket } from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

export const storage = defineStorage({
  name: 'myStorageBucket',
  isDefault: true,
  access: (allow) => ({
    'public/*': [
      allow.groups(['ADMINS']).to(['read', 'write', 'delete']),
      allow.authenticated.to(['read'])
    ],
  }),
})