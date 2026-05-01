import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CreditCard, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('No Rekam Medis dan NIK/Password harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(username, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError('Kredensial tidak cocok. Gunakan password personal jika tersedia, atau NIK jika belum ada password personal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.greenHeader}>
        <View style={styles.logoContainer}>
          {/* Placeholder for Logo - In a real app, use the actual logo image */}
          {/* <Image source={require('../assets/images/icon.png')} style={styles.logo} resizeMode="contain" /> */}
          <View style={styles.logoPlaceholder}>
             {/* Using a simple icon or the existing asset if it works */}
             <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
             />
          </View>
          <View>
            <Text style={styles.hospitalName}>RUMAH SAKIT</Text>
            <Text style={styles.hospitalNameLarge}>Atila Medika</Text>
            <Text style={styles.memberOf}>Member of <Text style={{fontWeight: 'bold'}}>mLITE Indonesia</Text></Text>
            <Text style={styles.memberOfGroup}>HOSPITAL GROUP</Text>
          </View>
        </View>
      </View>

      <View style={styles.whiteContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formHeader}>
              <Text style={styles.welcomeTitle}>Selamat Datang!</Text>
              <Text style={styles.welcomeSubtitle}>
                Silakan masuk untuk memperoleh layanan kesehatan yang optimal dan fitur terbaik dari RS Atila Medika.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <CreditCard color="#9CA3AF" size={20} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="No Rekam Medis"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                keyboardType="default"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock color="#9CA3AF" size={20} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password / NIK (Sesuai KTP)"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff color="#9CA3AF" size={20} />
                ) : (
                  <Eye color="#9CA3AF" size={20} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                © 2026 RS Atila Medika
              </Text>
              <Text style={styles.footerText}>
                All rights reserved.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greenHeader: {
    height: '35%',
    backgroundColor: '#62B986', // Green background for the top part
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 100,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
  },
  logoImage: {
    width: 40,
    height: 40,
    tintColor: '#FFFFFF'
  },
  hospitalName: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 1,
  },
  hospitalNameLarge: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  memberOf: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 4,
  },
  memberOfGroup: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginLeft: 15,
    marginRight: 15, 
    marginTop: -50,
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  formHeader: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#62B986', // Matching the green theme
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#62B986',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
});
