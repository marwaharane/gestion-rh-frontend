import axios from 'axios';
import { API_BASE_URL } from '../config';

export async function getCsrfCookie() {
  await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
}