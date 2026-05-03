import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Calendar, User, MapPin, CheckCircle, Clock } from 'lucide-react-native';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function BookingScreen() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [doctorMap, setDoctorMap] = useState<any>({});
  const [clinicMap, setClinicMap] = useState<any>({});

  useEffect(() => {
    if (session) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [session, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingRes, dokterRes, poliRes] = await Promise.all([
        api.master.list('booking_registrasi'),
        api.master.list('dokter'),
        api.master.list('poliklinik')
      ]);

      const allBookings = bookingRes.data.data || [];
      const doctors = dokterRes.data.data || [];
      const clinics = poliRes.data.data || [];

      // Create maps for name lookup
      const dMap: any = {};
      doctors.forEach((d: any) => dMap[d.kd_dokter] = d.nm_dokter);

      const pMap: any = {};
      clinics.forEach((p: any) => pMap[p.kd_poli] = p.nm_poli);

      setDoctorMap(dMap);
      setClinicMap(pMap);

      // Filter by session's no_rkm_medis
      const myBookings = allBookings.filter((b: any) => 
        String(b.no_rkm_medis) === String(session?.no_rkm_medis)
      ).sort((a: any, b: any) => 
        new Date(b.tanggal_booking).getTime() - new Date(a.tanggal_booking).getTime()
      );

      setBookings(myBookings);
    } catch (error) {
      console.error('Error fetching booking history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Terdaftar': 
        return { color: '#62B986', bg: '#E8F5E9', label: 'Terdaftar' };
      case 'Batal': 
        return { color: '#EF5350', bg: '#FFEBEE', label: 'Dibatalkan' };
      default: 
        return { color: '#FFA726', bg: '#FFF3E0', label: status || 'Menunggu' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = getStatusBadge(item.status);
    const dokterName = doctorMap[item.kd_dokter] || item.kd_dokter || '-';
    const poliName = clinicMap[item.kd_poli] || item.kd_poli || '-';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: '/booking-ticket',
            params: {
              no_booking: String(item.no_booking || ''),
              no_reg: String(item.no_reg || ''),
              status: String(item.status || ''),
              tanggal_booking: String(item.tanggal_booking || ''),
              tanggal_periksa: String(item.tanggal_periksa || ''),
              kd_dokter: String(item.kd_dokter || ''),
              nm_dokter: String(dokterName),
              kd_poli: String(item.kd_poli || ''),
              nm_poli: String(poliName),
              no_rkm_medis: String(session?.no_rkm_medis || ''),
              nm_pasien: String((session as any)?.nm_pasien || ''),
            },
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.bookingIdContainer}>
            <Text style={styles.bookingLabel}>No. Booking</Text>
            <Text style={styles.bookingId}>{item.no_booking}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.contentRow}>
          <View style={styles.iconBox}>
            <User size={20} color="#62B986" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.label}>Dokter</Text>
            <Text style={styles.value}>{dokterName}</Text>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.iconBox}>
            <MapPin size={20} color="#62B986" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.label}>Poliklinik</Text>
            <Text style={styles.value}>{poliName}</Text>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.iconBox}>
            <Calendar size={20} color="#62B986" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.label}>Tanggal Periksa</Text>
            <Text style={styles.value}>{item.tanggal_periksa}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.regInfo}>
            <Clock size={14} color="#666" style={{ marginRight: 4 }} />
            <Text style={styles.regTime}>Dipesan pada {item.tanggal_booking}</Text>
          </View>
          {item.no_reg && (
            <View style={styles.regBadge}>
              <Text style={styles.regText}>No. Antrean: {item.no_reg}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#62B986" />
        <BlurView
          intensity={30}
          tint="light"
          style={styles.bottomBlurOverlay}
          experimentalBlurMethod="dimezisBlurView"
        />
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
            <Text style={styles.headerTitle}>Riwayat Booking</Text>
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Login Diperlukan</Text>
          <Text style={styles.emptySubtitle}>
            Silakan login terlebih dahulu untuk melihat data booking Anda.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/login')}>
            <Text style={styles.actionButtonText}>Ke Halaman Login</Text>
          </TouchableOpacity>
        </View>
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
      <LinearGradient colors={['#62B986', '#72C996']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Riwayat Booking</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#62B986" />
          <Text style={styles.loadingText}>Memuat riwayat booking...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item.no_booking || index).toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6598/6598519.png' }} 
                style={styles.emptyImage}
              />
              <Text style={styles.emptyTitle}>Belum Ada Booking</Text>
              <Text style={styles.emptySubtitle}>
                Anda belum memiliki riwayat pendaftaran online. Silakan buat janji temu melalui menu Daftar.
              </Text>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/daftar')}
              >
                <Text style={styles.actionButtonText}>Booking Sekarang</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
  center: {
    flex: 1,
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingIdContainer: {
    flex: 1,
  },
  bookingLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  bookingId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  regInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regTime: {
    fontSize: 11,
    color: '#666',
  },
  regBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  regText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1976D2',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
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
