import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Calendar, User, MapPin, CheckCircle, Clock } from 'lucide-react-native';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function BookingScreen() {
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [doctorMap, setDoctorMap] = useState<any>({});
  const [clinicMap, setClinicMap] = useState<any>({});

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/login');
    } else if (session) {
      fetchData();
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
    return (
      <View style={styles.card}>
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
            <Text style={styles.value}>{doctorMap[item.kd_dokter] || item.kd_dokter}</Text>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.iconBox}>
            <MapPin size={20} color="#62B986" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.label}>Poliklinik</Text>
            <Text style={styles.value}>{clinicMap[item.kd_poli] || item.kd_poli}</Text>
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
      </View>
    );
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#62B986" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#62B986', '#72C996']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Booking</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    paddingBottom: 40,
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
    paddingTop: 80,
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
