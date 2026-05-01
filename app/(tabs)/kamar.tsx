import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Search, DoorOpen, CreditCard, Layers, UserX, UserCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function KamarScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [bangsal, setBangsal] = useState<any>({});
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kamarRes, bangsalRes] = await Promise.all([
        api.master.list('kamar'),
        api.master.list('bangsal')
      ]);

      const rooms = kamarRes.data.data || [];
      const wards = bangsalRes.data.data || [];

      // Create mapping for kd_bangsal to nm_bangsal
      const wardMap: any = {};
      wards.forEach((w: any) => {
        wardMap[w.kd_bangsal] = w.nm_bangsal;
      });

      setBangsal(wardMap);
      setData(rooms);
      setFilteredData(rooms);
    } catch (error) {
      console.error('Error fetching kamar or bangsal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) {
      setFilteredData(data);
      return;
    }
    const filtered = data.filter((item: any) => {
      const wardName = bangsal[item.kd_bangsal] || item.kd_bangsal || '';
      return (
        item.kd_kamar.toLowerCase().includes(text.toLowerCase()) ||
        wardName.toLowerCase().includes(text.toLowerCase()) ||
        item.kelas.toLowerCase().includes(text.toLowerCase())
      );
    });
    setFilteredData(filtered);
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: item.status === 'ISI' ? '#FFEBEE' : '#E8F5E9' }]}>
          <DoorOpen size={20} color={item.status === 'ISI' ? '#EF5350' : '#62B986'} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.itemCode}>{item.kd_kamar}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'ISI' ? '#FFEBEE' : '#E8F5E9' }]}>
              {item.status === 'ISI' ? (
                <UserCheck size={12} color="#EF5350" />
              ) : (
                <UserX size={12} color="#62B986" />
              )}
              <Text style={[styles.statusText, { color: item.status === 'ISI' ? '#EF5350' : '#62B986' }]}>
                {item.status === 'ISI' ? 'Terisi' : 'Kosong'}
              </Text>
            </View>
          </View>
          <Text style={styles.itemName}>{bangsal[item.kd_bangsal] || item.kd_bangsal || 'Bangsal Umum'}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
        <View style={styles.infoCol}>
          <Layers size={14} color="#999" style={styles.miniIcon} />
          <Text style={styles.infoLabel}>{item.kelas || 'Kelas'}</Text>
        </View>
        <View style={styles.priceContainer}>
          <CreditCard size={14} color="#62B986" style={styles.miniIcon} />
          <Text style={styles.priceText}>{formatCurrency(item.trf_kamar || 0)} / hari</Text>
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Ketersediaan Kamar</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari bangsal, kelas, atau kode kamar..."
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#62B986" />
          <Text style={styles.loadingText}>Memuat ketersediaan kamar...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item: any, index) => (item.kd_kamar || index).toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>Data tidak ditemukan.</Text>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#62B986',
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniIcon: {
    marginRight: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
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
