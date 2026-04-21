// Base64 utilities for React Web
// Using browser's built-in btoa/atob with UTF-8 handling

export const btoa = (input) => {
  try {
    return window.btoa(unescape(encodeURIComponent(input)));
  } catch (error) {
    console.error('Error encoding to base64:', error);
    return '';
  }
};

export const atob = (input) => {
  try {
    return decodeURIComponent(escape(window.atob(input)));
  } catch (error) {
    console.error('Error decoding from base64:', error);
    return '';
  }
};

export const decodeJWT = (token) => {
  try {
    if (!token || token.split('.').length !== 3) {
      return null;
    }
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};
