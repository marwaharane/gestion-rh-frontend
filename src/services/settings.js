import axios from 'axios';
import { API_BASE_URL } from '../config';

let cachedSettings = null;

export async function getPublicSettings() {
  if (cachedSettings) return cachedSettings;
  try {
    const res = await axios.get(`${API_BASE_URL}/api/public/settings`);
    cachedSettings = res.data;
    return cachedSettings;
  } catch (err) {
    return { company_name: 'Gestion RH', company_logo_url: null, company_primary_color: '#1E3A5F' };
  }
}