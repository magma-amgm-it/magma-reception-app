import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: 'YOUR_CLIENT_ID_HERE', // Replace after Azure AD app registration
    authority: 'https://login.microsoftonline.com/d3e527c4-259d-4e96-aab6-3c6e5402bcbd',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['Sites.ReadWrite.All', 'User.Read'],
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Must be called before any MSAL operations
export async function initializeMsal() {
  await msalInstance.initialize();
  // Handle redirect response if returning from login
  await msalInstance.handleRedirectPromise();
}

export async function login() {
  try {
    const response = await msalInstance.loginPopup(loginRequest);
    return response.account;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function logout() {
  try {
    await msalInstance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
    });
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

export async function getAccessToken() {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    throw new Error('No authenticated account found. Please sign in.');
  }

  const silentRequest = {
    ...loginRequest,
    account: accounts[0],
  };

  try {
    const response = await msalInstance.acquireTokenSilent(silentRequest);
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Silent token acquisition failed — fall back to popup
      try {
        const response = await msalInstance.acquireTokenPopup(loginRequest);
        return response.accessToken;
      } catch (popupError) {
        console.error('Token acquisition via popup failed:', popupError);
        throw popupError;
      }
    }
    console.error('Token acquisition failed:', error);
    throw error;
  }
}

export function getActiveAccount() {
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}
