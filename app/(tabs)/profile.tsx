import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Calendar, MapPin, LogOut, ChevronRight, Phone, CreditCard, Heart, Fingerprint, Camera, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resolvePersonalPhoto = (photoValue: string): string | null => {
  const normalized = photoValue.replace(/\\/g, '/').trim();
  if (!normalized) return null;
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;

  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!baseUrl) return null;

  const relative = normalized.startsWith('/') ? normalized.slice(1) : normalized;
  if (relative.startsWith('uploads/')) {
    return `${baseUrl}/${relative}`;
  }

  if (relative.startsWith('photopasien/')) {
    return `${baseUrl}/uploads/${relative}`;
  }

  return `${baseUrl}/uploads/photopasien/${relative}`;
};

const pickImageFromWebCamera = (): Promise<{ file: File; uri: string; fileName: string; mimeType: string } | null> => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(null);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      resolve({
        file,
        uri: objectUrl,
        fileName: file.name || `avatar-${Date.now()}.jpg`,
        mimeType: file.type || 'image/jpeg',
      });
    };

    input.click();
  });
};

const getResponseMessage = (data: any): string => {
  if (!data) return '';
  if (typeof data === 'string') return data.trim();
  return String(data?.message || data?.msg || data?.error || '').trim();
};

const isSuccessResponse = (response: any): boolean => {
  const data = response?.data;
  const status = String(data?.status || '').toLowerCase().trim();
  if (status) return ['success', 'ok', 'true', '1'].includes(status);
  if (typeof data?.success === 'boolean') return data.success;
  if (data?.error === true) return false;

  const message = getResponseMessage(data).toLowerCase();
  if (message && /(gagal|error|invalid|not allowed|failed|tidak)/i.test(message)) {
    return false;
  }

  return (response?.status === 200 || response?.status === 201) && !!data;
};

const isSuccessRaw = (data: any): boolean => {
  const status = String(data?.status || '').toLowerCase().trim();
  if (!status) return !!data;
  return ['success', 'ok', 'true', '1'].includes(status);
};

