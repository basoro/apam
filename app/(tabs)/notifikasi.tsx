import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, CheckCircle2, Circle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type NotificationItem = {
  id: number | string;
  judul: string;
  pesan: string;
  tanggal: string;
  no_rkm_medis: string;
  status: string;
};

const formatDateTime = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function NotifikasiScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => String(item.status || '').toLowerCase() !== 'read').length,
    [notifications]
  );

  const fetchNotifications = async () => {
    if (!session?.no_rkm_medis) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.master.list('mlite_notifications', {
        page: 1,
        per_page: 200,
        s: session.no_rkm_medis,
        col: 'no_rkm_medis',
      });
      const rows = (((res.data as any)?.data || []) as NotificationItem[]).sort((a, b) => {
        const aa = new Date(a?.tanggal || '').getTime() || 0;
        const bb = new Date(b?.tanggal || '').getTime() || 0;
        return bb - aa;
      });
      setNotifications(rows);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Gagal mengambil notifikasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchNotifications();
    }
  }, [authLoading, session?.no_rkm_medis]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleToggleStatus = async (item: NotificationItem) => {
    if (!session?.no_rkm_medis) return;
    const currentStatus = String(item.status || '').toLowerCase();
    const nextStatus = currentStatus === 'read' ? 'unread' : 'read';
    setUpdatingId(item.id);
    try {
      const payload = {
        id: item.id,
        judul: item.judul,
        pesan: item.pesan,
        tanggal: item.tanggal,
        no_rkm_medis: item.no_rkm_medis || session.no_rkm_medis,
        status: nextStatus,
      };
      const saveRes = await api.master.save('mlitenotifications', payload);
      setNotifications((prev) =>
        prev.map((row) => (String(row.id) === String(item.id) ? { ...row, status: nextStatus } : row))
      );
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Gagal mengubah status notifikasi.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || loading) {
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
            <Text style={styles.headerTitle}>Notifikasi</Text>
          </View>
        </LinearGradient>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Login Diperlukan</Text>
          <Text style={styles.emptySubtitle}>Silakan login untuk melihat notifikasi akun Anda.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>Ke Halaman Login</Text>
          </TouchableOpacity>
        </View>
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
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Notifikasi</Text>
            <Text style={styles.headerSubtitle}>Unread: {unreadCount}</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#62B986" />}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <Bell size={42} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Belum Ada Notifikasi</Text>
            <Text style={styles.emptySubtitle}>Notifikasi untuk pasien ini belum tersedia.</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isRead = String(item.status || '').toLowerCase() === 'read';
          const isUpdating = String(updatingId || '') === String(item.id);
          return (
            <View style={[styles.card, isRead ? styles.cardRead : styles.cardUnread]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.judul || 'Notifikasi'}</Text>
                <View style={[styles.statusBadge, isRead ? styles.statusRead : styles.statusUnread]}>
                  <Text style={styles.statusText}>{isRead ? 'Read' : 'Unread'}</Text>
                </View>
              </View>
              <Text style={styles.cardMessage}>{item.pesan || '-'}</Text>
              <Text style={styles.cardDate}>{formatDateTime(item.tanggal)}</Text>
              <TouchableOpacity
                style={styles.toggleBtn}
                disabled={isUpdating}
                onPress={() => handleToggleStatus(item)}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#2E7D32" />
                ) : isRead ? (
                  <Circle size={16} color="#2E7D32" />
                ) : (
                  <CheckCircle2 size={16} color="#2E7D32" />
                )}
                <Text style={styles.toggleText}>{isRead ? 'Tandai Unread' : 'Tandai Read'}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
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
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardRead: {
    borderColor: '#E5E7EB',
  },
  cardUnread: {
    borderColor: '#BEE3CF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '700',
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusRead: {
    backgroundColor: '#E5E7EB',
  },
  statusUnread: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '700',
  },
  cardMessage: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  toggleBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  toggleText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginBtn: {
    marginTop: 14,
    backgroundColor: '#62B986',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loginBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
