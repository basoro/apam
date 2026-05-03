import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, CalendarDays, MapPin, User, Hash } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

type TicketParams = {
  no_booking?: string;
  no_reg?: string;
  status?: string;
  tanggal_booking?: string;
  tanggal_periksa?: string;
  kd_dokter?: string;
  nm_dokter?: string;
  kd_poli?: string;
  nm_poli?: string;
  no_rkm_medis?: string;
  nm_pasien?: string;
};

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || '' : (value || '');

export default function BookingTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<TicketParams>();

  const noBooking = getParamValue(params.no_booking);
  const noReg = getParamValue(params.no_reg);
  const status = getParamValue(params.status);
  const tanggalBooking = getParamValue(params.tanggal_booking);
  const tanggalPeriksa = getParamValue(params.tanggal_periksa);
  const nmDokter = getParamValue(params.nm_dokter) || '-';
  const nmPoli = getParamValue(params.nm_poli) || '-';
  const noRkmMedis = getParamValue(params.no_rkm_medis);
  const nmPasien = getParamValue(params.nm_pasien);

  const qrValue = JSON.stringify({
    app: 'APAM',
    type: 'booking',
    no_booking: noBooking,
    no_reg: noReg,
    no_rkm_medis: noRkmMedis,
    tanggal_periksa: tanggalPeriksa,
    kd_dokter: getParamValue(params.kd_dokter),
    kd_poli: getParamValue(params.kd_poli),
    status,
  });

  const statusLower = status.toLowerCase();
  const statusColor = statusLower === 'terdaftar' ? '#2E7D32' : statusLower === 'batal' ? '#EF5350' : '#F59E0B';
  const statusBg = statusLower === 'terdaftar' ? '#E8F5E9' : statusLower === 'batal' ? '#FFEBEE' : '#FFF7ED';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#62B986', '#72C996']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tiket Booking</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticket}>
          <View style={styles.ticketTop}>
            <View style={styles.ticketTitleRow}>
              <Text style={styles.ticketTitle}>RS Atila Medika</Text>
              <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                <Text style={[styles.statusPillText, { color: statusColor }]}>{status || 'Menunggu'}</Text>
              </View>
            </View>
            <Text style={styles.ticketSubtitle}>Bukti pendaftaran online</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Hash size={16} color="#62B986" />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>No. Booking</Text>
                  <Text style={styles.infoValue}>{noBooking || '-'}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <CalendarDays size={16} color="#62B986" />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Tanggal Periksa</Text>
                  <Text style={styles.infoValue}>{tanggalPeriksa || '-'}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <MapPin size={16} color="#62B986" />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Poliklinik</Text>
                  <Text style={styles.infoValue}>{nmPoli}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <User size={16} color="#62B986" />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Dokter</Text>
                  <Text style={styles.infoValue}>{nmDokter}</Text>
                </View>
              </View>
            </View>

            {!!noReg && (
              <View style={styles.queueBox}>
                <Text style={styles.queueLabel}>No. Antrean</Text>
                <Text style={styles.queueValue}>{noReg}</Text>
              </View>
            )}
          </View>

          <View style={styles.perforationRow}>
            <View style={styles.perfHoleLeft} />
            <View style={styles.perfLine} />
            <View style={styles.perfHoleRight} />
          </View>

          <View style={styles.ticketBottom}>
            <View style={styles.qrWrap}>
              <View style={styles.qrBox}>
                <QRCode
                  value={qrValue}
                  size={180}
                  backgroundColor="transparent"
                  color="#111827"
                />
              </View>
              <Text style={styles.qrHint}>Tunjukkan QR ini saat verifikasi.</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Dipesan: {tanggalBooking || '-'}</Text>
              <Text style={styles.metaText}>
                {nmPasien ? `Pasien: ${nmPasien}` : noRkmMedis ? `No. RM: ${noRkmMedis}` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Catatan</Text>
          <Text style={styles.noteText}>
            Datang sesuai jadwal dan siapkan identitas. Jika ada perubahan jadwal, hubungi petugas pendaftaran.
          </Text>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    padding: 16,
    paddingBottom: 140,
  },
  ticket: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  ticketTop: {
    padding: 16,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  ticketSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  infoGrid: {
    marginTop: 14,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
  },
  infoValue: {
    marginTop: 2,
    fontSize: 14,
    color: '#111827',
    fontWeight: '800',
  },
  queueBox: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    alignItems: 'center',
  },
  queueLabel: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  queueValue: {
    marginTop: 4,
    fontSize: 28,
    color: '#2E7D32',
    fontWeight: '900',
    letterSpacing: 1,
  },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    backgroundColor: '#FFFFFF',
  },
  perfHoleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginLeft: -12,
  },
  perfHoleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginRight: -12,
  },
  perfLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderStyle: Platform.OS === 'web' ? 'dashed' : 'dashed',
  },
  ticketBottom: {
    padding: 16,
    paddingTop: 6,
  },
  qrWrap: {
    alignItems: 'center',
  },
  qrBox: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  metaRow: {
    marginTop: 14,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  noteBox: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
    lineHeight: 18,
  },
});