export default function ProfileScreen() {
  const { session, signOut, loading: authLoading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [personalData, setPersonalData] = useState<any>(null);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (session) {
      fetchProfileData();
    } else {
      setProfileLoading(false);
    }
  }, [session, authLoading]);

  const fetchProfileData = async () => {
    setProfileLoading(true);
    try {
      const [pasienRes, personalRes] = await Promise.all([
        api.pasien.show(session?.no_rkm_medis || ''),
        api.master.list('personal_pasien', {
          page: 1,
          per_page: 1,
          s: session?.no_rkm_medis,
          col: 'no_rkm_medis',
        }),
      ]);
      const pasienData = pasienRes.data?.data || pasienRes.data;
      const personalRows = (personalRes.data as any)?.data || [];
      setPatientData(Array.isArray(pasienData) ? pasienData[0] : pasienData);
      setPersonalData(Array.isArray(personalRows) ? personalRows[0] : personalRows);
    } catch (error) {
      console.error('Error fetching patient profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!session?.no_rkm_medis) return;
    setAvatarLoading(true);
    setUploadProgress(5);
    setUploadStatusText('Menyiapkan kamera...');
    try {
      let uri = '';
      let fileName = '';
      let mimeType = 'image/jpeg';
      let webFile: File | null = null;

      if (Platform.OS === 'web') {
        const webPick = await pickImageFromWebCamera();
        if (!webPick) return;
        uri = webPick.uri;
        fileName = webPick.fileName;
        mimeType = webPick.mimeType;
        webFile = webPick.file;
      } else {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status !== 'granted') {
          throw new Error('Izin kamera diperlukan untuk mengambil foto.');
        }

        const pickerResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

        if (pickerResult.canceled || !pickerResult.assets?.length) return;
        const asset = pickerResult.assets[0];
        uri = asset.uri;
        fileName = asset.fileName || `avatar-${Date.now()}.jpg`;
        mimeType = asset.mimeType || 'image/jpeg';
      }
      setUploadProgress(15);
      setUploadStatusText('Menyiapkan upload...');

      let uploadOk = false;
      let lastUploadError = '';
      let finalSavedAvatar = '';
      const fields = ['file', 'webcam', 'photo', 'foto', 'gambar'];
      const rawUrl = `${(process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '')}/admin/api/master/save/personal_pasien`;
      const token = await AsyncStorage.getItem('auth_token');
      const authUsername = (await AsyncStorage.getItem('auth_username')) || '';
      const authPassword = (await AsyncStorage.getItem('auth_password')) || '';

      const buildUploadFormData = (field: string) => {
        const formData = new FormData();
        formData.append('no_rkm_medis', session.no_rkm_medis);
        if (Platform.OS === 'web' && webFile) {
          formData.append(field, webFile, fileName);
        } else {
          formData.append(field, {
            uri,
            name: fileName,
            type: mimeType,
          } as any);
        }
        return formData;
      };

      const tryRawUploadFallback = async (field: string, formData: FormData) => {
        const rawRes = await fetch(rawUrl, {
          method: 'POST',
          headers: {
            'X-Api-Key': process.env.EXPO_PUBLIC_API_KEY || '',
            'X-Username-Permission': process.env.EXPO_PUBLIC_API_USERNAME || '',
            'X-Password-Permission': process.env.EXPO_PUBLIC_API_PASSWORD || '',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData as any,
        });
        const rawText = await rawRes.text();
        let rawData: any = {};
        try {
          rawData = rawText ? JSON.parse(rawText) : {};
        } catch {
          rawData = { message: rawText };
        }

        if (rawRes.ok && isSuccessRaw(rawData)) {
          uploadOk = true;
          finalSavedAvatar = fileName;
          return;
        }

        lastUploadError =
          getResponseMessage(rawData) ||
          `Upload gagal (${field}) [${rawRes.status}]`;

        if (!authUsername || !authPassword) return;

        const rawUrlWithCreds = `${rawUrl}?username=${encodeURIComponent(authUsername)}&password=${encodeURIComponent(authPassword)}`;
        const rawResWithCreds = await fetch(rawUrlWithCreds, {
          method: 'POST',
          headers: {
            'X-Api-Key': process.env.EXPO_PUBLIC_API_KEY || '',
            'X-Username-Permission': process.env.EXPO_PUBLIC_API_USERNAME || '',
            'X-Password-Permission': process.env.EXPO_PUBLIC_API_PASSWORD || '',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData as any,
        });
        const rawTextWithCreds = await rawResWithCreds.text();
        let rawDataWithCreds: any = {};
        try {
          rawDataWithCreds = rawTextWithCreds ? JSON.parse(rawTextWithCreds) : {};
        } catch {
          rawDataWithCreds = { message: rawTextWithCreds };
        }
        if (rawResWithCreds.ok && isSuccessRaw(rawDataWithCreds)) {
          uploadOk = true;
          finalSavedAvatar = fileName;
        } else {
          lastUploadError =
            getResponseMessage(rawDataWithCreds) ||
            `Upload gagal (${field}) [${rawResWithCreds.status}]`;
        }
      };

      for (const field of fields) {
        try {
          setUploadStatusText(`Mengunggah foto (${field})...`);
          const formData = buildUploadFormData(field);
          const response = await api.master.save('personal_pasien', formData, {
            headers: { 'Content-Type': undefined as any },
            onUploadProgress: (progressEvent: any) => {
              if (!progressEvent?.total) return;
              const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress(Math.max(15, Math.min(95, percent)));
            },
          });
          uploadOk = isSuccessResponse(response);
          if (!uploadOk) {
            lastUploadError = getResponseMessage(response.data) || `Upload ditolak pada field ${field}.`;
          } else {
            finalSavedAvatar = fileName;
          }
          if (!uploadOk) {
            // Fallback raw fetch agar multipart tidak dipengaruhi interceptor axios.
            await tryRawUploadFallback(field, buildUploadFormData(field));
          }
          if (uploadOk) break;
        } catch (e: any) {
          lastUploadError = getResponseMessage(e?.response?.data) || e?.message || `Upload gagal pada field ${field}.`;
          try {
            await tryRawUploadFallback(field, buildUploadFormData(field));
          } catch (fallbackError: any) {
            lastUploadError =
              getResponseMessage(fallbackError?.response?.data) ||
              fallbackError?.message ||
              lastUploadError;
          }
          if (uploadOk) break;
        }
      }

      if (!uploadOk) {
        throw new Error(lastUploadError || 'Upload foto gagal diproses server.');
      }

      setUploadProgress(100);
      setUploadStatusText('Upload selesai');
      if (finalSavedAvatar) {
        setPersonalData((prev: any) => ({
          ...(prev || {}),
          no_rkm_medis: session.no_rkm_medis,
          gambar: finalSavedAvatar,
        }));
      }
      Alert.alert('Berhasil', 'Foto profile berhasil diperbarui.');
      await fetchProfileData();
    } catch (error: any) {
      Alert.alert('Gagal', error?.message || 'Tidak dapat upload foto profile.');
    } finally {
      setAvatarLoading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatusText('');
      }, 700);
    }
  };

  const handleChangePassword = async () => {
    if (!session?.no_rkm_medis) return;
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'Semua kolom password wajib diisi.' });
      Alert.alert('Validasi', 'Semua kolom password wajib diisi.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'Konfirmasi password baru tidak sama.' });
      Alert.alert('Validasi', 'Konfirmasi password baru tidak sama.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordNotice({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      Alert.alert('Validasi', 'Password baru minimal 6 karakter.');
      return;
    }
    const personalPassword = String(personalData?.password || '').trim();
    const pasienNik = String(patientData?.no_ktp || '').trim();
    const expectedOldPassword = personalPassword || pasienNik || ((await AsyncStorage.getItem('auth_password')) || '');
    if (expectedOldPassword && oldPassword !== expectedOldPassword) {
      setPasswordNotice({ type: 'error', text: 'Password lama tidak sesuai.' });
      Alert.alert('Validasi', 'Password lama tidak sesuai.');
      return;
    }

    setPasswordLoading(true);
    setPasswordNotice(null);
    try {
      const payloads = [
        { no_rkm_medis: session.no_rkm_medis, password: newPassword },
        {
          no_rkm_medis: session.no_rkm_medis,
          password_lama: oldPassword,
          old_password: oldPassword,
          password: newPassword,
        },
        { no_rkm_medis: session.no_rkm_medis, pass: newPassword },
        { no_rkm_medis: session.no_rkm_medis, password: newPassword },
      ];
      let updated = false;
      let lastErr = '';

      for (const payload of payloads) {
        try {
          const response = await api.master.save('personal_pasien', payload);
          if (isSuccessResponse(response)) {
            updated = true;
            break;
          }
          lastErr = getResponseMessage(response.data) || 'Gagal mengubah password.';
        } catch (e: any) {
          lastErr = getResponseMessage(e?.response?.data) || e?.message || 'Gagal mengubah password.';
        }
      }

      if (!updated) {
        throw new Error(lastErr || 'Gagal mengubah password.');
      }

      await AsyncStorage.setItem('auth_password', newPassword);
      setChangePasswordVisible(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordNotice({ type: 'success', text: 'Password berhasil diubah.' });
      Alert.alert('Berhasil', 'Password berhasil diubah.');
    } catch (error: any) {
      setPasswordNotice({ type: 'error', text: error?.message || 'Tidak dapat mengubah password.' });
      Alert.alert('Gagal', error?.message || 'Tidak dapat mengubah password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = patientData?.nm_pasien || session?.nm_pasien || 'Pasien';
  const noRkm = session?.no_rkm_medis || '-';
  const avatarUri = resolvePersonalPhoto(
    personalData?.gambar || personalData?.photo || personalData?.foto || patientData?.photo || patientData?.foto || ''
  );

  if (authLoading || (profileLoading && !patientData)) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#62B986" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#62B986', '#72C996']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Login Diperlukan</Text>
          <Text style={styles.emptySubtitle}>
            Silakan login terlebih dahulu untuk melihat data profil Anda.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/login')}>
            <Text style={styles.actionButtonText}>Ke Halaman Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#62B986', '#72C996', '#82D9A6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.avatarCameraButton, avatarLoading && styles.avatarCameraButtonDisabled]}
              onPress={handleUploadAvatar}
              disabled={avatarLoading}
              activeOpacity={0.85}
            >
              <Camera size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {(avatarLoading || uploadProgress > 0) && (
            <View style={styles.uploadProgressWrap}>
              <View style={styles.uploadProgressTrack}>
                <View style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.uploadProgressText}>
                {uploadStatusText || 'Mengunggah...'} {uploadProgress > 0 ? `${uploadProgress}%` : ''}
              </Text>
            </View>
          )}
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>No. RM: {noRkm}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Rekam Medis</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Fingerprint color="#62B986" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>NIK (No. KTP)</Text>
                <Text style={styles.infoValue}>{patientData?.no_ktp || '-'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Calendar color="#62B986" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tgl Lahir</Text>
                <Text style={styles.infoValue}>
                  {patientData?.tgl_lahir || '-'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <User color="#62B986" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Jenis Kelamin</Text>
                <Text style={styles.infoValue}>{patientData?.jk === 'L' ? 'Laki-laki' : patientData?.jk === 'P' ? 'Perempuan' : '-'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Heart color="#EF4444" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Golongan Darah</Text>
                <Text style={styles.infoValue}>{patientData?.gol_darah || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontak & Alamat</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Phone color="#62B986" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>No. Telepon</Text>
                <Text style={styles.infoValue}>{patientData?.no_tlp || '-'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MapPin color="#62B986" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Alamat Lengkap</Text>
                <Text style={styles.infoValue}>{patientData?.alamat || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Akun</Text>
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              setPasswordNotice(null);
              setChangePasswordVisible(true);
            }}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Ubah Password</Text>
              <ChevronRight color="#999" size={20} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Keluar dari Aplikasi</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ubah Password</Text>
            <TextInput
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Password Lama"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Password Baru"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Konfirmasi Password Baru"
              secureTextEntry
              style={styles.input}
            />
            {passwordNotice && (
              <View style={[styles.noticeBox, passwordNotice.type === 'success' ? styles.noticeSuccess : styles.noticeError]}>
                <Text style={styles.noticeText}>{passwordNotice.text}</Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setChangePasswordVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, passwordLoading && styles.avatarCameraButtonDisabled]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                <Text style={styles.modalSaveText}>{passwordLoading ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileCard: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#62B986',
  },
  avatarCameraButton: {
    position: 'absolute',
    right: 4,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#62B986',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarCameraButtonDisabled: {
    opacity: 0.7,
  },
  uploadProgressWrap: {
    width: 170,
    marginBottom: 10,
  },
  uploadProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#1B8A52',
  },
  uploadProgressText: {
    marginTop: 4,
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 120, // Add padding at the bottom
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
    color: '#111827',
  },
  noticeBox: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  noticeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  noticeError: {
    backgroundColor: '#FEE2E2',
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 10,
  },
  modalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#62B986',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 50,
  },
  emptyImage: {
    width: 130,
    height: 130,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#62B986',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#62B986',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },   
});
