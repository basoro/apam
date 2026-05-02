import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Stethoscope, ClipboardList, Users, Bed, Calendar, ChevronRight, Bell, Beaker, Radiation, Pill, LayoutGrid, CalendarDays, History, Hotel, UserPlus } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const { width } = Dimensions.get('window');
const DEFAULT_ARTICLE_IMAGES = [
  require('../../assets/images/article_heart.png'),
  require('../../assets/images/article_mental.png'),
];

type HomeArticle = {
  id: string;
  newsId?: string;
  title: string;
  category: string;
  date: string;
  image: number | { uri: string };
};

type HomeDoctor = {
  id: string;
  name: string;
  specialty: string;
  time: string;
  image: { uri: string };
};

const resolvePersonalPasienPhoto = (photoValue: string): { uri: string } | null => {
  const normalized = photoValue.replace(/\\/g, '/').trim();
  if (!normalized) return null;
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return { uri: normalized };
  }

  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!baseUrl) return null;

  const relative = normalized.startsWith('/') ? normalized.slice(1) : normalized;
  if (relative.startsWith('uploads/')) {
    return { uri: `${baseUrl}/${relative}` };
  }

  if (relative.startsWith('photopasien/')) {
    return { uri: `${baseUrl}/uploads/${relative}` };
  }

  return { uri: `${baseUrl}/uploads/photopasien/${relative}` };
};

const normalizeDay = (value: string) => value.toLowerCase().replace(/\s+/g, '').trim();

const getTodayDayAliases = () => {
  const dayId = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date()).toLowerCase();
  const mapToEn: Record<string, string> = {
    minggu: 'sunday',
    senin: 'monday',
    selasa: 'tuesday',
    rabu: 'wednesday',
    kamis: 'thursday',
    jumat: 'friday',
    sabtu: 'saturday',
  };

  return new Set([normalizeDay(dayId), normalizeDay(mapToEn[dayId] || dayId)]);
};

const resolvePegawaiPhoto = (photoValue: string): { uri: string } | null => {
  const normalized = photoValue.replace(/\\/g, '/').trim();
  if (!normalized) return null;

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return { uri: normalized };
  }

  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!baseUrl) return null;

  if (normalized.includes('/uploads/')) {
    const fullPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return { uri: `${baseUrl}${fullPath}` };
  }

  return { uri: `${baseUrl}/uploads/penggajian/${normalized}` };
};

const fetchPegawaiPhotoByDoctor = async (doctorName: string, doctorCode: string): Promise<{ uri: string } | null> => {
  const attempts = [
    { s: doctorName, col: 'nama' },
    { s: doctorName, col: 'nm_pegawai' },
    { s: doctorCode, col: 'nik' },
    { s: doctorCode, col: 'kd_dokter' },
  ];

  for (const attempt of attempts) {
    try {
      if (!attempt.s) continue;
      const res = await api.master.list('pegawai', {
        page: 1,
        per_page: 1,
        s: attempt.s,
        col: attempt.col,
      });
      const rows = (res.data as any)?.data || [];
      const first = Array.isArray(rows) ? rows[0] : null;
      const photoValue = first?.photo || first?.foto || '';
      if (typeof photoValue === 'string' && photoValue.trim()) {
        const resolved = resolvePegawaiPhoto(photoValue);
        if (resolved) return resolved;
      }
    } catch {
      // lanjut ke skenario pencarian berikutnya
    }
  }

  return null;
};

const formatArticleDate = (value: string | undefined) => {
  if (!value) return '-';
  const trimmed = value.trim();
  const numericValue = Number(trimmed);

  let date: Date;
  if (!Number.isNaN(numericValue) && /^\d+$/.test(trimmed)) {
    // Unix timestamp 10 digit (detik) atau 13 digit (milidetik)
    const timestamp = trimmed.length <= 10 ? numericValue * 1000 : numericValue;
    date = new Date(timestamp);
  } else {
    date = new Date(trimmed);
  }

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const resolveArticleImage = (candidate: any, fallbackIndex: number): number | { uri: string } => {
  const imageValue =
    candidate?.cover_photo ||
    candidate?.cover_image ||
    candidate?.image ||
    candidate?.cover ||
    candidate?.thumbnail ||
    candidate?.photo ||
    candidate?.featured_image;

  if (typeof imageValue === 'string' && imageValue.trim()) {
    if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
      return { uri: imageValue };
    }

    const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
    const normalized = imageValue.replace(/\\/g, '/').trim();

    // API kadang kirim nama file saja, jadi pakai folder default upload news.
    const imagePath = normalized.includes('/uploads/website/news/')
      ? (normalized.startsWith('/') ? normalized : `/${normalized}`)
      : normalized.startsWith('/')
        ? normalized
        : `/uploads/website/news/${normalized}`;

    if (baseUrl) return { uri: `${baseUrl}${imagePath}` };
  }

  return DEFAULT_ARTICLE_IMAGES[fallbackIndex % DEFAULT_ARTICLE_IMAGES.length];
};

const mapToHomeArticle = (detailData: any, fallbackData: any, index: number): HomeArticle => {
  const source = detailData || fallbackData || {};
  const idValue =
    source?.news_id ||
    source?.id ||
    source?.id_website ||
    fallbackData?.news_id ||
    fallbackData?.id ||
    `news-${index}`;

  return {
    id: String(idValue),
    newsId: source?.news_id || source?.id || source?.id_website
      ? String(source?.news_id || source?.id || source?.id_website)
      : undefined,
    title: source?.title || source?.judul || 'Artikel',
    category: source?.category || source?.kategori || source?.tag || 'Kesehatan',
    date: formatArticleDate(source?.published_at || source?.created_at || source?.date),
    image: resolveArticleImage(source, index),
  };
};

export default function HomeScreen() {
  const { session } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [ralanCount, setRalanCount] = useState(0);
  const [ranapCount, setRanapCount] = useState(0);
  const [articles, setArticles] = useState<HomeArticle[]>([]);
  const [todayDoctors, setTodayDoctors] = useState<HomeDoctor[]>([]);
  const [brokenArticleImages, setBrokenArticleImages] = useState<Record<string, boolean>>({});
  const [homeAvatar, setHomeAvatar] = useState<{ uri: string } | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const isLoggedIn = !!session?.no_rkm_medis;
  const displayName = session?.nm_pasien || session?.no_rkm_medis || 'Tamu';
  const avatarInitial = isLoggedIn
    ? ((displayName || 'P')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'P')
    : 'T';

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch Ralan Count (Today)
      const ralanRes = await api.rawatJalan.list({
        tgl_awal: today,
        tgl_akhir: today,
        per_page: 1
      });
      const ralanTotal = (ralanRes.data as any)?.meta?.total || 0;
      setRalanCount(ralanTotal);

      // Fetch Ranap Count
      const ranapRes = await api.rawatInap.list({
        stts_pulang: '-',
        per_page: 1
      });
      const ranapTotal = (ranapRes.data as any)?.meta?.total || 0;
      setRanapCount(ranapTotal);

      // Fetch Jadwal Dokter Hari Ini (mengikuti pola di halaman jadwal-dokter)
      try {
        const [jadwalRes, dokterRes, poliRes] = await Promise.all([
          api.master.list('jadwal'),
          api.master.list('dokter'),
          api.master.list('poliklinik'),
        ]);

        const schedules = (jadwalRes.data as any)?.data || [];
        const doctors = (dokterRes.data as any)?.data || [];
        const clinics = (poliRes.data as any)?.data || [];
        const todayAliases = getTodayDayAliases();
        const doctorMap: Record<string, string> = {};
        const clinicMap: Record<string, string> = {};

        doctors.forEach((d: any) => {
          doctorMap[String(d.kd_dokter)] = d.nm_dokter;
        });
        clinics.forEach((p: any) => {
          clinicMap[String(p.kd_poli)] = p.nm_poli;
        });

        const photoCache: Record<string, { uri: string }> = {};
        const schedulesToday = schedules
          .filter((item: any) => {
            const dayRaw = item?.hari_kerja || '';
            return dayRaw ? todayAliases.has(normalizeDay(String(dayRaw))) : false;
          })
          .slice(0, 8);

        const parsed: HomeDoctor[] = await Promise.all(
          schedulesToday.map(async (item: any, index: number) => {
            const doctorName = doctorMap[String(item.kd_dokter)] || item.kd_dokter || `Dokter ${index + 1}`;
            const clinicName = clinicMap[String(item.kd_poli)] || item.kd_poli || 'Poliklinik';
            const time = `${item?.jam_mulai || '-'} - ${item?.jam_selesai || '-'}`;
            const cacheKey = String(item?.kd_dokter || doctorName);
            let image = photoCache[cacheKey];

            if (!image) {
              const pegawaiPhoto = await fetchPegawaiPhotoByDoctor(String(doctorName), String(item?.kd_dokter || ''));
              image = pegawaiPhoto || {
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(String(doctorName))}&background=E8F5E9&color=2E7D32`,
              };
              photoCache[cacheKey] = image;
            }

            return {
              id: `jadwal-${item?.kd_dokter || index}-${item?.kd_poli || index}-${item?.jam_mulai || 'x'}`,
              name: doctorName,
              specialty: clinicName,
              time,
              image,
            };
          })
        );

        setTodayDoctors(parsed);
      } catch (doctorError) {
        console.error('Error fetching doctor schedule:', doctorError);
        setTodayDoctors([]);
      }

      // Fetch Artikel Terbaru (Website News)
      try {
        const websiteListRes = await api.website.list({
          draw: 1,
          start: 0,
          length: 3,
          search: '',
        });

        const listPayload = (websiteListRes.data as any)?.data ?? (websiteListRes.data as any)?.results ?? [];
        const newsList = Array.isArray(listPayload) ? listPayload.slice(0, 3) : [];

        const newsWithDetail = await Promise.all(
          newsList.map(async (item: any, index: number) => {
            const newsId = item?.news_id || item?.id || item?.id_website;
            if (!newsId) return mapToHomeArticle(item, item, index);

            try {
              const detailRes = await api.website.show(newsId);
              const detailPayload = (detailRes.data as any)?.data ?? detailRes.data;
              return mapToHomeArticle(detailPayload, item, index);
            } catch {
              return mapToHomeArticle(item, item, index);
            }
          })
        );

        setArticles(newsWithDetail);
        setBrokenArticleImages({});
      } catch (websiteError) {
        console.error('Error fetching website news:', websiteError);
        setArticles([]);
        setBrokenArticleImages({});
      }

      // Fetch avatar pasien dari personal_pasien
      try {
        if (!session?.no_rkm_medis) {
          setHomeAvatar(null);
          return;
        }

        const avatarRes = await api.master.list('personal_pasien', {
          page: 1,
          per_page: 1,
          s: session?.no_rkm_medis,
          col: 'no_rkm_medis',
        });
        const rows = (avatarRes.data as any)?.data || [];
        const first = Array.isArray(rows) ? rows[0] : rows;
        const photoValue = first?.gambar || first?.photo || first?.foto || '';
        setHomeAvatar(typeof photoValue === 'string' ? resolvePersonalPasienPhoto(photoValue) : null);
      } catch {
        setHomeAvatar(null);
      }

      // Fetch notifikasi unread untuk badge beranda
      try {
        if (!session?.no_rkm_medis) {
          setUnreadNotifications(0);
        } else {
          const notifRes = await api.master.list('mlite_notifications', {
            page: 1,
            per_page: 100,
            s: session.no_rkm_medis,
            col: 'no_rkm_medis',
          });
          const rows = ((notifRes.data as any)?.data || []) as any[];
          const unreadCount = rows.filter((item) => String(item?.status || '').toLowerCase() !== 'read').length;
          setUnreadNotifications(unreadCount);
        }
      } catch {
        setUnreadNotifications(0);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [session?.no_rkm_medis]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const menuItems = [
    {
      title: 'Jadwal\nDokter',
      icon: <Users size={24} color="#FFFFFF" />,
      route: '/(tabs)/jadwal-dokter',
      colors: ['#5B8DEF', '#7DA9FF'] as const,
    },
    {
      title: 'Rawat\nJalan',
      icon: <Stethoscope size={24} color="#FFFFFF" />,
      route: '/(tabs)/rawat-jalan',
      colors: ['#42C2A8', '#6EDDC7'] as const,
    },
    {
      title: 'Rawat\nInap',
      icon: <Hotel size={24} color="#FFFFFF" />,
      route: '/(tabs)/rawat-inap',
      colors: ['#8A6CFF', '#A78BFF'] as const,
    },
    {
      title: 'Kamar\nTersedia',
      icon: <MaterialCommunityIcons name="bed-empty" size={24} color="#FFFFFF" />,
      route: '/(tabs)/kamar',
      colors: ['#F59E0B', '#FBBF24'] as const,
    },
    {
      title: 'Tarif\nLaborat',
      icon: <Beaker size={24} color="#FFFFFF" />,
      route: '/(tabs)/laboratorium',
      colors: ['#14B8A6', '#2DD4BF'] as const,
    },
    {
      title: 'Tarif\nRadiologi',
      icon: <Radiation size={24} color="#FFFFFF" />,
      route: '/(tabs)/radiologi',
      colors: ['#EF4444', '#F97316'] as const,
    },
    {
      title: 'Tarif\nFarmasi',
      icon: <Pill size={24} color="#FFFFFF" />,
      route: '/(tabs)/farmasi',
      colors: ['#EC4899', '#F472B6'] as const,
    },
    {
      title: 'Item\nSelanjutnya',
      icon: <LayoutGrid size={24} color="#FFFFFF" />,
      route: '/(tabs)/more',
      colors: ['#6366F1', '#818CF8'] as const,
    },
  ];

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#62B986" />
        }
      >
      {/* Green Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Beranda</Text>
          <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/(tabs)/notifikasi')}>
            <Bell size={24} color="#000" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          {isLoggedIn && homeAvatar ? (
            <Image source={homeAvatar} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{avatarInitial}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.greetingText}>Hi , {displayName.toUpperCase()}</Text>
            <Text style={styles.welcomeText}>Selamat datang di RS Atila Medika</Text>
          </View>
        </View>
      </View>

      <View style={styles.daftarCardContainer}>
        <View style={styles.daftarCard}>
          <LinearGradient
            colors={['#E8F8EE', '#F4FCF7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.daftarCardBg}
          />
          <View style={styles.daftarAccentOne} />
          <View style={styles.daftarAccentTwo} />
          <View style={styles.daftarBadge}>
            <Text style={styles.daftarBadgeText}>Layanan Cepat</Text>
          </View>
          <Text style={styles.daftarTitle}>Daftar Mandiri</Text>
          <Text style={styles.daftarSubtitle}>
            Silahkan lakukan pendaftaran mandiri klinik rawat jalan.
          </Text>
          <TouchableOpacity
            style={styles.daftarButton}
            onPress={() => router.push('/(tabs)/daftar')}
          >
            <UserPlus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.daftarButtonText}>Daftar Antrian</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Grid */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <LinearGradient
              colors={item.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuIconContainer}
            >
              {item.icon}
            </LinearGradient>
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Jadwal Dokter Hari Ini */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Jadwal Dokter Hari Ini</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.doctorScroll}>
          {todayDoctors.map((doctor) => (
            <View key={doctor.id} style={styles.doctorCard}>
              <Image
                source={doctor.image}
                style={styles.doctorImage}
              />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                <View style={styles.doctorTimeContainer}>
                  <Ionicons name="time-outline" size={14} color="#62B986" />
                  <Text style={styles.doctorTime}>{doctor.time}</Text>
                </View>
              </View>
            </View>
          ))}
          {todayDoctors.length === 0 && (
            <View style={styles.doctorEmptyWrap}>
              <Text style={styles.doctorEmptyText}>Belum ada jadwal dokter untuk hari ini.</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Banner Promo */}
      <View style={styles.promoContainer}>
        <Image
          source={require('../../assets/images/promo_banner.png')}
          style={styles.promoBanner}
          resizeMode="cover"
        />
      </View>

      {/* Artikel Terbaru */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Artikel Terbaru</Text>
        {articles.map((article, index) => (
          <TouchableOpacity
            key={article.id}
            activeOpacity={0.85}
            onPress={() => {
              if (!article.newsId) return;
              router.push(`/news/${article.newsId}` as any);
            }}
            style={[styles.articleCard, { marginBottom: 12 }]}
          >
            <Image
              source={
                brokenArticleImages[article.id]
                  ? DEFAULT_ARTICLE_IMAGES[index % DEFAULT_ARTICLE_IMAGES.length]
                  : article.image
              }
              style={styles.articleImage}
              onError={() =>
                setBrokenArticleImages((prev) =>
                  prev[article.id] ? prev : { ...prev, [article.id]: true }
                )
              }
            />
            <View style={styles.articleContent}>
              <Text style={styles.articleCategory}>{article.category}</Text>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleDate}>{article.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {articles.length === 0 && (
          <Text style={styles.articleEmptyText}>Belum ada artikel terbaru.</Text>
        )}
      </View>

        <View style={{ height: 120 }} />
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
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerContainer: {
    backgroundColor: '#62B986',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 80, // Extra padding for overlap
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 16,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E7D32',
  },
  profileInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  daftarCardContainer: {
    marginTop: -50,
    paddingHorizontal: 24,
  },
  daftarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#D9EFE3',
  },
  daftarCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  daftarAccentOne: {
    position: 'absolute',
    right: -25,
    top: -25,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(98,185,134,0.14)',
  },
  daftarAccentTwo: {
    position: 'absolute',
    left: -35,
    bottom: -35,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(98,185,134,0.09)',
  },
  daftarBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DDF4E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  daftarBadgeText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  daftarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  daftarSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  daftarButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#62B986',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#62B986',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  daftarButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 0,
  },
  menuItem: {
    alignItems: 'center',
    width: (width - 48) / 4,
    marginBottom: 20,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  menuText: {
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  doctorScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    width: 280,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8, // for shadow
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  doctorTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  doctorEmptyWrap: {
    width: width - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    marginBottom: 8,
  },
  doctorEmptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  articleImage: {
    width: 100,
    height: 100,
  },
  articleContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  articleCategory: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  articleDate: {
    fontSize: 12,
    color: '#999',
  },
  articleEmptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  promoContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  promoBanner: {
    width: '100%',
    height: 160,
    borderRadius: 16,
  },
});
