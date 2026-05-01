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

## Compile Android dan iOS via Expo

### Opsi 1: Compile lokal (native build)

Gunakan opsi ini jika Anda ingin build langsung di mesin lokal.

1. Generate folder native:

```bash
npx expo prebuild
```

2. Compile Android:

```bash
npx expo run:android
```

3. Compile iOS (hanya macOS + Xcode):

```bash
npx expo run:ios
```

Catatan:

- Android membutuhkan Android Studio + SDK.
- iOS membutuhkan Xcode, CocoaPods, dan simulator/perangkat iOS.

### Opsi 2: Compile cloud dengan EAS Build (disarankan untuk release)

1. Install dan login EAS CLI:

```bash
npm install -g eas-cli
eas login
```

2. Inisialisasi konfigurasi EAS:

```bash
eas build:configure
```

3. Build Android (AAB/APK):

```bash
eas build -p android
```

4. Build iOS (IPA):

```bash
eas build -p ios
```

5. Download hasil build dari link output EAS setelah proses selesai.

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


Jika variabel ini tidak diatur, QR code bisa menunjuk IP internal yang tidak dapat diakses dari perangkat HP.

## Struktur Folder Ringkas

```text
app/          -> route dan screen Expo Router
contexts/     -> context global (autentikasi)
lib/          -> API client dan endpoint wrapper
assets/       -> gambar dan aset statis
hooks/        -> custom hooks
```
