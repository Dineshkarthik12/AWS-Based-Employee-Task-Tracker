import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

const cognitoClient = new CognitoIdentityProviderClient({
  region: REGION,
});

/**
 * Authenticate a user with email and password using Cognito.
 * Returns tokens and user info.
 */
export async function signIn(email, password) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);
    const { AuthenticationResult } = response;

    if (!AuthenticationResult) {
      throw new Error('Authentication failed - no result returned');
    }

    const { AccessToken, IdToken, RefreshToken } = AuthenticationResult;

    // Store tokens
    localStorage.setItem('access_token', AccessToken);
    localStorage.setItem('id_token', IdToken);
    if (RefreshToken) {
      localStorage.setItem('refresh_token', RefreshToken);
    }

    return {
      accessToken: AccessToken,
      idToken: IdToken,
      refreshToken: RefreshToken,
    };
  } catch (error) {
    console.error('Sign in error:', error);

    if (error.name === 'NotAuthorizedException') {
      throw new Error('Invalid email or password');
    }
    if (error.name === 'UserNotFoundException') {
      throw new Error('User not found');
    }
    if (error.name === 'UserNotConfirmedException') {
      throw new Error('Account not confirmed. Please check your email.');
    }

    throw new Error(error.message || 'Authentication failed');
  }
}

/**
 * Sign out the current user by clearing stored tokens.
 */
export function signOut() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated by verifying token existence.
 */
export function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

/**
 * Get the stored access token.
 */
export function getAccessToken() {
  return localStorage.getItem('access_token');
}
