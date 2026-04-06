import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin + '/magma-reception-app/',
    postLogoutRedirectUri: window.location.origin + '/magma-reception-app/',
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
    // Use redirect (not popup) so the entire page is taken over
    // and the user can't continue using the app after logout
    await msalInstance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + '/magma-reception-app/',
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
