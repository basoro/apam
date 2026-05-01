import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Activity,
  Thermometer,
  Microscope,
  FileText,
  Pill,
  HeartPulse,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function RiwayatPerawatanScreen() {
  const { no_rawat, type } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('soap');
  const [aturanPakaiMap, setAturanPakaiMap] = useState<Record<string, string>>({});
  const [thumbnailHeaders, setThumbnailHeaders] = useState<Record<string, string>>({});
  const [miniPacsThumbnailMap, setMiniPacsThumbnailMap] = useState<Record<string, string>>({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewZoom, setPreviewZoom] = useState(1);

  useEffect(() => {
    if (no_rawat && session?.no_rkm_medis) {
      fetchDetail();
    }
  }, [no_rawat, session]);

  useEffect(() => {
    const prepareThumbnailHeaders = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      const apiKey = process.env.EXPO_PUBLIC_API_KEY || '';
      const usernamePermission = process.env.EXPO_PUBLIC_API_USERNAME || '';
      const passwordPermission = process.env.EXPO_PUBLIC_API_PASSWORD || '';

      const headers: Record<string, string> = {};
      if (apiKey) headers['X-Api-Key'] = apiKey;
      if (usernamePermission) headers['X-Username-Permission'] = usernamePermission;
      if (passwordPermission) headers['X-Password-Permission'] = passwordPermission;
      if (token) headers.Authorization = `Bearer ${token}`;
      setThumbnailHeaders(headers);
    };

    prepareThumbnailHeaders();
  }, []);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await api.pasien.riwayatPerawatan(session?.no_rkm_medis || '', no_rawat as string);
      console.log(response.data);
      // The API returns nested clinical arrays
      setDetails(response.data?.data?.reg_periksa?.[0] || response.data?.data || null);
    } catch (error) {
      console.error('Error fetching care detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const openImagePreview = (imageUrl: string) => {
    if (!imageUrl) return;
    setPreviewImageUrl(imageUrl);
    setPreviewZoom(1);
    setPreviewVisible(true);
  };

  const asArray = (value: any) => (Array.isArray(value) ? value : []);

  const collectArrays = (obj: any, keys: string[]) =>
    keys.flatMap((key) => asArray(obj?.[key]));

  const extractRadiologyResults = (item: any) => {
    const nestedResults = asArray(item?.hasil_radiologi)
      .map((r: any) => r?.hasil || r?.kesan || r?.impression || '')
      .filter(Boolean);
    if (nestedResults.length > 0) return nestedResults;

    const directResult = item?.detail_periksa_radiologi || item?.hasil || item?.hasil_periksa || item?.kesan;
    if (typeof directResult === 'string' && directResult.trim()) return [directResult.trim()];
    return [];
  };

  const normalizePrescriptionItems = (items: any[]) =>
    items.flatMap((item: any) => {
      const nested = asArray(item?.data_pemberian_obat);
      if (nested.length > 0) {
        return nested.map((n: any) => ({
          ...n,
          tgl_perawatan: n?.tgl_perawatan || item?.tgl_perawatan,
          jam: n?.jam || item?.jam,
          no_rawat: n?.no_rawat || item?.no_rawat,
        }));
      }
      return [item];
    });

  const buildAturanPakaiKey = (item: any) =>
    `${item?.tgl_perawatan || ''}|${item?.jam || ''}|${item?.no_rawat || ''}|${item?.kode_brng || ''}`;

  const detailObj = details || {};
  const soapData = type === 'ranap'
    ? asArray(detailObj.pemeriksaan_ranap)
    : asArray(detailObj.pemeriksaan_ralan);
  const diagnosisData = type === 'ranap'
    ? asArray(detailObj.diagnosa_pasien_ranap)
    : asArray(detailObj.diagnosa_pasien);
  const icd9Data = type === 'ranap'
    ? collectArrays(detailObj, ['prosedur_pasien_ranap', 'prosedur_ranap', 'icd9_ranap'])
    : collectArrays(detailObj, ['prosedur_pasien', 'prosedur_ralan', 'icd9']);
  const actionData = type === 'ranap'
    ? collectArrays(detailObj, ['tindakan_ranap', 'rawat_inap_dr', 'rawat_inap_pr', 'rawat_inap_drpr'])
    : collectArrays(detailObj, ['tindakan_ralan', 'rawat_jl_dr', 'rawat_jl_pr', 'rawat_jl_drpr']);
  const rawPrescriptionData = type === 'ranap'
    ? collectArrays(detailObj, [
      'detail_pemberian_obat_ranap',
      'pemberian_obat_ranap',
      'resep_obat_ranap',
      'obat_ranap',
    ])
    : collectArrays(detailObj, [
      'detail_pemberian_obat',
      'pemberian_obat',
      'resep_obat',
      'obat',
    ]);
  const prescriptionData = normalizePrescriptionItems(rawPrescriptionData);
  const labData = collectArrays(detailObj, ['periksa_lab', 'laboratorium', 'lab']);
  const radData = collectArrays(detailObj, ['periksa_radiologi', 'radiologi', 'periksa_rad']);
  const miniPacsData = collectArrays(detailObj, ['mini_pacs']);
  const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
  const previewBaseSize = Math.min(screenWidth - 24, screenHeight - 180);
  const previewContentSize = Math.max(220, Math.round(previewBaseSize * previewZoom));

  useEffect(() => {
    const fetchAturanPakai = async () => {
      if (!details) {
        setAturanPakaiMap({});
        return;
      }

      const byKey = new Map<string, any>();
      prescriptionData.forEach((item: any) => {
        const normalized = {
          ...item,
          no_rawat: item?.no_rawat || details?.no_rawat || no_rawat,
        };
        const key = buildAturanPakaiKey(normalized);
        if (key !== '|||') byKey.set(key, normalized);
      });

      if (byKey.size === 0) {
        setAturanPakaiMap({});
        return;
      }

      const nextMap: Record<string, string> = {};
      await Promise.all(
        Array.from(byKey.values()).map(async (item: any) => {
          try {
            const res = await api.master.list('aturan_pakai', {
              tgl_perawatan: item?.tgl_perawatan,
              jam: item?.jam,
              no_rawat: item?.no_rawat,
              kode_brng: item?.kode_brng,
              page: 1,
              per_page: 1,
            });
            const rows = (res.data as any)?.data || [];
            const first = Array.isArray(rows) ? rows[0] : null;
            const aturan =
              first?.aturan ||
              first?.aturan_pakai ||
              first?.aturan_minum ||
              first?.aturan_obat;
            if (aturan) {
              nextMap[buildAturanPakaiKey(item)] = String(aturan);
            }
          } catch (error) {
            console.error('Error fetching aturan pakai:', error);
          }
        })
      );

      setAturanPakaiMap(nextMap);
    };

    fetchAturanPakai();
  }, [details, type, no_rawat]);

  useEffect(() => {
    let cancelled = false;
    const createdBlobUrls: string[] = [];

    const fetchMiniPacsThumbnails = async () => {
      if (!details || !apiBaseUrl) {
        setMiniPacsThumbnailMap({});
        return;
      }

      const studies = collectArrays(details, ['mini_pacs']);
      if (studies.length === 0) {
        setMiniPacsThumbnailMap({});
        return;
      }

      const nextMap: Record<string, string> = {};
      await Promise.all(
        studies.map(async (study: any) => {
          const firstSeries = asArray(study?.series)[0];
          const firstInstance = asArray(firstSeries?.instances)[0];
          const instanceId = firstInstance?.id;
          if (!instanceId) return;

          const imageUrl = `${apiBaseUrl}/admin/api/mini_pacs/instancejpg/${instanceId}`;
          if (Platform.OS !== 'web') {
            nextMap[String(instanceId)] = imageUrl;
            return;
          }

          try {
            const res = await fetch(imageUrl, {
              headers: thumbnailHeaders,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            createdBlobUrls.push(blobUrl);
            nextMap[String(instanceId)] = blobUrl;
          } catch (error) {
            nextMap[String(instanceId)] = imageUrl;
          }
        })
      );

      if (cancelled) {
        if (Platform.OS === 'web') {
          createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
        }
        return;
      }

      setMiniPacsThumbnailMap((prev) => {
        if (Platform.OS === 'web') {
          Object.values(prev).forEach((oldUrl) => {
            if (oldUrl.startsWith('blob:') && !Object.values(nextMap).includes(oldUrl)) {
              URL.revokeObjectURL(oldUrl);
            }
          });
        }
        return nextMap;
      });
    };

    fetchMiniPacsThumbnails();

    return () => {
      cancelled = true;
      if (Platform.OS === 'web') {
        createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
      }
    };
  }, [details, apiBaseUrl, JSON.stringify(thumbnailHeaders)]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#62B986" />
        <Text style={styles.loadingText}>Memuat detail perawatan...</Text>
      </View>
    );
  }

  if (!details) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Detail perawatan tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Kembali ke Riwayat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderSectionHeader = (title: string, icon: any, sectionKey: string, count?: number) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(sectionKey)}
    >
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIcon}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {expandedSection === sectionKey ? <ChevronUp size={20} color="#999" /> : <ChevronDown size={20} color="#999" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#62B986', '#72C996']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Detail Perawatan</Text>
          <Text style={styles.headerSubtitle}>{no_rawat}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <Calendar size={18} color="#62B986" />
            <Text style={styles.overviewLabel}>Tanggal:</Text>
            <Text style={styles.overviewValue}>{details.tgl_registrasi || '-'}</Text>
            <View style={[
              styles.typeBadge,
              { backgroundColor: type === 'ranap' ? '#E3F2FD' : '#E8F5E9' }
            ]}>
              <Text style={[
                styles.typeText,
                { color: type === 'ranap' ? '#2196F3' : '#62B986' }
              ]}>
                {type === 'ranap' ? 'Rawat Inap' : 'Rawat Jalan'}
              </Text>
            </View>
          </View>
          <View style={styles.overviewRow}>
            <Stethoscope size={18} color="#62B986" />
            <Text style={styles.overviewLabel}>Dokter:</Text>
            <Text style={styles.overviewValue} numberOfLines={1}>{details.nm_dokter || '-'}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Activity size={18} color="#62B986" />
            <Text style={styles.overviewLabel}>Unit/Poli:</Text>
            <Text style={styles.overviewValue}>{details.nm_poli || '-'}</Text>
          </View>
        </View>

        {/* SOAP Section */}
        {soapData && soapData.length > 0 && (
          <View style={styles.sectionContainer}>
            {renderSectionHeader('Pemeriksaan (SOAP)', <Thermometer size={18} color="#FFF" />, 'soap')}
            {expandedSection === 'soap' && (
              <View style={styles.sectionBody}>
                {soapData.map((p: any, idx: number) => (
                  <View key={idx} style={styles.soapItem}>
                    <View style={styles.vitalsGrid}>
                      <View style={styles.vitalBox}><Text style={styles.vitalLabel}>Tensi</Text><Text style={styles.vitalValue}>{p.tensi || '-'}</Text></View>
                      <View style={styles.vitalBox}><Text style={styles.vitalLabel}>Suhu</Text><Text style={styles.vitalValue}>{p.suhu_tubuh || '-'}°C</Text></View>
                      <View style={styles.vitalBox}><Text style={styles.vitalLabel}>Nadi</Text><Text style={styles.vitalValue}>{p.nadi || '-'}</Text></View>
                      <View style={styles.vitalBox}><Text style={styles.vitalLabel}>BB</Text><Text style={styles.vitalValue}>{p.berat || '-'} kg</Text></View>
                    </View>
                    <View style={styles.soapTextRow}>
                      <Text style={styles.soapLabel}>S (Subjective):</Text>
                      <Text style={styles.soapValue}>{p.keluhan || '-'}</Text>
                    </View>
                    <View style={styles.soapTextRow}>
                      <Text style={styles.soapLabel}>O (Objective):</Text>
                      <Text style={styles.soapValue}>{p.pemeriksaan || '-'}</Text>
                    </View>
                    <View style={styles.soapTextRow}>
                      <Text style={styles.soapLabel}>A (Assessment):</Text>
                      <Text style={styles.soapValue}>{p.penilaian || '-'}</Text>
                    </View>
                    <View style={styles.soapTextRow}>
                      <Text style={styles.soapLabel}>P (Plan):</Text>
                      <Text style={styles.soapValue}>{p.rtl || '-'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Diagnosis Section */}
        {diagnosisData && diagnosisData.length > 0 && (
          <View style={styles.sectionContainer}>
            {renderSectionHeader('Diagnosa (ICD-10)', <FileText size={18} color="#FFF" />, 'diagnosa', diagnosisData.length)}
            {expandedSection === 'diagnosa' && (
              <View style={styles.sectionBody}>
                {diagnosisData.map((d: any, idx: number) => (
                  <View key={idx} style={styles.listRow}>
                    <View style={styles.codeBadge}><Text style={styles.codeText}>{d.kd_penyakit}</Text></View>
                    <Text style={styles.listText}>{d.nm_penyakit}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ICD-9 Section */}
        {icd9Data.length > 0 && (
          <View style={styles.sectionContainer}>
            {renderSectionHeader('Prosedur (ICD-9)', <FileText size={18} color="#FFF" />, 'icd9', icd9Data.length)}
            {expandedSection === 'icd9' && (
              <View style={styles.sectionBody}>
                {icd9Data.map((p: any, idx: number) => (
                  <View key={idx} style={styles.listRow}>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeText}>{p.kd_icd9 || p.kode || '-'}</Text>
                    </View>
                    <Text style={styles.listText}>{p.nama_icd9 || p.nm_icd9 || p.deskripsi_panjang || '-'}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Actions/Procedures Section */}
        {actionData && actionData.length > 0 && (
          <View style={styles.sectionContainer}>
            {renderSectionHeader('Prosedur & Tindakan', <HeartPulse size={18} color="#FFF" />, 'actions', actionData.length)}
            {expandedSection === 'actions' && (
              <View style={styles.sectionBody}>
                {actionData.map((a: any, idx: number) => (
                  <View key={idx} style={styles.actionRow}>
                    <Text style={styles.actionName}>{a.nm_perawatan || a.nama_tindakan || '-'}</Text>
                    <Text style={styles.actionMeta}>
                      {a.nm_dokter ? `Dokter: ${a.nm_dokter}` : ''}
                      {a.nm_dokter && a.nama ? ' | ' : ''}
                      {a.nama ? `Perawat: ${a.nama}` : ''}
                      {!a.nm_dokter && !a.nama ? (a.provider || '-') : ''}
                    </Text>
                    <Text style={styles.actionDate}>
                      {(a.tgl_perawatan || '-')} {(a.jam_rawat || '')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Prescription Section */}
        {prescriptionData && prescriptionData.length > 0 && (
          <View style={styles.sectionContainer}>
            {renderSectionHeader('Resep Obat', <Pill size={18} color="#FFF" />, 'obat', prescriptionData.length)}
            {expandedSection === 'obat' && (
              <View style={styles.sectionBody}>
                {prescriptionData.map((o: any, idx: number) => (
                  <View key={idx} style={styles.obatItem}>
                    <View style={styles.obatHeader}>
                      <Text style={styles.obatName}>{o.nama_brng || o.nm_obat || '-'}</Text>
                      <Text style={styles.obatQty}>
                        {o.jml || o.jumlah || o.jml_obat || '-'} {o.satuan || o.satuan_obat || ''}
                      </Text>
                    </View>
                    <Text style={styles.obatSigna}>
                      {aturanPakaiMap[buildAturanPakaiKey({
                        ...o,
                        no_rawat: o?.no_rawat || details?.no_rawat || no_rawat,
                      })] || o.aturan || o.aturan_pakai || o.aturan_minum || 'Sesuai petunjuk dokter'}
                    </Text>
                    <Text style={styles.actionDate}>
                      {(o.tgl_perawatan || '-')} {(o.jam || '')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Lab/Radiology Section */}
        {(labData?.length > 0 || radData?.length > 0) && (
          <View style={styles.sectionContainer}>
            {renderSectionHeader('Layanan Penunjang', <Microscope size={18} color="#FFF" />, 'penunjang')}
            {expandedSection === 'penunjang' && (
              <View style={styles.sectionBody}>
                {labData?.map((l: any, idx: number) => (
                  <View key={`lab-${idx}`} style={styles.penunjangItem}>
                    <Text style={styles.penunjangType}>Laboratorium</Text>
                    <Text style={styles.penunjangName}>{l.nm_perawatan || l.jenis || '-'}</Text>
                    {(asArray(l.detail_periksa_lab).length > 0 ? asArray(l.detail_periksa_lab) : asArray(l.detail)).map((d: any, dIdx: number) => (
                      <View key={`lab-detail-${dIdx}`} style={styles.labDetailRow}>
                        <Text style={styles.labDetailItem}>{d.Pemeriksaan || d.pemeriksaan || '-'}</Text>
                        <Text style={styles.labDetailValue}>{d.nilai} <Text style={styles.labDetailUnit}>{d.satuan}</Text></Text>
                        <Text style={styles.labDetailRef}>Ref: {d.nilai_rujukan}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                {radData?.map((r: any, idx: number) => {
                  const resultTexts = extractRadiologyResults(r);
                  const detailRows = asArray(r.detail).length > 0
                    ? asArray(r.detail)
                    : asArray(r.detail_periksa_radiologi);
                  const hasilRows = asArray(r.hasil_radiologi);
                  const pemeriksaanRows = asArray(r.pemeriksaan_radiologi);
                  const radiologyName = (
                    r.nm_perawatan ||
                    r.jenis ||
                    r.nm_pemeriksaan ||
                    pemeriksaanRows.map((p: any) => p?.nm_perawatan || p?.jenis || p?.nm_pemeriksaan).filter(Boolean).join(' | ') ||
                    '-'
                  );

                  return (
                    <View key={`rad-${idx}`} style={styles.penunjangItem}>
                      <Text style={styles.penunjangType}>Radiologi</Text>
                      <Text style={styles.penunjangName}>{radiologyName}</Text>
                      <Text style={styles.penunjangResult}>
                        Hasil: {resultTexts.length > 0 ? resultTexts.join(' | ') : '-'}
                      </Text>
                      {hasilRows.map((h: any, hIdx: number) => (
                        <Text key={`rad-hasil-${idx}-${hIdx}`} style={styles.actionDate}>
                          {(h?.tgl_periksa || '-')} {(h?.jam || '')}
                        </Text>
                      ))}
                      {detailRows.map((d: any, dIdx: number) => (
                        <View key={`rad-detail-${idx}-${dIdx}`} style={styles.labDetailRow}>
                          <Text style={styles.labDetailItem}>{d.Pemeriksaan || d.pemeriksaan || d.jenis || '-'}</Text>
                          <Text style={styles.labDetailValue}>{d.nilai || d.hasil || '-'}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
                {miniPacsData.length > 0 && (
                  <View style={styles.penunjangItem}>
                    <Text style={styles.penunjangType}>Mini PACS</Text>
                    <Text style={styles.penunjangName}>Thumbnail Radiologi</Text>
                    {miniPacsData.map((study: any, sIdx: number) => {
                      const firstSeries = asArray(study?.series)[0];
                      const firstInstance = asArray(firstSeries?.instances)[0];
                      const instanceId = firstInstance?.id;
                      const rawImageUrl = instanceId && apiBaseUrl
                        ? `${apiBaseUrl}/admin/api/mini_pacs/instancejpg/${instanceId}`
                        : '';
                      const imageUrl = rawImageUrl.replace(/[`'"]/g, '').trim();
                      const resolvedImageUrl = (instanceId && miniPacsThumbnailMap[String(instanceId)]) || imageUrl;
                      const useHeaders = !!resolvedImageUrl && !resolvedImageUrl.startsWith('blob:') && Object.keys(thumbnailHeaders).length > 0;
                      return (
                        <View key={`mini-pacs-${sIdx}`} style={styles.pacsStudyContainer}>
                          <Text style={styles.pacsMetaText}>
                            {study?.modality || '-'} | {study?.description || 'Mini PACS'} | {study?.study_date || '-'}
                          </Text>
                          {imageUrl ? (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => openImagePreview(resolvedImageUrl)}
                            >
                              <Image
                                source={
                                  useHeaders
                                    ? { uri: resolvedImageUrl, headers: thumbnailHeaders }
                                    : { uri: resolvedImageUrl }
                                }
                                style={styles.pacsThumbnail}
                                resizeMode="cover"
                              />
                              <Text style={styles.previewHint}>Tap untuk lihat full image</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.penunjangResult}>Thumbnail tidak tersedia.</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.previewActionButton}
              onPress={() => setPreviewZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
            >
              <Text style={styles.previewActionText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.previewZoomText}>{Math.round(previewZoom * 100)}%</Text>
            <TouchableOpacity
              style={styles.previewActionButton}
              onPress={() => setPreviewZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))))}
            >
              <Text style={styles.previewActionText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewActionButton, styles.previewCloseButton]}
              onPress={() => setPreviewVisible(false)}
            >
              <Text style={styles.previewActionText}>Tutup</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            bounces={false}
            contentContainerStyle={styles.previewHorizontalContent}
            showsHorizontalScrollIndicator={false}
          >
            <ScrollView
              bounces={false}
              contentContainerStyle={[
                styles.previewScrollContent,
                { minWidth: previewContentSize, minHeight: previewContentSize },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {!!previewImageUrl && (
                <View style={[styles.previewImageWrap, { width: previewContentSize, height: previewContentSize }]}>
                  <Image
                    source={
                      previewImageUrl.startsWith('blob:')
                        ? { uri: previewImageUrl }
                        : Object.keys(thumbnailHeaders).length > 0
                          ? { uri: previewImageUrl, headers: thumbnailHeaders }
                          : { uri: previewImageUrl }
                    }
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            </ScrollView>
          </ScrollView>
        </View>
      </Modal>
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
    padding: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overviewCard: {
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
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  overviewLabel: {
    fontSize: 13,
    color: '#999',
    marginLeft: 12,
    width: 100,
    fontWeight: '600',
  },
  overviewValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#62B986',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  countBadge: {
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#62B986',
  },
  sectionBody: {
    padding: 18,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  soapItem: {
    paddingVertical: 14,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  vitalBox: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  vitalValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  soapTextRow: {
    marginBottom: 12,
  },
  soapLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#62B986',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soapValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
    fontWeight: '500',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  codeBadge: {
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    minWidth: 60,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#62B986',
    textAlign: 'center',
  },
  listText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '600',
  },
  actionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  actionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  actionDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  actionMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  obatItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  obatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  obatName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  obatQty: {
    fontSize: 13,
    fontWeight: '800',
    color: '#62B986',
    marginLeft: 10,
  },
  obatSigna: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  penunjangItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  penunjangType: {
    fontSize: 10,
    color: '#62B986',
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
  },
  penunjangName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  penunjangResult: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
  },
  labDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
    flexWrap: 'wrap',
  },
  labDetailItem: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
    flex: 2,
    minWidth: 120,
  },
  labDetailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#62B986',
    flex: 1,
    textAlign: 'right',
  },
  labDetailUnit: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  labDetailRef: {
    fontSize: 11,
    color: '#999',
    marginLeft: 10,
    minWidth: 80,
    textAlign: 'right',
  },
  pacsStudyContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
  },
  pacsMetaText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  pacsThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#EEE',
  },
  previewHint: {
    marginTop: 6,
    fontSize: 11,
    color: '#62B986',
    fontWeight: '700',
    textAlign: 'right',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  previewHeader: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewActionButton: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseButton: {
    marginLeft: 'auto',
  },
  previewActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  previewZoomText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 46,
    textAlign: 'center',
  },
  previewScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewHorizontalContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  previewImageWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#62B986',
  },
  backButtonText: {
    color: '#62B986',
    fontWeight: '700',
    fontSize: 14,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  spacer: {
    height: 60,
  },
});
