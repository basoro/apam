import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Calendar, User, MapPin, Activity, Clock, DoorOpen, BedDouble, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function RiwayatScreen() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ralan'); // 'ralan' or 'ranap'
  const [loading, setLoading] = useState(true);

  // Data States
  const [history, setHistory] = useState([]);
  const [inpatientHistory, setInpatientHistory] = useState([]);

  // Mapping States
  const [doctorMap, setDoctorMap] = useState<any>({});
  const [clinicMap, setClinicMap] = useState<any>({});
  const [roomMap, setRoomMap] = useState<any>({});
  const [wardMap, setWardMap] = useState<any>({});

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
      const [historyRes, dokterRes, poliRes, ranapRes, kamarRes, bangsalRes] = await Promise.all([
        api.master.list('reg_periksa', { s: session?.no_rkm_medis, col: 'no_rkm_medis' }),
        api.master.list('dokter'),
        api.master.list('poliklinik'),
        api.master.list('kamar_inap'),
        api.master.list('kamar'),
        api.master.list('bangsal')
      ]);

      const ralanData = historyRes.data.data || [];
      const ranapRawData = ranapRes.data.data || [];
      const doctors = dokterRes.data.data || [];
      const clinics = poliRes.data.data || [];
      const rooms = kamarRes.data.data || [];
      const wards = bangsalRes.data.data || [];

      // Create Maps
      const dMap: any = {};
      doctors.forEach((d: any) => dMap[d.kd_dokter] = d.nm_dokter);

      const pMap: any = {};
      clinics.forEach((p: any) => pMap[p.kd_poli] = p.nm_poli);

      const wMap: any = {};
      wards.forEach((w: any) => wMap[w.kd_bangsal] = w.nm_bangsal);

      const rMap: any = {};
      rooms.forEach((r: any) => rMap[r.kd_kamar] = { class: r.kelas, ward: wMap[r.kd_bangsal] });

      setDoctorMap(dMap);
      setClinicMap(pMap);
      setRoomMap(rMap);
      setWardMap(wMap);

      // 1. Process Rawat Jalan (Sort by date)
      const sortedRalan = ralanData.sort((a: any, b: any) => {
        const dateA = new Date(`${a.tgl_registrasi}T${a.jam_reg}`);
        const dateB = new Date(`${b.tgl_registrasi}T${b.jam_reg}`);
        return dateB.getTime() - dateA.getTime();
      });
      setHistory(sortedRalan);

      // 2. Process Rawat Inap (Filter by patient and join data)
      // Extract all valid 'no_rawat' for this patient from reg_periksa
      const patientNoRawat = new Set(ralanData.map((v: any) => v.no_rawat));

      const myRanap = ranapRawData.filter((stay: any) =>
        patientNoRawat.has(stay.no_rawat)
      ).sort((a: any, b: any) => {
        // Sort by check-in date descending
        const dateA = new Date(`${a.tgl_masuk}T${a.jam_masuk}`);
        const dateB = new Date(`${b.tgl_masuk}T${b.jam_masuk}`);
        return dateB.getTime() - dateA.getTime();
      });

      setInpatientHistory(myRanap);

    } catch (error) {
      console.error('Error fetching visit details:', error);
    } finally {
      setLoading(false);
    }
  };

  const decodeStatus = (stts: string) => {
    switch (stts) {
      case 'Sudah': return { label: 'Selesai', color: '#62B986', bg: '#E8F5E9' };
      case 'Belum': return { label: 'Menunggu', color: '#FFA726', bg: '#FFF3E0' };
      case 'Batal': return { label: 'Batal', color: '#EF5350', bg: '#FFEBEE' };
      case 'Dirawat': return { label: 'Dirawat', color: '#2196F3', bg: '#E3F2FD' };
      default: return { label: stts || 'Status', color: '#666', bg: '#F5F5F5' };
    }
  };

  const renderRalanItem = ({ item }: { item: any }) => {
    const status = decodeStatus(item.stts);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({
          pathname: '/riwayat-perawatan',
          params: { no_rawat: item.no_rawat.replace(/\//g, ''), type: 'ralan' }
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.visitInfo}>
            <Text style={styles.noRawatLabel}>No. Rawat</Text>
            <Text style={styles.noRawatValue}>{item.no_rawat}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.contentRow}>
          <View style={styles.iconBox}>
            <User size={18} color="#62B986" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.label}>Dokter Pemeriksa</Text>
            <Text style={styles.value}>{doctorMap[item.kd_dokter] || item.kd_dokter}</Text>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.iconBox}>
            <MapPin size={18} color="#62B986" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.label}>Poliklinik</Text>
            <Text style={styles.value}>{clinicMap[item.kd_poli] || item.kd_poli}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Calendar size={14} color="#666" style={{ marginRight: 4 }} />
            <Text style={styles.footerText}>{item.tgl_registrasi}</Text>
          </View>
          <View style={styles.regBadge}>
            <Activity size={12} color="#62B986" style={{ marginRight: 4 }} />
            <Text style={styles.regText}>Antrean #{item.no_reg}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRanapItem = ({ item }: { item: any }) => {
    const isActive = item.stts_pulang === '-' || item.tgl_keluar === '0000-00-00';
    const roomInfo = roomMap[item.kd_kamar] || { class: 'Pilih Kelas', ward: 'Bangsal Umum' };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({
          pathname: '/riwayat-perawatan',
          params: { no_rawat: item.no_rawat.replace(/\//g, ''), type: 'ranap' }
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.visitInfo}>
            <Text style={styles.noRawatLabel}>No. Rawat</Text>
            <Text style={styles.noRawatValue}>{item.no_rawat}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E3F2FD' : '#E8F5E9' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#2196F3' : '#62B986' }]}>
              {isActive ? 'Masih Dirawat' : 'Sudah Pulang'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.roomContainer}>
          <View style={styles.roomIconBox}>
            <DoorOpen size={24} color="#62B986" />
          </View>
          <View style={styles.roomData}>
            <Text style={styles.roomName}>{roomInfo.ward || 'Kamar Rawat'}</Text>
            <View style={styles.classRow}>
              <BedDouble size={14} color="#999" style={{ marginRight: 4 }} />
              <Text style={styles.roomClass}>{roomInfo.class} • Kode: {item.kd_kamar}</Text>
            </View>
          </View>
        </View>

        <View style={styles.stayRange}>
          <View style={styles.stayDate}>
            <Text style={styles.dateLabel}>Tanggal Masuk</Text>
            <Text style={styles.dateValue}>{item.tgl_masuk}</Text>
            <Text style={styles.timeValue}>{item.jam_masuk}</Text>
          </View>
          <ArrowRight size={20} color="#CCC" style={{ marginHorizontal: 12 }} />
          <View style={styles.stayDate}>
            <Text style={styles.dateLabel}>Tanggal Keluar</Text>
            <Text style={styles.dateValue}>
              {isActive ? '...' : item.tgl_keluar}
            </Text>
            {!isActive && <Text style={styles.timeValue}>{item.jam_keluar}</Text>}
          </View>
        </View>

        {item.diagnosa_awal && (
          <View style={styles.diagnosaBox}>
            <CheckCircle2 size={14} color="#62B986" style={{ marginRight: 6 }} />
            <Text style={styles.diagnosaText}>Diagnosa: {item.diagnosa_awal}</Text>
          </View>
        )}
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
            <Text style={styles.headerTitle}>Riwayat Medis</Text>
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Login Diperlukan</Text>
          <Text style={styles.emptySubtitle}>
            Silakan login terlebih dahulu untuk melihat data riwayat medis Anda.
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
          <Text style={styles.headerTitle}>Riwayat Medis</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ralan' && styles.activeTab]}
            onPress={() => setActiveTab('ralan')}
          >
            <Text style={[styles.tabText, activeTab === 'ralan' && styles.activeTabText]}>Rawat Jalan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ranap' && styles.activeTab]}
            onPress={() => setActiveTab('ranap')}
          >
            <Text style={[styles.tabText, activeTab === 'ranap' && styles.activeTabText]}>Rawat Inap</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#62B986" />
          <Text style={styles.loadingText}>Memuat riwayat...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'ralan' ? history : inpatientHistory}
          renderItem={activeTab === 'ralan' ? renderRalanItem : renderRanapItem}
          keyExtractor={(item, index) => (item.no_rawat || index).toString() + index}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6598/6598519.png' }}
                style={styles.emptyImage}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'ralan' ? 'Belum Ada Kunjungan' : 'Belum Ada Riwayat Inap'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Anda belum memiliki catatan {activeTab === 'ralan' ? 'pemeriksaan' : 'rawat inap'}.
              </Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  activeTabText: {
    color: '#62B986',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  visitInfo: {
    flex: 1,
  },
  noRawatLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  noRawatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F3F3',
    marginBottom: 14,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoText: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F3F3',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  regBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  regText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#62B986',
  },
  // Inpatient Specific Styles
  roomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  roomIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roomData: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomClass: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  stayRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  stayDate: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dateLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  diagnosaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 12,
  },
  diagnosaText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
    flex: 1,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
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
