import {
  createAmplifyAuthAdapter,
  createStorageBrowser,
} from '@aws-amplify/ui-react-storage/browser'
import '@aws-amplify/ui-react-storage/styles.css'
import './App.css'

import config from '../amplify_outputs.json'
import { Amplify } from 'aws-amplify'
import { fetchAuthSession } from "aws-amplify/auth"
import { Authenticator, Button, Flex, Heading } from '@aws-amplify/ui-react'
import {
  BrowserRouter as Router,
  Link as ReactRouterLink,
  Routes,
  Route
} from 'react-router'

import ListUsers from './users/page'
import { useState, useEffect } from 'react'

Amplify.configure(config)

// ToDo: 日本語化
// import { I18n } from 'aws-amplify/utils'
// import { translations } from '@aws-amplify/ui-react'
// I18n.putVocabularies(translations)

// import dict from './i18n.json'
// I18n.putVocabularies(dict)

// I18n.setLanguage('ja')

const { StorageBrowser } = createStorageBrowser({
  config: createAmplifyAuthAdapter(),
})

const getUserGroups = async () => {
  const session = await fetchAuthSession()
  const groupsClaim = session.tokens?.accessToken.payload['cognito:groups']
  const groupsArray = Array.isArray(groupsClaim)
    ? groupsClaim.map((group) => String(group))
    : typeof groupsClaim === 'string'
    ? [groupsClaim]
    : ['GUEST']
  return groupsArray
}

function App() {
  const [userGroups, setUserGroups] = useState<string[]>([])

  useEffect(() => {
    const fetchGroups = async () => {
      const groups = await getUserGroups()
      setUserGroups(groups)
    }
    fetchGroups()
  }, [])

  const hasGroup = (groupName: string) => {
    return userGroups.includes(groupName)
  }
  
  const routes = [
    { path: '/', label: 'Home', element: <StorageBrowser /> },
    { path: '/users', label: 'ユーザー管理', element: <ListUsers />, requiredGroup: 'ADMINS' },
  ]

  return (
    <Router>
      <Authenticator hideSignUp>
        {({ signOut, user }) => (
          <>
            <header>
              <div>
                <Heading level={4}>{`Hello ${user?.username}`} グループ: {userGroups.join(', ')}</Heading>
              </div>
              <div className="menu">
                <Flex>
                  {routes
                    .filter((route) => !route.requiredGroup || hasGroup(route.requiredGroup))
                    .map((route) => (
                      <ReactRouterLink key={route.path} to={route.path}>
                        {route.label}
                      </ReactRouterLink>
                    ))}
                </Flex>
              <Button onClick={signOut}>ログアウト</Button>
              </div>
            </header>
            <Routes>
              {routes
                .filter((route) => !route.requiredGroup || hasGroup(route.requiredGroup))
                .map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
            </Routes>
          </>
        )}
      </Authenticator>
    </Router>
  )
}

export default App