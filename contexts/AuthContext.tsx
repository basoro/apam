import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Session = {
  token: string;
  no_rkm_medis: string;
  nik: string;
  nm_pasien: string;
};

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signIn: (noRkmInput: string, nikInput: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  token: string | null;
  noRkm: string | null;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
  token: null,
  noRkm: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session saat app dibuka
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const no_rkm_medis = await AsyncStorage.getItem('auth_no_rkm_medis');
        const nik = await AsyncStorage.getItem('auth_password');
        const nm_pasien = await AsyncStorage.getItem('auth_fullname');

        if (token && no_rkm_medis && nik) {
          setSession({
            token,
            no_rkm_medis,
            nik,
            nm_pasien: nm_pasien || '',
          });
        }
      } catch (error) {
        console.error('[AUTH] Error restoring session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (noRkmInput: string, nikInput: string) => {
    try {
      // ── STEP 1: System Login ───────────────────────────────────────────────
      console.log('[AUTH] Step 1 — System login...');
      const loginRes = await api.systemLogin();
      const { token } = loginRes.data;

      if (!token) throw new Error('Token tidak diterima dari server');

      // Simpan token sementara agar interceptor bisa menyisipkan Authorization
      await AsyncStorage.setItem('auth_token', token);
      console.log('[AUTH] Step 1 OK — token diterima');

      // ── STEP 2: Verifikasi Pasien ──────────────────────────────────────────
      console.log('[AUTH] Step 2 — Verifikasi pasien:', noRkmInput);
      const pasienRes = await api.pasien.show(noRkmInput);
      const pasienData = pasienRes.data;

      console.log('[AUTH] Step 2 OK — data pasien diterima');

      // Tentukan kredensial login pasien:
      // 1) Jika personal_pasien punya password, gunakan itu.
      // 2) Jika tidak ada, fallback ke NIK (no_ktp) pada tabel pasien.
      const serverPasien = pasienData?.data || pasienData;
      const inputCredential = nikInput.trim();

      let expectedCredential = String(serverPasien?.no_ktp || '').trim();
      try {
        const personalRes = await api.master.list('personal_pasien', {
          page: 1,
          per_page: 1,
          s: noRkmInput,
          col: 'no_rkm_medis',
        });
        const personalRows = (personalRes.data as any)?.data || [];
        const personal = Array.isArray(personalRows) ? personalRows[0] : personalRows;
        const personalPassword = String(personal?.password || '').trim();
        if (personalPassword) {
          expectedCredential = personalPassword;
        }
      } catch (error) {
        console.warn('[AUTH] Gagal membaca personal_pasien, fallback ke NIK pasien.', error);
      }

      if (expectedCredential !== inputCredential) {
        await AsyncStorage.removeItem('auth_token');
        throw new Error('Kredensial tidak cocok. Gunakan password personal jika tersedia, atau NIK jika belum ada password personal.');
      }

      // ── Simpan identitas pasien ke AsyncStorage ────────────────────────────
      const nm_pasien = serverPasien?.nm_pasien || '';

      await AsyncStorage.multiSet([
        ['auth_username',     noRkmInput],
        ['auth_password',     nikInput],
        ['auth_no_rkm_medis', noRkmInput],
        ['auth_fullname',     nm_pasien],
      ]);

      const newSession = {
        token,
        no_rkm_medis: noRkmInput,
        nik: nikInput,
        nm_pasien,
      };
      
      setSession(newSession);
      console.log('[AUTH] Login selesai — pasien terverifikasi:', noRkmInput);
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.multiRemove([
        'auth_token',
        'auth_username',
        'auth_password',
        'auth_no_rkm_medis',
        'auth_fullname',
      ]);
      setSession(null);
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!session,
        token: session?.token || null,
        noRkm: session?.no_rkm_medis || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
