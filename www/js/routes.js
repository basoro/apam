routes = [
  {
    path: '/',
    url: './index.html',
  },
  {
    path: '/about/',
    url: './pages/about.html',
  },
  {
    path: '/signin/',
    url: './pages/signin.html',
  },
  {
    path: '/postregister/',
    url: './pages/postregister.html',
  },
  {
    path: '/panduan/',
    url: './pages/panduan.html',
  },
  {
    path: '/home/',
    url: './pages/home.html',
  },
  {
    path: '/blog/',
    url: './pages/blog.html',
  },
  {
    path: '/blog/:id/',
    url: './pages/blog-detail.html',
  },
  {
    path: '/daftar/',
    url: './pages/daftar.html',
  },
  {
    path: '/kamar/',
    url: './pages/kamar.html',
  },
  {
    path: '/dokter/',
    url: './pages/dokter.html',
  },
  {
    path: '/rawatjalan/',
    url: './pages/rawatjalan.html',
  },
  {
    path: '/rawatinap/',
    url: './pages/rawatinap.html',
  },
  {
    path: '/laboratorium/',
    url: './pages/laboratorium.html',
  },
  {
    path: '/radiologi/',
    url: './pages/radiologi.html',
  },
  {
    path: '/pengaduan/',
    url: './pages/pengaduan.html',
  },
  {
    path: '/pengaduan/:no_rkm_medis/:id/',
    url: './pages/pengaduan-detail.html',
  },
  {
    path: '/booking/:no_rkm_medis/:tanggal_periksa/:no_reg/',
    url: './pages/booking-detail.html',
  },
  {
    path: '/riwayat/',
    url: './pages/riwayat-list.html',
  },
  {
    path: '/riwayat/:no_rkm_medis/:tgl_registrasi/:no_reg/',
    url: './pages/riwayat-detail.html',
  },
  {
    path: '/riwayatranap/',
    url: './pages/riwayatranap-list.html',
  },
  {
    path: '/riwayatranap/:no_rkm_medis/:tgl_registrasi/:no_reg/',
    url: './pages/riwayatranap-detail.html',
  },  {
    path: '/profil/',
    url: './pages/profil.html',
  },
  {
    path: '/sukses/',
    url: './pages/sukses.html',
  },
  {
    path: '/profile/',
    url: './pages/profile.html',
  },
  {
    path: '/notifikasi/',
    url: './pages/notifikasi.html',
  },
  // Color Themes
  {
    path: '/pengaturan/',
    componentUrl: './pages/pengaturan.html',
  },
  // Default route (404 page). MUST BE THE LAST
  {
    path: '(.*)',
    url: './pages/404.html',
  },
];
