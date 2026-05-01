import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';

const DEFAULT_NEWS_COVER = require('../../assets/images/article_heart.png');

const formatArticleDate = (value: any) => {
  if (value === undefined || value === null) return '-';
  const raw = String(value).trim();
  if (!raw) return '-';

  const numericValue = Number(raw);
  let date: Date;
  if (!Number.isNaN(numericValue) && /^\d+$/.test(raw)) {
    const timestamp = raw.length <= 10 ? numericValue * 1000 : numericValue;
    date = new Date(timestamp);
  } else {
    date = new Date(raw);
  }

  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const decodeHtmlEntities = (text: string) =>
  text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const stripHtml = (html: string) =>
  decodeHtmlEntities(html)
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|br|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const resolveNewsImage = (payload: any): { uri: string } | null => {
  const imageValue =
    payload?.cover_photo ||
    payload?.cover_image ||
    payload?.image ||
    payload?.cover ||
    payload?.thumbnail ||
    payload?.photo ||
    payload?.featured_image;

  if (!imageValue || typeof imageValue !== 'string') return null;
  const normalized = imageValue.replace(/\\/g, '/').trim();
  if (!normalized) return null;

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return { uri: normalized };
  }

  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!baseUrl) return null;

  const path = normalized.includes('/uploads/website/news/')
    ? (normalized.startsWith('/') ? normalized : `/${normalized}`)
    : normalized.startsWith('/')
      ? normalized
      : `/uploads/website/news/${normalized}`;

  return { uri: `${baseUrl}${path}` };
};

export default function NewsDetailScreen() {
  const { news_id } = useLocalSearchParams<{ news_id?: string }>();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Berita');
  const [category, setCategory] = useState('Kesehatan');
  const [date, setDate] = useState('-');
  const [content, setContent] = useState('-');
  const [image, setImage] = useState<number | { uri: string }>(DEFAULT_NEWS_COVER);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!news_id) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.website.show(news_id);
        const payload = (response.data as any)?.data ?? response.data ?? {};

        setTitle(payload?.title || payload?.judul || 'Berita');
        setCategory(payload?.category || payload?.kategori || payload?.tag || 'Kesehatan');
        setDate(formatArticleDate(payload?.published_at || payload?.created_at || payload?.date));

        const fullContent =
          payload?.content ||
          payload?.isi ||
          payload?.body ||
          payload?.description ||
          payload?.intro ||
          '-';
        setContent(typeof fullContent === 'string' ? stripHtml(fullContent) : '-');
        setImage(resolveNewsImage(payload) || DEFAULT_NEWS_COVER);
      } catch (error) {
        console.error('Error fetching news detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [news_id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#62B986" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Berita</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Image
          source={image}
          style={styles.coverImage}
          resizeMode="cover"
          onError={() => setImage(DEFAULT_NEWS_COVER)}
        />
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.content}>{content || '-'}</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 36,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  coverImage: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    marginBottom: 14,
  },
  category: {
    fontSize: 12,
    color: '#62B986',
    fontWeight: '600',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
});
