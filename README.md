# APAM (Aplikasi Pasien RS Atila Medika)

APAM adalah aplikasi mobile berbasis **Expo + React Native** untuk layanan pasien RS Atila Medika, terintegrasi ke API mLITE/SIMRS.

## Fitur Utama

- Login pasien menggunakan **No. Rekam Medis** dan **NIK/Password personal**.
- Beranda pasien dengan data ringkas, jadwal dokter, dan artikel kesehatan terbaru.
- Akses modul layanan:
  - Rawat Jalan
  - Rawat Inap
  - Jadwal Dokter
  - Kamar tersedia
  - Tarif Laboratorium, Radiologi, dan Farmasi
  - Riwayat perawatan
  - Pendaftaran mandiri
- Integrasi API melalui `axios` dengan interceptor untuk token dan kredensial pasien.

## Teknologi

- Expo SDK 54
- React Native 0.81
- Expo Router
- TypeScript
- Axios

## Prasyarat

- Node.js 20+ (disarankan LTS)
- npm
- Expo CLI (opsional, karena bisa via `npx expo ...`)

## Konfigurasi Environment

Buat atau sesuaikan file `.env` di root project:

```env
EXPO_PUBLIC_API_URL=https://demo.mlite.id
EXPO_PUBLIC_API_KEY=YOUR_API_KEY_HERE
EXPO_PUBLIC_API_USERNAME=admin
EXPO_PUBLIC_API_PASSWORD=admin
```

Keterangan:

- `EXPO_PUBLIC_API_URL`: base URL API backend.
- `EXPO_PUBLIC_API_KEY`: API key yang valid.
- `EXPO_PUBLIC_API_USERNAME` dan `EXPO_PUBLIC_API_PASSWORD`: kredensial sistem untuk login awal.

## Menjalankan Project (Lokal)

1. Install dependency:

```bash
npm install
```

2. Jalankan development server Expo:

```bash
npm run dev
```

Alternatif langsung via Expo CLI:

```bash
npx expo start
```

3. Jalankan target platform (opsional):

```bash
npm run android
npm run ios
```

## Scripts

- `npm run dev` menjalankan Expo dev server.
- `npm run build:web` export web build.
- `npm run lint` menjalankan lint bawaan Expo.
- `npm run typecheck` pengecekan TypeScript tanpa emit.
- `npm run android` build/run Android native.
- `npm run ios` build/run iOS native.

## Deploy dengan Docker

Project sudah menyediakan `Dockerfile` untuk menjalankan Expo server pada port `8080`.

Contoh build & run:

```bash
docker build -t apam --build-arg EXPO_PUBLIC_API_URL=https://demo.mlite.id .
docker run --rm -p 8080:8080 apam
```

## Catatan Deployment Railway

Agar QR code Expo mengarah ke domain publik Railway (bukan IP internal container), set environment variable berikut di dashboard Railway:

- Key: `REACT_NATIVE_PACKAGER_HOSTNAME`
- Value: domain publik aplikasi tanpa `https://`
  - Contoh: `mobile-app-production.up.railway.app`

Jika variabel ini tidak diatur, QR code bisa menunjuk IP internal yang tidak dapat diakses dari perangkat HP.

## Struktur Folder Ringkas

```text
app/          -> route dan screen Expo Router
contexts/     -> context global (autentikasi)
lib/          -> API client dan endpoint wrapper
assets/       -> gambar dan aset statis
hooks/        -> custom hooks
```
