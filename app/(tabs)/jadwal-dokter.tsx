import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Search, User, Clock, MapPin, Calendar } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';

type DoctorScheduleItem = {
  kd_poli: string;
  nm_poli: string;
  hari_kerja: string;
  jam_mulai: string;
  jam_selesai: string;
};

type GroupedDoctorSchedule = {
  kd_dokter: string;
  nm_dokter: string;
  items: DoctorScheduleItem[];
};

export default function JadwalDokterScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GroupedDoctorSchedule[]>([]);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState<GroupedDoctorSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const normalizeDay = (value: string) => value.toLowerCase().replace(/\s+/g, '').trim();

  const dayAliasesByIndex: Record<number, string[]> = {
    0: ['ahad', 'minggu', 'sunday'],
    1: ['senin', 'monday'],
    2: ['selasa', 'tuesday'],
    3: ['rabu', 'wednesday'],
    4: ['kamis', 'thursday'],
    5: ['jumat', "jum'at", 'friday'],
    6: ['sabtu', 'saturday'],
  };

  const formatDateLabel = (date: Date) =>
    new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);

  const formatDateParamLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatMonthLabel = (date: Date) =>
    new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const buildCalendarDays = (monthDate: Date): (Date | null)[] => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Senin=0

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const applyFilters = (baseData: GroupedDoctorSchedule[], searchText: string, date: Date) => {
    const selectedDayAliases = new Set((dayAliasesByIndex[date.getDay()] || []).map(normalizeDay));
    const searchLower = searchText.toLowerCase().trim();

    const groupedByDate = baseData
      .map((doctor) => ({
        ...doctor,
        items: doctor.items.filter((schedule) =>
          selectedDayAliases.has(normalizeDay(schedule.hari_kerja))
        ),
      }))
      .filter((doctor) => doctor.items.length > 0);

    if (!searchLower) return groupedByDate;

    return groupedByDate.filter((doctor) => {
      const docName = (doctor.nm_dokter || '').toLowerCase();
      const scheduleText = doctor.items
        .map((schedule) => `${schedule.nm_poli} ${schedule.hari_kerja} ${schedule.jam_mulai} ${schedule.jam_selesai}`)
        .join(' ')
        .toLowerCase();

      return docName.includes(searchLower) || scheduleText.includes(searchLower);
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jadwalRes, dokterRes, poliRes] = await Promise.all([
        api.master.list('jadwal'),
        api.master.list('dokter'),
        api.master.list('poliklinik')
      ]);

      const schedules = jadwalRes.data.data || [];
      const doctors = dokterRes.data.data || [];
      const clinics = poliRes.data.data || [];

      // Create maps for name lookup
      const dMap: any = {};
      doctors.forEach((d: any) => dMap[d.kd_dokter] = d.nm_dokter);

      const pMap: any = {};
      clinics.forEach((p: any) => pMap[p.kd_poli] = p.nm_poli);

      const groupedMap: Record<string, GroupedDoctorSchedule> = {};

      schedules.forEach((item: any) => {
        const kdDokter = String(item.kd_dokter || '');
        if (!kdDokter) return;
        if (!groupedMap[kdDokter]) {
          groupedMap[kdDokter] = {
            kd_dokter: kdDokter,
            nm_dokter: dMap[kdDokter] || kdDokter,
            items: [],
          };
        }

        groupedMap[kdDokter].items.push({
          kd_poli: String(item.kd_poli || ''),
          nm_poli: pMap[item.kd_poli] || item.kd_poli || '-',
          hari_kerja: String(item.hari_kerja || '-'),
          jam_mulai: String(item.jam_mulai || '-'),
          jam_selesai: String(item.jam_selesai || '-'),
        });
      });

      const groupedSchedules = Object.values(groupedMap).map((doctorGroup) => ({
        ...doctorGroup,
        items: doctorGroup.items.sort((a, b) => {
          if (a.nm_poli !== b.nm_poli) return a.nm_poli.localeCompare(b.nm_poli);
          if (a.hari_kerja !== b.hari_kerja) return a.hari_kerja.localeCompare(b.hari_kerja);
          return a.jam_mulai.localeCompare(b.jam_mulai);
        }),
      }));

      setData(groupedSchedules);
      setFilteredData(applyFilters(groupedSchedules, search, selectedDate));
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    setFilteredData(applyFilters(data, text, selectedDate));
  };

  const handlePickDate = (date: Date) => {
    setSelectedDate(date);
    setFilteredData(applyFilters(data, search, date));
    setShowCalendar(false);
  };

  const handleSelectDoctor = (item: GroupedDoctorSchedule) => {
    if (!session) {
      setShowLoginRequired(true);
      return;
    }

    const firstSchedule = item.items[0];
    router.push({
      pathname: '/(tabs)/daftar',
      params: {
        openPasienLama: '1',
        preselectDokter: item.kd_dokter,
        preselectDokterName: item.nm_dokter,
        preselectPoli: firstSchedule?.kd_poli || '',
        preselectPoliName: firstSchedule?.nm_poli || '',
        preselectTanggal: formatDateParamLocal(selectedDate),
      },
    });
  };

  const renderItem = ({ item }: { item: GroupedDoctorSchedule }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => handleSelectDoctor(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <User size={20} color="#62B986" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.doctorName}>{item.nm_dokter}</Text>
          <Text style={styles.clinicHint}>Tap untuk booking Pasien Lama</Text>
        </View>
      </View>
      
      <View style={styles.divider} />

      {item.items.map((schedule, index) => (
        <View key={`${item.kd_dokter}-${schedule.kd_poli}-${schedule.hari_kerja}-${index}`} style={styles.scheduleRow}>
          <View style={styles.clinicRow}>
            <MapPin size={12} color="#999" style={styles.miniIcon} />
            <Text style={styles.clinicName}>{schedule.nm_poli}</Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.timeInfo}>
              <Calendar size={14} color="#62B986" style={styles.miniIcon} />
              <Text style={styles.dayText}>{schedule.hari_kerja}</Text>
            </View>
            <View style={styles.timeBadge}>
              <Clock size={14} color="#2196F3" style={styles.miniIcon} />
              <Text style={styles.timeText}>{schedule.jam_mulai} - {schedule.jam_selesai}</Text>
            </View>
          </View>
          {index < item.items.length - 1 ? <View style={styles.innerDivider} /> : null}
        </View>
      ))}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#62B986', '#72C996']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jadwal Dokter</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama dokter, klinik, atau hari..."
            value={search}
            onChangeText={handleSearch}
          />
          <TouchableOpacity
            style={styles.calendarInlineButton}
            onPress={() => {
              setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
              setShowCalendar(true);
            }}
          >
            <Calendar size={18} color="#2E7D32" />
          </TouchableOpacity>
        </View>
        <Text style={styles.dateFilterText}>{formatDateLabel(selectedDate)}</Text>
      </View>

      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() =>
                  setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
              >
                <ChevronLeft size={18} color="#2E7D32" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>{formatMonthLabel(calendarMonth)}</Text>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() =>
                  setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
              >
                <ChevronRight size={18} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {buildCalendarDays(calendarMonth).map((date, index) => (
                <TouchableOpacity
                  key={`cell-${index}`}
                  style={[
                    styles.dayCell,
                    date && isSameDay(date, selectedDate) ? styles.dayCellSelected : null,
                  ]}
                  disabled={!date}
                  onPress={() => date && handlePickDate(date)}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      date && isSameDay(date, selectedDate) ? styles.dayCellTextSelected : null,
                      !date ? styles.dayCellTextDisabled : null,
                    ]}
                  >
                    {date ? date.getDate() : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.calendarCloseButton} onPress={() => setShowCalendar(false)}>
              <Text style={styles.calendarCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLoginRequired}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginRequired(false)}
      >
        <View style={styles.loginOverlay}>
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>Login Diperlukan</Text>
            <Text style={styles.loginSubtitle}>
              Silakan login terlebih dahulu untuk memilih dokter dan melanjutkan pendaftaran pasien lama.
            </Text>
            <View style={styles.loginActions}>
              <TouchableOpacity style={styles.loginCancelButton} onPress={() => setShowLoginRequired(false)}>
                <Text style={styles.loginCancelText}>Tutup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginGoButton}
                onPress={() => {
                  setShowLoginRequired(false);
                  router.push('/login');
                }}
              >
                <Text style={styles.loginGoText}>Ke Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#62B986" />
          <Text style={styles.loadingText}>Memuat jadwal dokter...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item: any, index: number) => `jadwal-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>Jadwal tidak ditemukan.</Text>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  calendarInlineButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateFilterText: {
    marginTop: 8,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '700',
    textAlign: 'center',
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarNavButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: '#62B986',
  },
  dayCellText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayCellTextDisabled: {
    color: '#D1D5DB',
  },
  calendarCloseButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2F7',
  },
  calendarCloseText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 12,
  },
  loginOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  loginActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  loginCancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  loginCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  loginGoButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#62B986',
  },
  loginGoText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
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
  clinicHint: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicName: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  scheduleRow: {
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniIcon: {
    marginRight: 6,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginTop: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
