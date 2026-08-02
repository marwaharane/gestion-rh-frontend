import api from './api';
import { getCsrfCookie } from './csrf';

let cachedUser = null;

export async function login(email, password) {
  await getCsrfCookie();
  const response = await api.post('/login', { email, password });
  cachedUser = response.data.user;
  return cachedUser;
}

export async function logout() {
  await api.post('/logout');
  cachedUser = null;
}

export async function fetchCurrentUser() {
  try {
    const response = await api.get('/user');
    cachedUser = response.data;
    return cachedUser;
  } catch (err) {
    cachedUser = null;
    return null;
  }
}

export function getCurrentUser() {
  return cachedUser;
}

export function hasRole(...roles) {
  if (!cachedUser || !cachedUser.roles) return false;
  return roles.some((role) => cachedUser.roles.includes(role));
}