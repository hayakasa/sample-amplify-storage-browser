import {
  createAmplifyAuthAdapter,
  createStorageBrowser,
} from '@aws-amplify/ui-react-storage/browser';
import '@aws-amplify/ui-react-storage/styles.css';
import './App.css';

import config from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { Authenticator, Button, Link, Flex, Heading } from '@aws-amplify/ui-react';
import {
  BrowserRouter as Router,
  Link as ReactRouterLink,
  Routes,
  Route
} from 'react-router-dom'

Amplify.configure(config);

const { StorageBrowser } = createStorageBrowser({
  config: createAmplifyAuthAdapter(),
});

function Home() {
  return <Heading level={2}>Home</Heading>;
}

function About() {
  return <Heading level={2}>About</Heading>;
}

function Users() {
  return <Heading level={2}>Users</Heading>;
}

function App() {
  return (
    <Authenticator hideSignUp>
      {({ signOut, user }) => (
        <>
          <div className="header">
            <h1>{`Hello ${user?.username}`}</h1>
            <Button onClick={signOut}>Sign out</Button>
            <Router>
              <Flex>
                <ReactRouterLink to="/">Home</ReactRouterLink>
                <ReactRouterLink to="/about">About</ReactRouterLink>
                <ReactRouterLink to="/users">Users</ReactRouterLink>
              </Flex>

              <Routes>
                <Route path="/about" element={<About />} />
                <Route path="/users" element={<Users />} />
                <Route path="/" element={<Home />} />
              </Routes>
            </Router>
          </div>
          <StorageBrowser />
        </>
      )}
    </Authenticator>
  );
}

export default App;