import axios from 'axios';
import { API_BASE_URL } from '../config';


const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Instance sans Content-Type forcé, nécessaire pour l'upload de fichiers (FormData)
export const apiUpload = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
  },
});

export default api;