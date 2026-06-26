import { useState, useEffect } from 'react'
import type { Schema } from "../../amplify/data/resource"
import { generateClient } from "aws-amplify/data" 
import config from '../../amplify_outputs.json'
import { Amplify } from 'aws-amplify'
import { getCurrentUser } from "aws-amplify/auth"
import { 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Badge, 
  Text, 
  Flex, 
  SearchField,
  View
} from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

Amplify.configure(config)

const client = generateClient<Schema>({authMode: "userPool"})
type CognitoUser = Schema['CognitoUser']['type']

function ListUsers() {
  const [users, setUsers] = useState<CognitoUser[]>([])
  const [currentUserName, setCurrentUserName] = useState<string>('')
  
  const [searchQuery, setSearchQuery] = useState('')

  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'add' | 'edit'>('add')

  const [targetUserName, setTargetUserName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [preferredName, setPreferredName] = useState<string>('')

  const openAddUserModal = () => {
    setMode('add')
    setTargetUserName('')
    setEmail('')
    setPreferredName('')
    setIsOpen(true)
  }

  const openEditUserModal = (user: CognitoUser) => {
    setMode('edit')
    setTargetUserName(user.Username || '')
    setEmail(user.Attributes?.find(attr => attr?.Name === 'email')?.Value || '')
    setPreferredName(user.Attributes?.find(attr => attr?.Name === 'preferred_username')?.Value || '')
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mode === 'add') {
      const { data: result, errors } = await client.mutations.adminCreateUser({
        email,
        preferredUsername: preferredName,
      })

      if (errors) {
        console.error("GraphQL errors:", errors) // エラーがある場合はログに出力
      } else if (result?.success) {
        alert('ユーザーを招待しました')
        setIsOpen(false)
        // 招待後にユーザー一覧をリフレッシュ
        const response = await client.queries.listUsers({}, {authMode: "userPool"})
        const data = response.data as {Users?: CognitoUser[]}
        const userList = data?.Users || [] 
        setUsers(userList)                    
      } else {
        // alert('ユーザーの招待に失敗しました')
        alert(`エラー: ${result?.error}`)
      }
    } else {
      const { data: result, errors } = await client.mutations.adminUpdateUser({
        username: targetUserName,
        preferredUsername: preferredName,
      })

      console.log("Update result:", result) // デバッグ用ログ
      if (errors) {
        console.error("GraphQL errors:", errors) // エラーがある場合はログに出力
      } else if (result?.success) {
        alert('ユーザー情報を更新しました')
        setIsOpen(false)
        // 更新後にユーザー一覧をリフレッシュ
        const response = await client.queries.listUsers({}, {authMode: "userPool"})
        const data = response.data as {Users?: CognitoUser[]}
        const userList = data?.Users || [] 
        setUsers(userList)
      } else {
        // alert('ユーザー情報の更新に失敗しました')
        alert(`エラー: ${result?.error}`)
      }
    }
  }

  const handleDeleteUser = async (username: string, email: string) => {
    const confirmDelete = window.confirm(`本当にユーザー ${email} を削除しますか？`)
    if (!confirmDelete) return

    const { data: result, errors } = await client.mutations.adminDeleteUser({
      username: username
    })

    if (errors) {
      console.error("GraphQL errors:", errors) // エラーがある場合はログに出力
    } else if (result?.success) {
      alert('ユーザーを削除しました')
      const response = await client.queries.listUsers({}, {authMode: "userPool"})
      const data = response.data as {Users?: CognitoUser[]}
      const userList = data?.Users || [] 
      setUsers(userList)
    } else {
      // Lambdaから返ってきた「管理者権限は削除できません」等のエラーを表示
      alert(`エラー: ${result?.error}`)
    }
  }

  const handleToggleSuspend = async (username: string, email: string) => {

    const currentUser = users.find(u => u.Username === username)
    const currentEnabled = currentUser?.Enabled ?? true
    console.log(`Toggling suspend for user: ${username}, currentEnabled: ${currentEnabled}`) // デバッグ用ログ

    const actionText = currentEnabled ? '無効化' : '有効化'
    const confirmAction = window.confirm(`ユーザー ${email} を${actionText}しますか？`)
    if (!confirmAction) return

    const { data: result, errors } = await client.mutations.adminToggleSuspend({
      username: username
    })

    if (errors) {
      console.error("GraphQL errors:", errors) // エラーがある場合はログに出力
    } else if (result?.success) {
      alert(`ユーザー ${email} を${actionText}しました`)
      const response = await client.queries.listUsers({}, {authMode: "userPool"})
      const data = response.data as {Users?: CognitoUser[]}
      const userList = data?.Users || [] 
      setUsers(userList)

    } else {
      // Lambdaから返ってきたエラーを表示
      alert(`エラー: ${result?.error}`)
    }
  }

  const getAttributeValue = (user: CognitoUser, attrName: string): string => {
    const attr = user.Attributes?.find(a => a?.Name === attrName)
    return attr?.Value || 'N/A'
  }

  useEffect(() => {
      const fetchCurrentUser = async () => {
        try {
          const user = await getCurrentUser()
          console.log("Current user:", user) // デバッグ用ログ
          setCurrentUserName(user.username)
        } catch (error) {
          console.error("Error fetching current user:", error) // エラーがある場合はログに出力
        }
      }
      fetchCurrentUser()

      const fetchUsers = async () => {
          const response = await client.queries.listUsers({}, {authMode: "userPool"})
          const data = response.data as {Users?: CognitoUser[]}
          const userList = data?.Users || [] 
          setUsers(userList)
      }
      fetchUsers()

  }, [])

  // 💡 検索バー用の簡易フィルタリング
  const filteredUsers = users.filter(user => {
    const email = getAttributeValue(user, 'email').toLowerCase()
    const username = user.Username?.toLowerCase() || ''
    return email.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase())
  })

  
  return (
    <div>
      <h2>ユーザー一覧</h2>
      <button onClick={openAddUserModal} style={{ marginBottom: '15px', padding: '8px 16px' }}>
        + 新規ユーザーを追加
      </button>
      <View 
        backgroundColor="var(--amplify-colors-background-primary)" 
        borderRadius="6px" 
        boxShadow="0px 2px 4px rgba(0,0,0,0.05)"
        overflow="auto"
      >
        {/* 💡 StorageBrowserの上部にある検索バーを再現 */}
        <Flex marginBottom="1.5rem" justifyContent="space-between" alignItems="center">
          <SearchField
            label="ユーザー検索"
            placeholder="ユーザー名、またはメールアドレスで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            hasSearchButton={false}
            width="100%"
            maxWidth="400px"
            backgroundColor="var(--amplify-colors-background-primary)"
          />
          <Text variation="secondary">{filteredUsers.length} 件のアイテム</Text>
        </Flex>
        <Table highlightOnHover variation="striped">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>ユーザー名</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>権限</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>メールアドレス</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>ステータス</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>作成日時</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>操作</TableCell>
            </TableRow>
          </TableHead>
            
          <TableBody>
            {filteredUsers.map((user) => {
              const name = getAttributeValue(user, 'preferred_username') || user.Username || 'N/A'
              const email = getAttributeValue(user, 'email')
              const isConfirmed = user.UserStatus === 'CONFIRMED'
              const isAdmin = user.Groups?.includes('ADMINS') || false
              const isMe = user.Username === currentUserName // 現在のユーザーと比較

              // 日付を見やすく整形
              const formattedDate = user.UserCreateDate 
                ? new Date(user.UserCreateDate).toLocaleString('ja-JP') 
                : 'N/A'

              return (
                <TableRow key={user.Username}>
                  {/* ユーザー名 (ファイル名のように強調) */}
                  <TableCell style={{ fontWeight: 500, color: 'var(--amplify-colors-font-primary)' }}>
                    {name}
                  </TableCell>

                  <TableCell>{isAdmin ? '管理者' : '一般ユーザー'}</TableCell>
                  {/* メールアドレス */}
                  <TableCell>{email}</TableCell>

                  {/* ステータスバッジ */}
                  <TableCell>
                    <Badge variation={!user.Enabled ? 'error' : isConfirmed ? 'success' : 'warning'}>
                      {user.Enabled ? user.UserStatus : 'DISABLED'}
                    </Badge>
                  </TableCell>
                      
                  {/* 作成日時 */}
                  <TableCell style={{ color: 'var(--amplify-colors-font-tertiary)' }}>
                    {formattedDate}
                  </TableCell>

                  <TableCell style={{ color: 'var(--amplify-colors-font-tertiary)' }}>
                    <button
                      onClick={() => {
                        openEditUserModal(user)
                      }}
                    >
                      編集
                    </button>
                    <button 
                      onClick={() =>
                        handleToggleSuspend(user.Username || '', email)
                      }
                      disabled={isMe} // 自分自身のアカウントは無効化/有効化できないようにする
                    >
                      {user.Enabled ? 'アカウント無効化' : 'アカウント有効化'}
                    </button>
                    {!isAdmin && (
                      <button
                        onClick={() => {
                          handleDeleteUser(user.Username || '', email)
                        }}
                      >
                        削除
                      </button>
                    )}
                  </TableCell>

                </TableRow>
              )
            })}

            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                <Text variation="tertiary">該当するユーザーが見つかりません</Text>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </View>

      {isOpen && (
        <div>
          <div>
            <h3>{ mode === 'add' ? 'ユーザー作成' : 'ユーザー編集' }</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label>
                  メールアドレス:
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={mode === 'edit'}
                  />
                </label>
              </div>
              <div>
                <label>
                  表示名:
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    required
                  />
                </label>
              </div>
              <button type="submit">保存</button>
              <button type="button" onClick={() => setIsOpen(false)}>キャンセル</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListUsers