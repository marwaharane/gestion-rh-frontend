import axios from 'axios';

export async function getCsrfCookie() {
  await axios.get('http://localhost:8000/sanctum/csrf-cookie',  {
    withCredentials: true,
  });
}