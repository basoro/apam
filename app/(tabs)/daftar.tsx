import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, ActivityIndicator, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClipboardCheck, X, ChevronRight, UserPlus, Calendar, User, Phone, Fingerprint, MapPin, Heart, Users, CheckCircle2, ChevronLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';

type MasterDataState = {
  poliklinik: any[];
  dokter: any[];
  penjab: any[];
  jadwal: any[];
};

const formatTime = (date: Date) => {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const formatDateLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeDay = (value: string) => value.toLowerCase().replace(/\s+/g, '').trim();

const dayAliasesByIndex: Record<number, string[]> = {
  0: ['ahad', 'minggu', 'sunday'],
  1: ['senin', 'monday'],
  2: ['selasa', 'tuesday'],
  3: ['rabu', 'wednesday'],
  4: ['kamis', 'thursday'],
  5: ['jumat', 'jum\'at', 'friday'],
  6: ['sabtu', 'saturday'],
};

export default function DaftarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    openPasienLama?: string;
    preselectDokter?: string;
    preselectDokterName?: string;
    preselectPoli?: string;
    preselectPoliName?: string;
    preselectTanggal?: string;
  }>();
  const { session } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [showFormExisting, setShowFormExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDatePickerExisting, setShowDatePickerExisting] = useState(false);

  // Master Data State
  const [master, setMaster] = useState<MasterDataState>({
    poliklinik: [],
    dokter: [],
    penjab: [],
    jadwal: [],
  });

  const [activeModal, setActiveModal] = useState<null | 'poli' | 'dokter' | 'pj'>(null);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState('');
  const [registerResultVisible, setRegisterResultVisible] = useState(false);
  const [registerResult, setRegisterResult] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    creds?: { nama: string; noRm: string; nik: string };
  } | null>(null);

  // Form State
  const [form, setForm] = useState({
    nm_pasien: '',
    no_ktp: '',
    jk: 'L',
    tmp_lahir: '',
    tgl_lahir: new Date(),
    nm_ibu: '',
    no_tlp: '',
    alamat: '',
    gol_darah: '-',
    pekerjaan: '',
    stts_nikah: 'BELUM MENIKAH',
    agama: 'ISLAM',
  });

  // Existing Patient Booking Form State
  const [bookingForm, setBookingForm] = useState({
    kd_poli: '',
    nm_poli: 'Pilih Poliklinik',
    kd_dokter: '',
    nm_dokter: 'Pilih Dokter',
    tgl_registrasi: new Date(),
    kd_pj: '',
    nm_pj: 'Pilih Cara Bayar',
  });

  const getParamValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] || '' : (value || '');

  const parseDateParam = (value: string): Date | undefined => {
    if (!value) return undefined;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(year, month, day);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  };

  const handleOpenPasienLama = (prefill?: {
    kd_dokter?: string;
    nm_dokter?: string;
    kd_poli?: string;
    nm_poli?: string;
    tgl_registrasi?: Date;
  }) => {
    if (!session) {
      router.replace('/login');
      return;
    }

    setBookingError('');
    setBookingSuccess(false);
    setBookingSuccessMessage('');
    setShowFormExisting(true);
    fetchMasterData();

    if (prefill?.kd_dokter || prefill?.kd_poli) {
      setBookingForm((prev) => ({
        ...prev,
        kd_dokter: prefill.kd_dokter || prev.kd_dokter,
        nm_dokter: prefill.nm_dokter || prev.nm_dokter,
        kd_poli: prefill.kd_poli || prev.kd_poli,
        nm_poli: prefill.nm_poli || prev.nm_poli,
        tgl_registrasi: prefill.tgl_registrasi || prev.tgl_registrasi,
      }));
    }
  };

  useEffect(() => {
    const openPasienLama = getParamValue(params.openPasienLama);
    if (openPasienLama !== '1') return;

    const kdDokter = getParamValue(params.preselectDokter);
    const nmDokter = getParamValue(params.preselectDokterName);
    const kdPoli = getParamValue(params.preselectPoli);
    const nmPoli = getParamValue(params.preselectPoliName);
    const tglRegistrasi = parseDateParam(getParamValue(params.preselectTanggal));

    handleOpenPasienLama({
      kd_dokter: kdDokter,
      nm_dokter: nmDokter || 'Pilih Dokter',
      kd_poli: kdPoli,
      nm_poli: nmPoli || 'Pilih Poliklinik',
      tgl_registrasi: tglRegistrasi,
    });
  }, [
    params.openPasienLama,
    params.preselectDokter,
    params.preselectDokterName,
    params.preselectPoli,
    params.preselectPoliName,
    params.preselectTanggal,
    session,
  ]);

  const fetchMasterData = async () => {
    setLoadingMaster(true);
    try {
      const [poliRes, pjRes, jadwalRes, dokterRes] = await Promise.all([
        api.master.list('poliklinik'),
        api.master.list('penjab'),
        api.master.list('jadwal'),
        api.master.list('dokter'),
      ]);

      setMaster({
        poliklinik: poliRes.data.data || [],
        penjab: pjRes.data.data || [],
        jadwal: jadwalRes.data.data || [],
        dokter: dokterRes.data.data || [],
      });
    } catch (error) {
      console.error('Error fetching master data:', error);
      Alert.alert('Error', 'Gagal mengambil data master rumah sakit.');
    } finally {
      setLoadingMaster(false);
    }
  };

  const handlePasienLama = () => {
    handleOpenPasienLama();
  };

  const getAvailableDoctors = () => {
    if (!bookingForm.kd_poli) return [];

    const todayAliases = new Set(
      (dayAliasesByIndex[bookingForm.tgl_registrasi.getDay()] || []).map(normalizeDay)
    );

    // Filter jadwal based on clinic and day
    const availableSchedules = master.jadwal.filter((j: any) =>
      j.kd_poli === bookingForm.kd_poli &&
      todayAliases.has(normalizeDay(String(j.hari_kerja || '')))
    );

    // Map schedules to doctor details
    return availableSchedules.map((s: any) => {
      const doc = master.dokter.find((d: any) => d.kd_dokter === s.kd_dokter);
      return {
        kd_dokter: s.kd_dokter,
        nm_dokter: doc ? doc.nm_dokter : s.kd_dokter,
        jam_mulai: s.jam_mulai,
        jam_selesai: s.jam_selesai,
      };
    });
  };

  const handleBookingSubmit = async () => {
    if (!session?.no_rkm_medis) {
      const msg = 'Sesi login tidak valid. Silakan login ulang.';
      setBookingError(msg);
      return;
    }

    if (!bookingForm.kd_poli || !bookingForm.kd_dokter || !bookingForm.kd_pj) {
      const msg = 'Mohon lengkapi pendaftaran Anda.';
      setBookingError(msg);
      return;
    }

    setBookingError('');
    setLoading(true);
    try {
      const payload = {
        no_rkm_medis: session.no_rkm_medis,
        kd_poli: bookingForm.kd_poli,
        kd_dokter: bookingForm.kd_dokter,
        kd_pj: bookingForm.kd_pj,
        tgl_registrasi: formatDateLocal(bookingForm.tgl_registrasi),
        jam_reg: formatTime(new Date()),
      };

      console.log('[BOOKING_LAMA][REQUEST_PAYLOAD]', payload);
      const response = await api.rawatJalan.create(payload);
      console.log('[BOOKING_LAMA][RESPONSE_OK]', {
        status: response?.status,
        statusText: response?.statusText,
        data: response?.data,
      });
      const backendStatus = String(response?.data?.status || '').toLowerCase();
      const isBackendSuccess = backendStatus === 'success' || backendStatus === 'ok';
      const isHttpSuccess = response.status === 200 || response.status === 201;

      if (isHttpSuccess && isBackendSuccess) {
        setBookingError('');
        setBookingSuccess(true);
        setBookingSuccessMessage('Pendaftaran berhasil. Silahkan cek menu Riwayat untuk detail antrian.');
      } else {
        throw new Error(
          response?.data?.message ||
          response?.data?.msg ||
          'Booking belum tersimpan. Backend mengembalikan status gagal.'
        );
      }
    } catch (error: any) {
      console.error('[BOOKING_LAMA][ERROR_OBJECT]', error);
      console.error('[BOOKING_LAMA][ERROR_RESPONSE]', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        headers: error?.response?.headers,
      });
      console.error('[BOOKING_LAMA][ERROR_REQUEST]', {
        method: error?.config?.method,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        params: error?.config?.params,
        data: error?.config?.data,
      });
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        'Gagal melakukan pendaftaran. Silahkan coba lagi.';
      setBookingError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegisterResult(null);
    setRegisterResultVisible(false);

    // Validation
    if (!form.nm_pasien || !form.no_ktp || !form.no_tlp || !form.alamat) {
      setRegisterResult({
        type: 'error',
        title: 'Gagal',
        message: 'Mohon lengkapi semua field wajib (*).',
      });
      setRegisterResultVisible(true);
      return;
    }

    if (form.no_ktp.length < 16) {
      setRegisterResult({
        type: 'error',
        title: 'Gagal',
        message: 'NIK harus 16 digit.',
      });
      setRegisterResultVisible(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        tgl_lahir: formatDateLocal(form.tgl_lahir),
      };

      const response = await api.pasien.create(payload);

      const backendStatus = String(response?.data?.status || '').toLowerCase();
      const isBackendSuccess = backendStatus === 'success' || backendStatus === 'ok';
      const isHttpSuccess = response.status === 200 || response.status === 201;

      if (isHttpSuccess && (isBackendSuccess || !backendStatus)) {
        const data = (response?.data as any)?.data ?? response?.data ?? {};
        const noRm =
          String(
            data?.no_rkm_medis ||
              data?.noRM ||
              data?.no_rm ||
              data?.no_rkm ||
              data?.no_rkmmedis ||
              ''
          ).trim();

        setRegisterResult({
          type: 'success',
          title: 'Berhasil',
          message: 'Pendaftaran pasien baru berhasil. Gunakan NIK sebagai password sementara untuk login.',
          creds: {
            nama: String(form.nm_pasien || '').trim(),
            noRm: noRm || '-',
            nik: String(form.no_ktp || '').trim(),
          },
        });
        setRegisterResultVisible(true);
      } else {
        throw new Error(response.data?.message || 'Gagal mendaftarkan pasien');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setRegisterResult({
        type: 'error',
        title: 'Gagal',
        message: error?.message || 'Terjadi kesalahan saat mendaftar.',
      });
      setRegisterResultVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm({ ...form, tgl_lahir: selectedDate });
    }
  };

  if (showForm) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#62B986', '#72C996']}
          style={styles.headerSmall}
        >
          <TouchableOpacity
            style={styles.backButtonCompact}
            onPress={() => setShowForm(false)}
          >
            <ChevronLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitleSmall}>Data Pasien Baru</Text>
        </LinearGradient>

        <ScrollView
          style={styles.formContent}
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Identitas Pribadi</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap *</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#62B986" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama sesuai KTP"
                  value={form.nm_pasien}
                  onChangeText={(val) => setForm({ ...form, nm_pasien: val })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NIK (KTP) *</Text>
              <View style={styles.inputWrapper}>
                <Fingerprint size={20} color="#62B986" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="16 Digit NIK"
                  keyboardType="numeric"
                  maxLength={16}
                  value={form.no_ktp}
                  onChangeText={(val) => setForm({ ...form, no_ktp: val })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jenis Kelamin *</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderOption, form.jk === 'L' && styles.genderActive]}
                  onPress={() => setForm({ ...form, jk: 'L' })}
                >
                  <Users size={18} color={form.jk === 'L' ? '#FFF' : '#62B986'} />
                  <Text style={[styles.genderText, form.jk === 'L' && styles.genderTextActive]}>Laki-laki</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderOption, form.jk === 'P' && styles.genderActive]}
                  onPress={() => setForm({ ...form, jk: 'P' })}
                >
                  <Users size={18} color={form.jk === 'P' ? '#FFF' : '#62B986'} />
                  <Text style={[styles.genderText, form.jk === 'P' && styles.genderTextActive]}>Perempuan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Kelahiran & Keluarga</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tempat Lahir</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={20} color="#62B986" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Jakarta"
                  value={form.tmp_lahir}
                  onChangeText={(val) => setForm({ ...form, tmp_lahir: val })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tanggal Lahir *</Text>
              <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
                <Calendar size={20} color="#62B986" style={styles.inputIcon} />
                <Text style={styles.dateText}>
                  {form.tgl_lahir.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.tgl_lahir}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Ibu Kandung *</Text>
              <View style={styles.inputWrapper}>
                <Heart size={20} color="#62B986" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nama ibu kandung"
                  value={form.nm_ibu}
                  onChangeText={(val) => setForm({ ...form, nm_ibu: val })}
                />
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Kontak & Alamat</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>No. Telepon / WA *</Text>
              <View style={styles.inputWrapper}>
                <Phone size={20} color="#62B986" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="08xxxxxxxxxx"
                  keyboardType="phone-pad"
                  value={form.no_tlp}
                  onChangeText={(val) => setForm({ ...form, no_tlp: val })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alamat Lengkap *</Text>
              <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
                <MapPin size={20} color="#62B986" style={[styles.inputIcon, { marginTop: 4 }]} />
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Jl. Nama Jalan, No. Rumah, RT/RW, Dusun, Kelurahan, Kecamatan"
                  multiline
                  numberOfLines={4}
                  value={form.alamat}
                  onChangeText={(val) => setForm({ ...form, alamat: val })}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Daftar Sekarang</Text>
                <CheckCircle2 color="#FFF" size={20} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
          <View style={{ height: 100 }} />
        </ScrollView>
        <Modal
          visible={registerResultVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRegisterResultVisible(false)}
        >
          <View style={styles.registerModalOverlay}>
            <View style={styles.registerModalCard}>
              {registerResult?.type === 'success' ? (
                <CheckCircle2 size={44} color="#2E7D32" />
              ) : (
                <X size={44} color="#EF5350" />
              )}
              <Text
                style={[
                  styles.registerModalTitle,
                  registerResult?.type === 'success' ? styles.registerModalTitleSuccess : styles.registerModalTitleError,
                ]}
              >
                {registerResult?.title || (registerResult?.type === 'success' ? 'Berhasil' : 'Gagal')}
              </Text>
              <Text style={styles.registerModalText}>{registerResult?.message || ''}</Text>

              {registerResult?.type === 'success' && registerResult?.creds ? (
                <View style={styles.credentialBox}>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>Nama</Text>
                    <Text style={styles.credentialValue}>{registerResult.creds.nama || '-'}</Text>
                  </View>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>No. RM</Text>
                    <Text style={styles.credentialValue}>{registerResult.creds.noRm || '-'}</Text>
                  </View>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>Password Sementara</Text>
                    <Text style={styles.credentialValue}>{registerResult.creds.nik || '-'}</Text>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.registerModalButton}
                onPress={() => {
                  const isSuccess = registerResult?.type === 'success';
                  setRegisterResultVisible(false);
                  if (isSuccess) setShowForm(false);
                }}
              >
                <Text style={styles.registerModalButtonText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <BlurView
          intensity={30}
          tint="light"
          style={styles.bottomBlurOverlay}
          experimentalBlurMethod="dimezisBlurView"
        />
      </View>
    );
  }

  if (showFormExisting) {
    const doctors = getAvailableDoctors();

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#62B986', '#72C996']}
          style={styles.headerSmall}
        >
          <TouchableOpacity
            style={styles.backButtonCompact}
            onPress={() => setShowFormExisting(false)}
          >
            <ChevronLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitleSmall}>Booking Pasien Lama</Text>
        </LinearGradient>

        <ScrollView
          style={styles.formContent}
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <Text style={[styles.formSectionTitle, { borderLeftColor: '#62B986' }]}>Detail Pendaftaran</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tanggal Periksa</Text>
              <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePickerExisting(true)}>
                <Calendar size={20} color="#62B986" style={styles.inputIcon} />
                <Text style={styles.dateText}>
                  {bookingForm.tgl_registrasi.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              {showDatePickerExisting && (
                <DateTimePicker
                  value={bookingForm.tgl_registrasi}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, date) => {
                    setShowDatePickerExisting(false);
                    if (date) setBookingForm({ ...bookingForm, tgl_registrasi: date, nm_dokter: 'Pilih Dokter', kd_dokter: '' });
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Poliklinik Tujuan</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setActiveModal('poli')}
                disabled={loadingMaster}
              >
                <MapPin size={20} color="#62B986" style={styles.inputIcon} />
                <Text style={[styles.dateText, bookingForm.kd_poli ? { color: '#333' } : { color: '#999' }]}>
                  {loadingMaster ? 'Memuat data...' : bookingForm.nm_poli}
                </Text>
                <ChevronRight color="#CCC" size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dokter Spesialis</Text>
              <TouchableOpacity
                style={[styles.inputWrapper, !bookingForm.kd_poli && styles.inputDisabled]}
                onPress={() => bookingForm.kd_poli && setActiveModal('dokter')}
                disabled={!bookingForm.kd_poli}
              >
                <User size={20} color={bookingForm.kd_poli ? "#62B986" : "#CCC"} style={styles.inputIcon} />
                <Text style={[styles.dateText, bookingForm.kd_dokter ? { color: '#333' } : { color: '#999' }]}>
                  {bookingForm.nm_dokter}
                </Text>
                <ChevronRight color="#CCC" size={16} />
              </TouchableOpacity>
              {!bookingForm.kd_poli && (
                <Text style={styles.helperText}>* Pilih poliklinik terlebih dahulu</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cara Bayar</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setActiveModal('pj')}
                disabled={loadingMaster}
              >
                <Fingerprint size={20} color="#62B986" style={styles.inputIcon} />
                <Text style={[styles.dateText, bookingForm.kd_pj ? { color: '#333' } : { color: '#999' }]}>
                  {loadingMaster ? 'Memuat data...' : bookingForm.nm_pj}
                </Text>
                <ChevronRight color="#CCC" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: '#62B986', shadowColor: '#62B986' },
              (loading || bookingSuccess) && styles.submitButtonDisabled,
            ]}
            onPress={handleBookingSubmit}
            disabled={loading || bookingSuccess}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : bookingSuccess ? (
              <>
                <Text style={styles.submitButtonText}>Booking Berhasil</Text>
                <CheckCircle2 color="#FFF" size={20} style={{ marginLeft: 8 }} />
              </>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Konfirmasi Booking</Text>
                <CheckCircle2 color="#FFF" size={20} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
          {!!bookingError && <Text style={styles.bookingErrorText}>{bookingError}</Text>}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Picker Modals */}
        <Modal visible={activeModal !== null} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {activeModal === 'poli' ? 'Pilih Poliklinik' : activeModal === 'dokter' ? 'Pilih Dokter' : 'Pilih Cara Bayar'}
                </Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <X size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={activeModal === 'poli' ? master.poliklinik : activeModal === 'dokter' ? doctors : master.penjab}
                keyExtractor={(item: any, index) => (item.kd_poli || item.kd_dokter || item.kd_pj || index).toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      if (activeModal === 'poli') setBookingForm({ ...bookingForm, kd_poli: item.kd_poli, nm_poli: item.nm_poli, kd_dokter: '', nm_dokter: 'Pilih Dokter' });
                      if (activeModal === 'dokter') setBookingForm({ ...bookingForm, kd_dokter: item.kd_dokter, nm_dokter: item.nm_dokter });
                      if (activeModal === 'pj') setBookingForm({ ...bookingForm, kd_pj: item.kd_pj, nm_pj: item.png_jawab });
                      setActiveModal(null);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.nm_poli || item.nm_dokter || item.png_jawab}</Text>
                    {activeModal === 'dokter' && item.jam_mulai && (
                      <Text style={styles.modalItemSubtext}>{item.jam_mulai} - {item.jam_selesai}</Text>
                    )}
                    <ChevronRight color="#CCC" size={16} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Tidak ada data tersedia.</Text>
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={bookingSuccess} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.successModalContainer}>
              <CheckCircle2 size={44} color="#2E7D32" />
              <Text style={styles.successModalTitle}>Booking Berhasil</Text>
              <Text style={styles.successModalText}>
                {bookingSuccessMessage || 'Pendaftaran berhasil dilakukan.'}
              </Text>
              <TouchableOpacity
                style={styles.successModalButton}
                onPress={() => {
                  setBookingSuccess(false);
                  setShowFormExisting(false);
                }}
              >
                <Text style={styles.successModalButtonText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <BlurView
          intensity={30}
          tint="light"
          style={styles.bottomBlurOverlay}
          experimentalBlurMethod="dimezisBlurView"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#62B986', '#72C996', '#82D9A6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Daftar Mandiri</Text>
        <Text style={styles.headerSubtitle}>Pendaftaran pasien secara mandiri</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowForm(true)}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <UserPlus color="#62B986" size={24} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Pasien Baru</Text>
              <Text style={styles.menuDescription}>Pendaftaran untuk pasien yang belum pernah berobat</Text>
            </View>
            <ChevronRight color="#CCC" size={20} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePasienLama}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Calendar color="#62B986" size={24} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Pasien Lama</Text>
              <Text style={styles.menuDescription}>Pendaftaran menggunakan nomor rekam medis</Text>
            </View>
            <ChevronRight color="#CCC" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <ClipboardCheck color="#62B986" size={20} />
          <Text style={styles.infoText}>
            Pastikan data Anda sudah benar sebelum melanjutkan proses pendaftaran.
          </Text>
        </View>
      </ScrollView>
      <BlurView
        intensity={30}
        tint="light"
        style={styles.bottomBlurOverlay}
        experimentalBlurMethod="dimezisBlurView"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  bottomBlurOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    pointerEvents: 'none',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  headerSmall: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitleSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  backButtonCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContent: {
    flex: 1,
    padding: 20,
  },
  formScrollContent: {
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    paddingLeft: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#62B986',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#333',
  },
  dateText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  genderActive: {
    backgroundColor: '#62B986',
    borderColor: '#62B986',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  genderTextActive: {
    color: '#FFF',
  },
  submitButton: {
    backgroundColor: '#62B986',
    borderRadius: 12,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#62B986',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  registerModalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  registerModalTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  registerModalTitleSuccess: {
    color: '#1B5E20',
  },
  registerModalTitleError: {
    color: '#B91C1C',
  },
  registerModalText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  credentialBox: {
    marginTop: 14,
    alignSelf: 'stretch',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    gap: 10,
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  credentialLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  credentialValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },
  registerModalButton: {
    marginTop: 16,
    backgroundColor: '#62B986',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  registerModalButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  inputDisabled: {
    backgroundColor: '#F9F9F9',
    borderColor: '#EEE',
  },
  helperText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  modalItemSubtext: {
    fontSize: 12,
    color: '#62B986',
    marginRight: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  bookingErrorText: {
    color: '#D32F2F',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  successModalContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  successModalTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  successModalText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  successModalButton: {
    marginTop: 16,
    backgroundColor: '#62B986',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  successModalButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
});
