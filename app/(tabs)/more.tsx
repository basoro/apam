import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Stethoscope, ClipboardList, Bed, Beaker, Radiation, Pill, LayoutGrid, CalendarDays, History } from 'lucide-react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function MoreScreen() {
  const menuItems = [
    {
      title: 'Jadwal Dokter',
      icon: <Stethoscope size={24} color="#FFFFFF" />,
      route: '/(tabs)/jadwal-dokter',
    },
    {
      title: 'Rawat Jalan',
      icon: <Stethoscope size={24} color="#FFFFFF" />,
      route: '/(tabs)/rawat-jalan',
    },
    {
      title: 'Rawat Inap',
      icon: <History size={24} color="#FFFFFF" />,
      route: '/(tabs)/rawat-inap',
    },
    {
      title: 'Kamar Tersedia',
      icon: <MaterialCommunityIcons name="bed-empty" size={24} color="#FFFFFF" />,
      route: '/(tabs)/kamar',
    },
    {
      title: 'Tarif Laborat',
      icon: <Beaker size={24} color="#FFFFFF" />,
      route: '/(tabs)/laboratorium',
    },
    {
      title: 'Tarif Radiologi',
      icon: <Radiation size={24} color="#FFFFFF" />,
      route: '/(tabs)/radiologi',
    },
    {
      title: 'Tarif Farmasi',
      icon: <Pill size={24} color="#FFFFFF" />,
      route: '/(tabs)/farmasi',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Lengkap</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuIconContainer}>
                {item.icon}
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 24,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  menuItem: {
    alignItems: 'center',
    width: (width - 48) / 3, // 3 columns for "More" screen looks better
    marginBottom: 30,
  },
  menuIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#62B986',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#62B986',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  menuText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
});
