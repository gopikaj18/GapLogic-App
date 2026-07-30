const TOKEN_STORAGE_KEY = 'gaplogic_token';

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // For Android WebView development, use the local IP of your server
  // When deploying to production, replace this with your Railway URL
  const isAndroidWebView = typeof window !== 'undefined' && 
    (navigator.userAgent.includes('GapLogicAndroid') || (window as any).Android);
  if (isAndroidWebView) {
    if (typeof window !== 'undefined') {
      if (window.location.protocol.startsWith('http')) {
        return window.location.origin;
      }
    }
    return 'http://10.0.2.2:9002';
  }

  return '';
};

export const saveAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
};

export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return null;
};

export const apiFetch = (path: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;

  // Attach JWT Bearer token if available (required for Capacitor cross-origin requests
  // where httpOnly cookies are not forwarded by the WebView)
  const token = getAuthToken();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const existingHeaders = (options.headers as Record<string, string>) || {};

  const defaultOptions: RequestInit = {
    ...options,
    credentials: options.credentials || 'include',
    headers: {
      ...authHeaders,
      ...existingHeaders, // caller headers take precedence
    },
  };

  return fetch(url, defaultOptions);
};
