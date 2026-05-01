import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Konfigurasi Dasar (dari .env) ───────────────────────────────────────────
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://demo.mlite.id';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';
const API_USERNAME = process.env.EXPO_PUBLIC_API_USERNAME || '';
const API_PASSWORD = process.env.EXPO_PUBLIC_API_PASSWORD || '';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': API_KEY,
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: any) => {
    // Endpoint login hanya butuh X-Api-Key (sudah di default headers)
    if (config.url?.includes('/admin/api/login')) {
      return config;
    }

    // Bearer token dari Step 1 (system login)
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Header permission — STATIS dari .env (system credentials)
    config.headers['X-Username-Permission'] = API_USERNAME;
    config.headers['X-Password-Permission'] = API_PASSWORD;

    /**
     * Sertakan no_rkm_medis (auth_username) dan nik (auth_password)
     * sebagai parameter di setiap request terautentikasi.
     */
    const authUsername = await AsyncStorage.getItem('auth_username');
    const authPassword = await AsyncStorage.getItem('auth_password');
    const isRawatJalanCreate = config.url?.includes('/admin/api/rawat_jalan/create');
    const isMasterSave = config.url?.includes('/admin/api/master/save/');
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (authUsername && authPassword && !isRawatJalanCreate) {
      const method = config.method?.toLowerCase();
      if (method === 'get' || isMasterSave) {
        config.params = {
          ...config.params,
          username: authUsername,
          password: authPassword,
        };
      } else if (isFormData) {
        // Biarkan browser/axios membentuk multipart boundary otomatis.
        if (config.headers) {
          delete config.headers['Content-Type'];
        }
        const hasUsername = typeof config.data.get === 'function' && config.data.get('username');
        const hasPassword = typeof config.data.get === 'function' && config.data.get('password');
        if (!hasUsername) config.data.append('username', authUsername);
        if (!hasPassword) config.data.append('password', authPassword);
      } else if (config.data) {
        try {
          const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
          config.data = {
            ...body,
            username: authUsername,
            password: authPassword,
          };
        } catch (e) {
          // Fallback if data is not JSON or already stringified in a way that can't be parsed easily
          // But usually axios handles objects automatically
        }
      } else {
        config.data = {
          username: authUsername,
          password: authPassword,
        };
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;

// ─── Endpoints ────────────────────────────────────────────────────────────────
const PREFIX = '/admin/api';

export const api = {
  // Authentication
  systemLogin: () =>
    apiClient.post(`${PREFIX}/login`, {
      username: API_USERNAME,
      password: API_PASSWORD,
    }),

  verifyPasien: (noRkm: string) =>
    apiClient.get(`${PREFIX}/pasien/show/${noRkm}`),

  // Pasien
  pasien: {
    list: (params?: { page?: number; per_page?: number; s?: string }) =>
      apiClient.get(`${PREFIX}/pasien/list`, { params }),
    show: (no_rkm_medis: string) => apiClient.get(`${PREFIX}/pasien/show/${no_rkm_medis}`),
    create: (data: any) => apiClient.post(`${PREFIX}/pasien/create`, data),
    update: (no_rkm_medis: string, data: any, config?: any) => apiClient.post(`${PREFIX}/pasien/update/${no_rkm_medis}`, data, config),
    delete: (no_rkm_medis: string) => apiClient.delete(`${PREFIX}/pasien/delete/${no_rkm_medis}`),
    riwayatPerawatan: (no_rkm_medis: string, noRawat?: string) => 
      apiClient.get(`${PREFIX}/pasien/riwayatperawatan/${no_rkm_medis}`, { params: noRawat ? { no_rawat: noRawat, detail: 'true' } : {} }),
  },

  // Rawat Jalan
  rawatJalan: {
    list: (params?: {
      draw?: number;
      start?: number;
      length?: number;
      tgl_awal?: string;
      tgl_akhir?: string;
      search?: string;
      page?: number;
      per_page?: number;
      s?: string
    }) =>
      apiClient.get(`${PREFIX}/rawat_jalan/list`, { params }),
    show: (no_rawat: string) => apiClient.get(`${PREFIX}/rawat_jalan/show/${encodeURIComponent(no_rawat)}`),
    create: (data: any) => apiClient.post(`${PREFIX}/rawat_jalan/create`, data),
    update: (no_rawat: string, data: any) => apiClient.post(`${PREFIX}/rawat_jalan/update/${no_rawat}`, data),
    delete: (no_rawat: string) => apiClient.delete(`${PREFIX}/rawat_jalan/delete/${no_rawat}`),

    showTindakan: (no_rawat: string) => apiClient.get(`${PREFIX}/rawat_jalan/showdetail/tindakan/${no_rawat}`),
    showSoap: (no_rawat: string) => apiClient.get(`${PREFIX}/rawat_jalan/showsoap/${no_rawat}`),
    saveSoap: (data: any) => apiClient.post(`${PREFIX}/rawat_jalan/savesoap`, data),
    deleteSoap: (data: any) => apiClient.post(`${PREFIX}/rawat_jalan/deletesoap`, data),
    saveProsedur: (data: any) => apiClient.post(`${PREFIX}/rawat_jalan/saveprosedur`, data),
    deleteProsedur: (data: any) => apiClient.post(`${PREFIX}/rawat_jalan/deleteprosedur`, data),
    saveCatatan: (data: any) => apiClient.post(`${PREFIX}/rawat_jalan/savecatatan`, data),
  },

  // Rawat Inap
  rawatInap: {
    list: (params?: {
      draw?: number;
      start?: number;
      length?: number;
      tgl_awal?: string;
      tgl_akhir?: string;
      search?: string;
      page?: number;
      per_page?: number;
      s?: string;
      stts_pulang?: string;
    }) =>
      apiClient.get(`${PREFIX}/rawat_inap/list`, { params }),
    show: (no_rawat: string) => apiClient.get(`${PREFIX}/rawat_inap/show/${no_rawat}`),
    create: (data: any) => apiClient.post(`${PREFIX}/rawat_inap/create`, data),
    update: (no_rawat: string, data: any) => apiClient.post(`${PREFIX}/rawat_inap/update/${no_rawat}`, data),
    delete: (no_rawat: string) => apiClient.delete(`${PREFIX}/rawat_inap/delete/${no_rawat}`),

    showTindakan: (no_rawat: string) => apiClient.get(`${PREFIX}/rawat_inap/showdetail/tindakan/${no_rawat}`),
    showSoap: (no_rawat: string) => apiClient.get(`${PREFIX}/rawat_inap/showsoap/${no_rawat}`),
    saveSoap: (data: any) => apiClient.post(`${PREFIX}/rawat_inap/savesoap`, data),
    deleteSoap: (data: any) => apiClient.post(`${PREFIX}/rawat_inap/deletesoap`, data),
  },

  // Master Data
  master: {
    list: (table: string, params?: any) => apiClient.get(`${PREFIX}/master/list/${table}`, { params }),
    save: (table: string, data: any, config?: any) => apiClient.post(`${PREFIX}/master/save/${table}`, data, config),
    delete: (table: string, data: any) => apiClient.delete(`${PREFIX}/master/delete/${table}`, { data }),
  },

  users: {
    save: (data: any) => apiClient.post(`${PREFIX}/users/save`, data),
    delete: (data: { id: string | number }) => apiClient.post(`${PREFIX}/users/delete`, data),
  },

  // Website News
  website: {
    list: (params?: {
      draw?: number;
      start?: number;
      length?: number;
      search?: string;
      page?: number;
      per_page?: number;
      s?: string;
    }) => apiClient.get(`${PREFIX}/website/list`, { params }),
    show: (news_id: string | number) => apiClient.get(`${PREFIX}/website/show/${news_id}`),
  },

  // Obat & Resep
  obat: {
    list: (params: any) => apiClient.get(`${PREFIX}/obat/list`, { params }),
  },

  // Laboratorium
  lab: {
    list: (params: any) => apiClient.get(`${PREFIX}/lab/list`, { params }),
    periksa: (data: any) => apiClient.post(`${PREFIX}/lab/periksa`, data),
  },

  // Radiologi
  radiologi: {
    list: (params: any) => apiClient.get(`${PREFIX}/radiologi/list`, { params }),
    periksa: (data: any) => apiClient.post(`${PREFIX}/radiologi/periksa`, data),
  },
};
