import { defineBackend } from '@aws-amplify/backend'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { auth } from './auth/resource'
import { data } from './data/resource'

import { storage } from './storage/resource'
import { adminCreateUser } from './data/admin-create-user/resource'
import { adminUpdateUser } from './data/admin-update-user/resource'
import { listUsers } from './data/list-users/resource'
import { adminDeleteUser } from './data/admin-delete-user/resource'
import { adminToggleSuspend } from './data/admin-toggle-suspend/resource'


/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  listUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminToggleSuspend,
})

// Lambda関数にCognito操作権限を付与
const authenticatedUserRole = backend.auth.resources.authenticatedUserIamRole
const userPool = backend.auth.resources.userPool

backend.listUsers.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'cognito-idp:AdminListGroupsForUser',
      'cognito-idp:ListUsers',
    ],
    resources: [userPool.userPoolArn],
  })
)
backend.listUsers.addEnvironment('AMPLIFY_AUTH_USER_POOL_ID', userPool.userPoolId)

backend.adminCreateUser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['cognito-idp:AdminCreateUser'],
    resources: [userPool.userPoolArn],
  })
)
backend.adminCreateUser.addEnvironment('AMPLIFY_AUTH_USER_POOL_ID', userPool.userPoolId)

backend.adminUpdateUser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['cognito-idp:AdminUpdateUserAttributes'],
    resources: [userPool.userPoolArn],
  })
)
backend.adminUpdateUser.addEnvironment('AMPLIFY_AUTH_USER_POOL_ID', userPool.userPoolId)

backend.adminDeleteUser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'cognito-idp:AdminListGroupsForUser',
      'cognito-idp:AdminDeleteUser',
    ],
    resources: [userPool.userPoolArn],
  })
)
backend.adminDeleteUser.addEnvironment('AMPLIFY_AUTH_USER_POOL_ID', userPool.userPoolId)

backend.adminToggleSuspend.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'cognito-idp:AdminGetUser',
      'cognito-idp:AdminDisableUser',
      'cognito-idp:AdminEnableUser',
    ],
    resources: [userPool.userPoolArn],
  })
)
backend.adminToggleSuspend.addEnvironment('AMPLIFY_AUTH_USER_POOL_ID', userPool.userPoolId)

// Bucker内のオブジェクトを保持する期間を設定（7日間、バックアップなし）
const s3Bucket = backend.storage.resources.bucket
const cfnBucket = s3Bucket.node.defaultChild as s3.CfnBucket

cfnBucket.lifecycleConfiguration = {
  rules: [
    {
      // 1. Amplifyデフォルト設定：中断されたアップロードの自動削除（7日間）
      id: 'DeleteIncompleteMultipartUploads',
      status: 'Enabled',
      abortIncompleteMultipartUpload: {
        daysAfterInitiation: 7,
      },
    },
    {
      // 2. メイン設定：7日経ったらファイルを削除（フォルダは保持）
      id: 'DeleteFilesAfter7DaysKeepFolders',
      status: 'Enabled',
      objectSizeGreaterThan: 0, // 0バイトより大きいオブジェクト（ファイル）のみ対象、空フォルダは保護
      expirationInDays: 7,       // 7日経ったら削除
      
      // バックアップ（過去バージョン）を保持しない設定
      // ファイルが上書き・削除された際、その古いバージョン（非現行バージョン）を1日（最短）で完全に削除
      noncurrentVersionExpiration: {
        noncurrentDays: 1,
      },
    },
  ],
}
