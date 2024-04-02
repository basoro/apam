//Main configuration. Silahkan sesuaikan settingan dibawah ini sesuai. Baca komentar dibelakangnya
const nama_instansi = 'mLITE Indonesia'; // Hospital Name
const apiUrl = 'http://localhost/mlite/api/'; // API Server URL
const website_upload = 'http://localhost/mlite/uploads/'; // Website Uploads Server URL
const webapps_url = 'http://localhost/mlite/webapps/'; // Webapps Server URL
const token = 'qtbexUAxzqO3M8dCOo2vDMFvgYjdUEdMLVo341'; // Token code for security purpose
const startDate = 0; // Start date of day for registration
const endDate = 7; // End date of day for registration
const debug = 1; // Ganti menjadi 0 sebelum build di phonegap.com
const kd_pj_bpjs = 'BPJ'; // Ganti menjadi 0 sebelum build di phonegap.com

// Dom7
var $$ = Dom7;

// Theme
var theme = 'md';
if (document.location.search.indexOf('theme=') >= 0) {
  theme = document.location.search.split('theme=')[1].split('&')[0];
}

// Framework7 App main instance
var app  = new Framework7({
  el: '#app', // App root element
  id: 'id.mlite.apam', // App bundle ID
  name: 'APAM', // App name
  dialog: {
    title: 'Peringatan',
    buttonOk: 'Ya',
    buttonCancel: 'Tidak'
  },
  statusbar: {
    iosOverlaysWebview: true,
  },
  theme: theme,
  debugger: false,
  cache: false,
  popup: {
    closeOnEscape: true,
  },
  sheet: {
    closeOnEscape: true,
	//closeByBackdropClick: true,
  },
  popover: {
    closeOnEscape: true,
  },
  actions: {
    closeOnEscape: true,
  },
  //store: store,
  // App routes
  routes: routes,
});

setTimeout(function () {
    $$('.loader-screen').hide();
}, 2000);

// Option 1. Using one 'page:init' handler for all pages
$$(document).on('page:init', function (e) {
  app.panel.close();
});

app.on('orientationchange', function (e) {
  app.off(e);
});

// Init/Create main view
var mainView = app.views.create('.view-main', {
  url: '/'
});

// If authentication is success, moving to Main page.
var no_rkm_medis = localStorage.getItem("no_rkm_medis");
var layout = localStorage.getItem("layout");
var color = localStorage.getItem("color");


if (debug == '1') {
  if (no_rkm_medis) {
    mainView.router.navigate('/home/', {
      clearPreviousHistory: true
    });
  }
} else {
  document.addEventListener('deviceready', appReady, false);
  function appReady(){
    document.addEventListener("offline", onOffline, false);
    function onOffline() {
      window.location = "offline.html";
    }
    if (no_rkm_medis) {
      mainView.router.navigate('/home/', {
        clearPreviousHistory: true
      });
    }
    if (layout) {
      $$('.view').addClass(layout);
    }
    if (color) {
      $$('.view').addClass(color);
    }
    // document.addEventListener('resume', function(){
    //   ga('send', 'pageview' , {'location' : 'https://mlite.id' });
    // }, false);
    document.addEventListener('backbutton', onBackKeyDown.bind(this), false);
    function onBackKeyDown() {
      var page = app.views.main.router.currentPageEl.dataset.name;
      app.dialog.close();
      if (page === 'landing') {
        app.dialog.confirm('Anda yakin ingin menutup aplikasi APAM?', function () {
          navigator.app.clearHistory();
          navigator.app.exitApp();
        })
      } else if (page === 'home') {
        app.dialog.confirm('Anda yakin ingin menutup aplikasi APAM?', function () {
          navigator.app.clearHistory();
          navigator.app.exitApp();
        })
      } else {
        mainView.router.back();
      }
    }
  }
}

if(no_rkm_medis) {

  var notifbooking = setInterval(function () {
    app.request.post(apiUrl + 'apam/', {
      action: 'notifbooking',
      no_rkm_medis: no_rkm_medis,
      token: token
    }, function (data) {
      data = JSON.parse(data);
      if(data.state == "valid") {
        stts = data.stts;
        var today = new Date().toISOString().slice(0,10);
        app.notification.create({
          icon: '<i class="icon material-icons md-only color-red">priority_high</i>',
          title: 'Notifikasi',
          titleRightText: 'saat ini',
          subtitle: nama_instansi,
          text: 'Pendaftaran tanggal '+ today +' berstatus <b>'+ stts +'</b>. Silahkan lihat data booking untuk detail dan tangkapan layar bukti daftar.',
          closeButton: true,
          closeOnClick: true,
          on: {
            close: function () {
            },
          },
        }).open();
      }
    });
    clearInterval(notifbooking);
  }, 10000);

  var notifberkas = setInterval(function () {
    app.request.post(apiUrl + 'apam/', {
      action: 'notifbooking',
      no_rkm_medis: no_rkm_medis,
      token: token
    }, function (data) {
      data = JSON.parse(data);
      if(data.state == "notifberkas") {
        stts = data.stts;
        var today = new Date().toISOString().slice(0,10);
        app.notification.create({
          icon: '<i class="icon material-icons md-only color-red">priority_high</i>',
          title: 'Pemberitahuan',
          titleRightText: 'saat ini',
          subtitle: nama_instansi,
          text: '<b>'+ stts +'</b>. Silahkan menuju ke Klinik pilihan anda di ' + nama_instansi + ' untuk mendapatkan layanan prioritas tanpa harus antri di loket pendaftaran.',
          closeButton: true,
          closeOnClick: true,
          on: {
            close: function () {
            },
          },
        }).open();
      }
    });
    clearInterval(notifberkas);
  }, 10000);

}

//=================================================//
// Load data untuk halaman signin.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="signin"]', function(e) {

  $$(".nama-instansi").html(nama_instansi);

  $$('.page[data-name="signin"] .signin-btn').on('click', function () {
    var no_rkm_medis = $$('#signin-form .no_rkm_medis').val();
    var no_ktp = $$('#signin-form .no_ktp').val();

    if(no_rkm_medis == "") {
      app.dialog.alert('Isian nomor kartu berobat tidak boleh kosong.');
    }
    else if(no_ktp == "") {
      app.dialog.alert('Isian nomor KTP tidak boleh kosong.');
    }
    else {
      // Show Preloader
      app.dialog.preloader("Menghubungkan ke server...");
      app.request.post(apiUrl + 'apam/', {
        action: 'signin',
        no_rkm_medis: no_rkm_medis,
        no_ktp: no_ktp,
        token: token
      }, function (data) {
        app.dialog.close();
        data = JSON.parse(data);

        if(data.state == "retensi") {
          app.dialog.alert('Data anda telah masuk ke fase Retensi dan tidak aktif. SIlahkan hubungi petugas Rumah Sakit.');
        }
        else if(data.state == "invalid") {
          app.dialog.alert('Nomor kartu dan/atau nomor KTP anda tidak sesuai.');
        }
        else if(data.state == "valid") {
          localStorage.setItem("no_rkm_medis", data.no_rkm_medis);
          no_rkm_medis = data.no_rkm_medis;

          mainView.router.navigate('/home/', {
            clearPreviousHistory: true
          });
        }
        else {
          app.dialog.alert('Login error:', data);
        }
      });
    }
  });
  $$('.page[data-name="signin"] .register-btn').on('click', function () {
    var nama_lengkap = $$('#register-form .nama_lengkap').val();
    var email = $$('#register-form .email').val();
    var nomor_ktp = $$('#register-form .nomor_ktp').val();
    var nomor_telepon = $$('#register-form .nomor_telepon').val();

    if(nama_lengkap == "") {
      app.dialog.alert('Isian nama lengkap tidak boleh kosong.');
    }
    else if(email == "") {
      app.dialog.alert('Isian email tidak boleh kosong.');
    }
    else if(nomor_ktp == "") {
      app.dialog.alert('Isian nomor KTP tidak boleh kosong.');
    }
    else if(nomor_telepon == "") {
      app.dialog.alert('Isian nomor telepon tidak boleh kosong.');
    }
    else {
      // Show Preloader
      app.dialog.preloader("Sedang mengirim kode validasi ke email anda!");
      app.request.post(apiUrl + 'apam/', {
        action: 'register',
        nama_lengkap: nama_lengkap,
        email: email,
        nomor_ktp: nomor_ktp,
        nomor_telepon: nomor_telepon,
        token: token
      }, function (data) {
        //console.log(data);
        app.dialog.close();
        data = JSON.parse(data);

        if(data.state == "invalid") {
          app.dialog.alert('Gagal menyimpan data pendaftaran. Silahkan ulangi lagi beberapa saat.');
          //mainView.router.navigate('/', {
            //clearPreviousHistory: true
          //});
        }
        else if(data.state == "duplicate") {
          app.dialog.alert('Nomor KTP atau Email sudah terdaftar disistem.');
          //mainView.router.navigate('/', {
            //clearPreviousHistory: true
          //});
        }
        else if(data.state == "valid") {
          localStorage.setItem("email", data.email);
          localStorage.setItem("kode_validasi", data.kode_validasi);
          localStorage.setItem("time_wait", data.time_wait);
          mainView.router.navigate('/postregister/', {
            //clearPreviousHistory: true
          });
        }
        else {
          app.dialog.alert('Register error:', data);
        }
      });
    }
  });
});

//=================================================//
// Load data untuk halaman postregister.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="postregister"]', function(e) {

  var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus' , 'September' , 'Oktober', 'November', 'Desember'];
  var dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  var calendarTglLahir = app.calendar.create({
    inputEl: '#tgl_lahir',
    closeOnSelect: true,
    weekHeader: true,
    dateFormat: 'yyyy-mm-dd',
    dayNamesShort: dayNamesShort,
    monthNames: monthNames
  });

  var email = localStorage.getItem("email");

  app.dialog.alert('Kode validasi telah dikirim alamat email anda. Silahkan cek.');

  app.request.post(apiUrl + 'apam/', {
    action: "postregister",
    email: email,
    token: token
  }, function (data) {
    data = JSON.parse(data);

    $$('.nama_lengkap').val(data['nama_lengkap']);
    $$('.email').val(data['email']);
    $$('.nomor_ktp').val(data['nomor_ktp']);
    $$('.nomor_telepon').val(data['nomor_telepon']);

    $$('.page[data-name="postregister"] .saveregister-btn').on('click', function () {
      var kode_validasi = $$('#postregister-form .kode_validasi').val();
      var nm_pasien = $$('#postregister-form .nama_lengkap').val();
      var email = $$('#postregister-form .email').val();
      var no_ktp = $$('#postregister-form .nomor_ktp').val();
      var no_tlp = $$('#postregister-form .nomor_telepon').val();
      var tgl_lahir = $$('#postregister-form .tgl_lahir').val();
      var alamat = $$('#postregister-form .alamat').val();
      var jk = $$('#postregister-form .jk').val();

      if(kode_validasi == localStorage.getItem("kode_validasi")) {
        app.dialog.preloader("Menghubungkan ke server...");
        app.request.post(apiUrl + 'apam/', {
          action: "saveregister",
          kode_validasi: kode_validasi,
          nm_pasien: nm_pasien,
          email: email,
          no_ktp: no_ktp,
          no_tlp: no_tlp,
          tgl_lahir: tgl_lahir,
          alamat: alamat,
          jk: jk,
          token: token
        }, function (data) {
          console.log(data);
          app.dialog.close();
          data = JSON.parse(data);
          if(data.state == "invalid") {
            app.dialog.alert('Gagal menimpan data pendaftaran. Silahkan ulangi lagi.');
          }
          else if(data.state == "valid") {
            localStorage.removeItem("email");
            localStorage.removeItem("kode_validasi");
            localStorage.removeItem("time_wait");
            localStorage.setItem("no_rkm_medis", data.no_rkm_medis);
            mainView.router.navigate('/home/', {
              clearPreviousHistory: true
            });
          }
          else {
            app.dialog.alert('Register error:', data);
          }
        });
      } else {
        app.dialog.alert('Kode validasi salah. Silahkan cek di email anda.');
      }
    });

  });

});

//=================================================//
// Load data untuk halaman home.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="home"]', function(e) {

  $$(".nama-instansi").html(nama_instansi);

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  app.dialog.preloader('Loading...');

  if (no_rkm_medis) {

    app.request.post(apiUrl + 'apam/', {
      action: "profil",
      no_rkm_medis: no_rkm_medis,
      token: token
    }, function (data) {
      //console.log(data);
      //app.dialog.close();
      data = JSON.parse(data);

      $$('.nm_pasien').text(data['nm_pasien']);
      document.getElementById("foto").src = data['foto'];

    });

    var notifikasi = setInterval(function () {
      app.request.post(apiUrl + 'apam/', {
        action: 'notifikasi',
        no_rkm_medis: no_rkm_medis,
        token: token
      }, function (data) {
        data = JSON.parse(data);
        $$('.notifikasi').text(data.length);
        for(i=0; i<data.length; i++) {
          if(data[i].state == 'valid') {
            app.notification.create({
              icon: '<i class="icon material-icons md-only color-red">priority_high</i>',
              title: 'Notifikasi',
              titleRightText: data[i].status,
              subtitle: data[i].judul,
              text: data[i].pesan,
              closeButton: true,
              closeOnClick: true,
              on: {
                close: function () {
                },
              },
            }).open();
          }
        }
      });
      clearInterval(notifikasi);
    }, 3000);

    var hitungralan = setInterval(function () {
      app.request.post(apiUrl + 'apam/', {
        action: 'hitungralan',
        no_rkm_medis: no_rkm_medis,
        token: token
      }, function (data) {
        $$('.hitungralan').text(data);
      });
      //clearInterval(notifikasi);
    }, 3000);

    var hitungranap = setInterval(function () {
      app.request.post(apiUrl + 'apam/', {
        action: 'hitungranap',
        no_rkm_medis: no_rkm_medis,
        token: token
      }, function (data) {
        $$('.hitungranap').text(data);
      });
      //clearInterval(notifikasi);
    }, 3000);

  }

  app.request.post(apiUrl + 'apam/', {
    action: 'layananunggulan',
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {

      $$('.services_11').text(data[i]['homepage_services_11']);
      $$('.services_12').text(data[i]['homepage_services_12']);
      $$('.services_14').text(data[i]['homepage_services_14']);

      $$('.services_21').text(data[i]['homepage_services_21']);
      $$('.services_22').text(data[i]['homepage_services_22']);
      $$('.services_24').text(data[i]['homepage_services_24']);

      $$('.services_31').text(data[i]['homepage_services_31']);
      $$('.services_32').text(data[i]['homepage_services_32']);
      $$('.services_34').text(data[i]['homepage_services_34']);

      $$('.services_41').text(data[i]['homepage_services_41']);
      $$('.services_42').text(data[i]['homepage_services_42']);
      $$('.services_44').text(data[i]['homepage_services_44']);

      $$('.services_51').text(data[i]['homepage_services_51']);
      $$('.services_52').text(data[i]['homepage_services_52']);
      $$('.services_54').text(data[i]['homepage_services_54']);

      $$('.services_61').text(data[i]['homepage_services_61']);
      $$('.services_62').text(data[i]['homepage_services_62']);
      $$('.services_64').text(data[i]['homepage_services_64']);

    }

  });

  //Getting Booking list
  app.request.post(apiUrl + 'apam/', {
    action: 'lastnews',
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      /*html += '<li>';
      html += ' <a href="/booking/' + no_rkm_medis + '/' + data[i]['tanggal_periksa'] + '/' + data[i]['no_reg'] + '/" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tanggal_periksa'] + ' / ' + data[i]['status'] + '</div>';
      html += '     ' + data[i]['nm_poli'] + '';
      html += '     <div class="item">' + data[i]['nm_dokter'] + '</div>';
      html += '     <div class="">' + data[i]['png_jawab'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';*/

      html += '<li>';
      html += '  <div class="course-bx style-1">';
      html += '    <div class="dz-media"><a href="/news/' + data[i]['id'] + '/"><img src="' + website_upload + 'website/news/' + data[i]['cover_photo'] + '" width="55"/></a></div>';
      html += '    <div class="dz-info">';
      html += '      <div class="dz-head">';
      html += '        <a href="/course-detail/" class="categorie">Berita</a>';
      html += '        <h6 class="item-title title"><a href="/news/' + data[i]['id'] + '/">' + data[i]['title'] + '</a></h6>';
      html += '      </div>';
      html += '      <div class="dz-meta">';
      html += '        <ul>';
      html += '          <li>';
      html += '            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 32 32">';
      html += '              <path d="m28 3h-22a1 1 0 0 0 -1 1v5h-1a1 1 0 0 0 0 2h1v4h-1a1 1 0 0 0 0 2h1v4h-1a1 1 0 0 0 0 2h1v5a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1v-24a1 1 0 0 0 -1-1zm-1 24h-20v-4h1a1 1 0 0 0 0-2h-1v-4h1a1 1 0 0 0 0-2h-1v-4h1a1 1 0 0 0 0-2h-1v-4h20z"/>';
      html += '              <path d="m19 14h4a1 1 0 0 0 1-1v-4a1 1 0 0 0 -1-1h-4a1 1 0 0 0 -1 1v4a1 1 0 0 0 1 1zm1-4h2v2h-2z"/>';
      html += '            </svg>';
      html += '            ' + data[i]['tanggal'] + '';
      html += '          </li>';
      html += '        </ul>';
      html += '      </div>';
      html += '    </div>';
      html += '  </div>';
      html += '</li>';

    }

    $$(".lastnews-list").html(html);

  });

  //Getting Booking Result
  app.request.post(apiUrl + 'apam/', {
    action: 'antrian',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);
    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<div class="row">';
      html += '  <div class="col">';
      html += '      <div class="text-align-center" style="font-size:18px;font-weight:bold;text-shadow: 2px 2px 4px #000000;color:#fff;padding-top:5px;">' + data[i]['nm_poli'] + '</div>';
      html += '  </div>';
      html += '</div>';
      html += '<div class="row">';
      html += '  <div class="col">';
      html += '      <div class="text-align-center" style="font-size:18px;font-weight:bold;text-shadow: 2px 2px 4px #000000;color:#fff;padding-top:px;">' + data[i]['nm_dokter'] + '</div>';
      html += '  </div>';
      html += '</div>';
      html += '<div class="row" style="margin:0px !important; padding:0px !important;">';
      html += '  <div class="col" style="margin:0px !important; padding:0px !important;">';
      html += '      <div class="text-align-center" style="font-size:50px;font-weight:bold;text-shadow: 2px 2px 4px #000000;color:#fff;padding-top:0px;">' + data[i]['no_reg'] + '</div>';
      html += '  </div>';
      html += '</div>';
    }

    $$(".antrian-list").html(html);

  });


  //Getting Booking list
  app.request.post(apiUrl + 'apam/', {
    action: 'lastbooking',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <a href="/booking/' + no_rkm_medis + '/' + data[i]['tanggal_periksa'] + '/' + data[i]['no_reg'] + '/" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tanggal_periksa'] + ' / ' + data[i]['status'] + '</div>';
      html += '     ' + data[i]['nm_poli'] + '';
      html += '     <div class="item">' + data[i]['nm_dokter'] + '</div>';
      html += '     <div class="">' + data[i]['png_jawab'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';
    }

    $$(".lastbooking-list").html(html);

  });


  //Getting Rujukan list
  app.request.post(apiUrl + 'apam/', {
    action: 'cekrujukan',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';

    if(data.state == "offline") {
      //Jika server BPJS Down
    } else if(data.state == "error") {
      //Jika tidak terdaftar sebagai peserta BPJS
    } else {

      for(i=0; i<data.length; i++) {

        html += '<div class="swiper-slide">';
        html += '  <div class="card facebook-card">';
        html += '    <div class="card-header">';
        html += '      <div class="facebook-avatar"><img src="img/logo-bpjs.png" width="36" height="36"/></div>';
        html += '      <div class="facebook-name">Rujukan BPJS Kesehatan</div>';
        html += '      <div class="facebook-date">No. Peserta : ' + data[i]['noKartu'] + '</div>';
        html += '    </div>';
        html += '    <div class="card-content card-content-padding">';
        html += '      <div class="card-content-inner">';
        html += '        <div>Tanggal Kunjungan : ' + data[i]['tglKunjungan'] + '</div>';
        html += '        <div>Diagnosa : ' + data[i]['diagnosa'] + '</div>';
        html += '        <div>Status : ' + data[i]['status'] + '</div><br>';
        html += '        <img src="' + apiUrl + 'barcode.php?text=' + data[i]['noRujukan'] + '&size=48&print=true">';
        html += '      </div>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

      }

    }

    $$("#rujukan-list").html(html);

  });

});

//=================================================//
// Load data untuk halaman notifikasi.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="notifikasi"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  //Getting Dokter list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'notifikasilist',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    //console.log(data);
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<div class="card card-bx noti-area">';
      html += '  <div class="item-title"><i class="text-success fa fa-circle"></i> ' + data[i]['judul'] + '</div>';
      html += '  <div class="item-text">' + data[i]['pesan'] + '</div>';
      html += '  <div class="item-time">';
      html += '    <span><i class="fa fa-clock-o"></i> ' + data[i]['tanggal'] + '</span>';
      if(data[i]['status'] == 'unread') {
        html += '    <span class="text-primary tandai_sudah_dibaca color-red" data-judul="' + data[i]['judul'] + '" data-id="' + data[i]['id'] + '">Tandai dibaca</span>';
      } else {
        html += '    <span class="text-primary">Sudah dibaca</span>';
      }
      html += '  </div>';
      html += '</div>';
    }

    $$(".notifikasi-list").html(html);
  });

  $$(document).on('click', '.tandai_sudah_dibaca', function(){
      var judul  = $$(this).attr('data-judul');
      var id = $$(this).attr('data-id');
      console.log(name + ' - ' + id);
      //mainView.router.navigate(apiUrl + 'apam/' + name + '&id=' + id);
      app.request.post(apiUrl + 'apam/', {
        action: 'tandaisudahdibaca',
        id: id,
        token: token
      }, function (data) {
        app.dialog.alert('Notifikasi ' + judul + ' sudah dibaca..!');
      });
  });

});

//=================================================//
// Load data untuk halaman notifikasi.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="telemedicine__"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  //Getting Dokter list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'telemedicine',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    //console.log(data);
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += '  <a href="/telemedicine/' + data[i]['kd_dokter'] + '/' + data[i]['kd_poli'] + '/" class="item-link item-content">';
      html += '    <div class="item-media"><img src="img/' + data[i]['jk'] + '.png" width="50"></div>';
      html += '    <div class="item-inner">';
      html += '      <div class="item-title-row">';
      html += '        <div class="item-title">' + data[i]['nm_dokter'] + '</div>';
      html += '      </div>';
      html += '      <div class="item-text">' + data[i]['nm_poli'] + '</div>';
      html += '      <div class="item-subtitle">' + data[i]['jam_mulai'] + ' - ' + data[i]['jam_selesai'] + '</div>';
      html += '    </div>';
      html += '  </a>';
      html += '</li>';
    }

    $$(".telemedicine-list").html(html);
  });

});

$$(document).on('page:init', '.page[data-name="telemedicine"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");
  var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus' , 'September' , 'Oktober', 'November', 'Desember'];
  var dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  var calendarDokter = app.calendar.create({
    inputEl: '#dokter-calendar',
    closeOnSelect: true,
    weekHeader: true,
    dateFormat: 'yyyy-mm-dd',
    dayNamesShort: dayNamesShort,
    monthNames: monthNames,
    on: {
      closed: function () {
        var tanggal = $$('#dokter-calendar').val();
        //console.log('Calendar closed ' + tanggal + 'isinya')
        //Getting History list
        app.dialog.preloader("Loading...");
        app.request.post(apiUrl + 'apam/', {
          action: 'telemedicine',
          tanggal: tanggal,
          no_rkm_medis: no_rkm_medis,
          token: token
        }, function (data) {
          app.dialog.close();
          data = JSON.parse(data);

          var html = '';
          if(data.state == "notfound") {
            html += '<li><div class="item-content">Tidak ada jadwal dokter hari ini</div></li>';
          } else {
            for(i=0; i<data.length; i++) {
              html += '<li>';
              html += '  <a href="/telemedicine/' + no_rkm_medis + '/' + tanggal + '/' + data[i]['kd_poli'] + '/' + data[i]['nm_poli'] + '/' + data[i]['kd_dokter'] + '/' + data[i]['nm_dokter'] + '/" class="item-link item-content">';
              html += '  <div class="item-media"><img src="img/' + data[i]['jk'] + '.png" width="44"></div>';
              html += '  <div class="item-inner">';
              html += '   <div class="item-title">';
              html += '    <div class="item">' + data[i]['nm_poli'] + '</div>';
              html += '    ' + data[i]['nm_dokter'] + '';
              html += '    <div style="font-size:12px;">' + data[i]['jam_mulai'] + ' s/d ' + data[i]['jam_selesai'] + ' WITA</div>';
              html += '   </div>';
              html += '  </div>';
              html += ' </a>';
              html += '</li>';
            }
          }

          $$(".telemedicine-list").html(html);

        });
      }
    }
  });

  //Getting History list
  app.dialog.preloader("Loading...");
  var tanggal = new Date().getFullYear()+'-'+("0"+(new Date().getMonth()+1)).slice(-2)+'-'+("0"+new Date().getDate()).slice(-2);
  //console.log('Get hari ini ' + today + 'bro isinya')
  app.request.post(apiUrl + 'apam/', {
    action: 'telemedicine',
    tanggal: tanggal,
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);
    //console.log(data);
    var html = '';
    if(data.state == "notfound") {
      html += '<li><div class="item-content">Tidak ada jadwal dokter hari ini</div></li>';
    } else {
      for(i=0; i<data.length; i++) {
        //var kd_dokter = data[i]['kd_dokter'];
        //console.log(kd_dokter);
        html += '<li>';
        html += '  <a href="/telemedicine/' + no_rkm_medis + '/' + tanggal + '/' + data[i]['kd_poli'] + '/' + data[i]['nm_poli'] + '/' + data[i]['kd_dokter'] + '/' + data[i]['nm_dokter'] + '/' + data[i]['biaya'] + '/" class="item-link item-content">';
        html += '  <div class="item-media"><img src="img/' + data[i]['jk'] + '.png" width="44"></div>';
        html += '  <div class="item-inner">';
        html += '   <div class="item-title">';
        html += '    <div class="item">' + data[i]['nm_poli'] + '</div>';
        html += '    ' + data[i]['nm_dokter'] + '';
        html += '    <div style="font-size:12px;">' + data[i]['jam_mulai'] + ' s/d ' + data[i]['jam_selesai'] + ' WITA</div>';
        html += '   </div>';
        html += '  </div>';
        html += ' </a>';
        html += '</li>';
      }
    }

    $$(".telemedicine-list").html(html);

  });

});

//=================================================//
// Load data untuk halaman booking-detail.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="telemedicinedaftar"]', function(e) {

  var page = e.detail;
  var no_rkm_medis = page.route.params.no_rkm_medis;
  var tanggal = page.route.params.tanggal;
  var kd_poli = page.route.params.kd_poli;
  var nm_poli = page.route.params.nm_poli;
  var kd_dokter = page.route.params.kd_dokter;
  var nm_dokter = page.route.params.nm_dokter;
  var biaya = page.route.params.biaya;

  var	reverse = biaya.toString().split('').reverse().join(''),
  	biaya = reverse.match(/\d{1,3}/g);
  	biaya	= biaya.join('.').split('').reverse().join('');

  $$('#no_rkm_medis').val(no_rkm_medis);
  $$('#tanggal').val(tanggal);
  $$('#kd_poli').val(kd_poli);
  $$('#nm_poli').val(nm_poli);
  $$('#kd_dokter').val(kd_dokter);
  $$('#nm_dokter').val(nm_dokter);
  $$('#biaya').text(biaya);

  $$('.page[data-name="telemedicinedaftar"] .daftar-btn').on('click', function () {

    if(no_rkm_medis == "") {
      app.dialog.alert('Nomor rekam medis anda tidak sesuai dengan akun login.');
    }
    else if(tanggal == "") {
      app.dialog.alert('Silahkan masukkan tanggal berobat.');
    }
    else if(kd_poli == "") {
      app.dialog.alert('Pilih klinik tujuan anda.');
    }
    else if(kd_dokter == "") {
      app.dialog.alert('Silahkan pilih dokter.');
    }
    else {
      // Show Preloader
      app.dialog.preloader("Loading...");
      app.request.post(apiUrl + 'apam/', {
        action: "telemedicinedaftar",
        no_rkm_medis: no_rkm_medis,
        tanggal: tanggal,
        kd_poli: kd_poli,
        kd_dokter: kd_dokter,
        token: token
      }, function (data) {
        app.dialog.close();
        console.log(data);
        data = JSON.parse(data);
        if(data.state == "duplication") {
          app.dialog.alert('Anda sudah terdaftar ditanggal pilihan anda.');
        }
        else if(data.state == "limit") {
          app.dialog.alert('Kuota pendaftaran terpenuhi. Silahkan pilih hari/tanggal lain.');
        }
        else if(data.state == "success") {
          mainView.router.navigate('/telemedicine-sukses/', {
            clearPreviousHistory: true
          });
        }
        else {
          app.dialog.alert('Register error: ', data);
        }
      });
    }

  });

});

//=================================================//
// Load data untuk halaman telemedicine-sukses.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="telemedicinesukses"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  //Getting Booking Result
  app.dialog.preloader("Loading...");
  app.request.post(apiUrl + 'apam/', {
    action: 'telemedicinesukses',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);
    var html = '';
    for(i=0; i<data.length; i++) {
      html += ' <div class="item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title">';
      html += '    Nomor Kartu Berobat: ' + no_rkm_medis + '';
      html += '    <div class="item-header">Tanggal booking: ' + data[i]['tanggal_booking'] + '</div>';
      html += '    <div class="item-header">Tanggal periksa: ' + data[i]['tanggal_periksa'] + '</div>';
      html += '    <div class="item">Status booking: ' + data[i]['status'] + '</div>';
      html += '    Klinik: ' + data[i]['nm_poli'] + '';
      html += '    <div class="item">Dokter: ' + data[i]['nm_dokter'] + '</div>';
      html += '    <div class="item">Nomor antrian: ' + data[i]['no_reg'] + '</div>';
      html += '    <div class="item-footer">Cara bayar: ' + data[i]['png_jawab'] + '</div>';
      html += '    <div class="item-footer"><br><br><a onclick=\'window.open("' + data[i]['paymentUrl'] + '","_blank", "location=yes")\' href=\'javascript:void(0)\' class="button button-large button-round button-outline">Bayar DISINI</a></div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </div>';
    }

    $$(".sukses-detail").html(html);

  });

});

//=================================================//
// Load data untuk halaman booking-detail.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="bookingdetail"]', function(e) {

  var page = e.detail;
  var no_rkm_medis = page.route.params.no_rkm_medis;
  var tanggal_periksa = page.route.params.tanggal_periksa;
  var no_reg = page.route.params.no_reg;

  app.dialog.preloader('Loading...');

  var typeNumber = 4;
  var errorCorrectionLevel = 'L';
  cellSize = 6,
	margin = 10;
  var qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(no_reg);
  qr.make();
  document.getElementById('qrBooking').innerHTML = qr.createImgTag(cellSize, margin);

  //Getting Booking list
  app.request.post(apiUrl + 'apam/', {
    action: 'bookingdetail',
    no_rkm_medis: no_rkm_medis,
    tanggal_periksa: tanggal_periksa,
    no_reg: no_reg,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += ' <div class="item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title">';
      html += '    Nomor Kartu Berobat: ' + no_rkm_medis + '';
      html += '    <div class="item-header">Tanggal daftar: ' + data[i]['tanggal_booking'] + '</div>';
      html += '    <div class="item-header">Tanggal periksa: ' + data[i]['tanggal_periksa'] + '</div>';
      html += '    <div class="item-header">Status validasi: ' + data[i]['status'] + '</div>';
      html += '    Klinik: ' + data[i]['nm_poli'] + '';
      html += '    <div class="item">Dokter: ' + data[i]['nm_dokter'] + '</div>';
      html += '    <div class="item">Nomor antrian: ' + data[i]['no_reg'] + '</div>';
      html += '    <div class="item-footer">Cara bayar: ' + data[i]['png_jawab'] + '</div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </div>';
    }

    $$(".booking-detail").html(html);

  });

});

//=================================================//
// Load data untuk halaman kamar.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="kamar"]', function(e) {

  //Getting Dokter list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'kamar',
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li><a href="#" class="item-link">';
      html += ' <div class="item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title">';
      html += '    <div class="item">' + data[i]['kelas'] + '</div>';
      html += '    Tersedia: ' + data[i]['kosong'] + '';
      html += '    <div style="font-size:12px;">Kapasitas: ' + data[i]['total'] + '</div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </div>';
      html += '</a></li>';
    }

    $$(".kamar-list").html(html);
  });

});

//=================================================//
// Load data untuk halaman dokter.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="dokter"]', function(e) {

  var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus' , 'September' , 'Oktober', 'November', 'Desember'];
  var dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  var calendarDokter = app.calendar.create({
    inputEl: '#dokter-calendar',
    closeOnSelect: true,
    weekHeader: true,
    dateFormat: 'yyyy-mm-dd',
    dayNamesShort: dayNamesShort,
    monthNames: monthNames,
    on: {
      closed: function () {
        var tanggal = $$('#dokter-calendar').val();
        //console.log('Calendar closed ' + tanggal + 'isinya')
        //Getting History list
        app.dialog.preloader("Loading...");
        app.request.post(apiUrl + 'apam/', {
          action: 'dokter',
          tanggal: tanggal,
          token: token
        }, function (data) {
          app.dialog.close();
          data = JSON.parse(data);

          var html = '';
          if(data.state == "notfound") {
            html += '<li><div class="item-content">Tidak ada jadwal dokter hari ini</div></li>';
          } else {
            for(i=0; i<data.length; i++) {
              html += '<li>';
              html += ' <div class="item-content">';
              html += '  <div class="item-media"><img src="img/' + data[i]['jk'] + '.png" width="44"></div>';
              html += '  <div class="item-inner">';
              html += '   <div class="item-title">';
              html += '    <div class="item">' + data[i]['nm_poli'] + '</div>';
              html += '    ' + data[i]['nm_dokter'] + '';
              html += '    <div style="font-size:12px;">' + data[i]['jam_mulai'] + ' s/d ' + data[i]['jam_selesai'] + ' WITA</div>';
              html += '   </div>';
              html += '  </div>';
              html += ' </div>';
              html += '</li>';
            }
          }

          $$(".dokter-list").html(html);

        });
      }
    }
  });

  //Getting History list
  app.dialog.preloader("Loading...");
  var today = new Date().getFullYear()+'-'+("0"+(new Date().getMonth()+1)).slice(-2)+'-'+("0"+new Date().getDate()).slice(-2);
  //console.log('Get hari ini ' + today + 'bro isinya')
  app.request.post(apiUrl + 'apam/', {
    action: 'dokter',
    tanggal: today,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    if(data.state == "notfound") {
      html += '<li><div class="item-content">Tidak ada jadwal dokter hari ini</div></li>';
    } else {
      for(i=0; i<data.length; i++) {
        html += '<li>';
        html += ' <div class="item-content">';
        html += '  <div class="item-media"><img src="img/' + data[i]['jk'] + '.png" width="44"></div>';
        html += '  <div class="item-inner">';
        html += '   <div class="item-title">';
        html += '    <div class="item">' + data[i]['nm_poli'] + '</div>';
        html += '    ' + data[i]['nm_dokter'] + '';
        html += '    <div style="font-size:12px;">' + data[i]['jam_mulai'] + ' s/d ' + data[i]['jam_selesai'] + ' WITA</div>';
        html += '   </div>';
        html += '  </div>';
        html += ' </div>';
        html += '</li>';
      }
    }

    $$(".dokter-list").html(html);

  });

});

//=================================================//
// Load data untuk halaman riwayat-list.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="riwayatlist"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  //Getting Dokter list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'riwayat',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <a href="/riwayat/' + no_rkm_medis + '/' + data[i]['tgl_registrasi'] + '/' + data[i]['no_reg'] + '/" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tgl_registrasi'] + '</div>';
      html += '     ' + data[i]['nm_poli'] + '';
      html += '     <div class="item">' + data[i]['nm_dokter'] + '</div>';
      html += '     <div class="">' + data[i]['png_jawab'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';
    }

    $$(".riwayat-list").html(html);

  });

});

//=================================================//
// Load data untuk halaman riwayat-list.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="bookinglist"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  //Getting Booking list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'booking',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <a href="/booking/' + no_rkm_medis + '/' + data[i]['tanggal_periksa'] + '/' + data[i]['no_reg'] + '/" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tanggal_periksa'] + ' / ' + data[i]['status'] + '</div>';
      html += '     ' + data[i]['nm_poli'] + '';
      html += '     <div class="item">' + data[i]['nm_dokter'] + '</div>';
      html += '     <div class="">' + data[i]['png_jawab'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';
    }

    $$(".booking-list").html(html);

  });

});

//=================================================//
// Load data untuk halaman riwayat-list.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="billinglist"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  //Getting Booking list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'billing',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      //html += ' <a href="/billing/' + no_rkm_medis + '/' + data[i]['tgl_registrasi'] + '/" class="item-link item-content">';
      html += ' <a href="#" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tgl_registrasi'] + '</div>';
      html += '     <b>Klinik:</b> ' + data[i]['nm_poli'] + '';
      html += '     <div class=""><b>Kode:</b> ' + data[i]['kd_billing'] + '</div>';
      html += '     <div class=""><b>Total:</b> Rp. ' + data[i]['total_bayar'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';
    }

    $$(".billing-list").html(html);

  });

});

//=================================================//
// Load data untuk halaman riwayat-list.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="riwayatranaplist"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  //Getting Dokter list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'riwayatranap',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <a href="/riwayatranap/' + no_rkm_medis + '/' + data[i]['tgl_registrasi'] + '/' + data[i]['no_reg'] + '/" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tgl_registrasi'] + '</div>';
      html += '     ' + data[i]['nm_bangsal'] + '';
      html += '     <div class="item">' + data[i]['nm_dokter'] + '</div>';
      html += '     <div class="">' + data[i]['png_jawab'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';
    }

    $$(".riwayatranap-list").html(html);

  });

});

//=================================================//
// Load data untuk halaman rawatjalan.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="rawatjalan"]', function(e) {

  //Getting Dokter list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'rawatjalan',
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <div class="item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title">';
      html += '    <div class="item">Klinik: ' + data[i]['nm_poli'] + '</div>';
      html += '    <div style="font-size:12px;">Tarif: Rp. ' + data[i]['registrasi'] + '</div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </div>';
      html += '</li>';
    }

    $$(".rawatjalan-list").html(html);
  });

});

//=================================================//
// Load data untuk halaman rawatinap.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="rawatinap"]', function(e) {

  //Getting Dokter list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'rawatinap',
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <div class="item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title">';
      html += '    <div class="item">Kamar: ' + data[i]['nm_bangsal'] + ' - ' + data[i]['kd_kamar'] + '</div>';
      html += '    <div class="item">Kelas: ' + data[i]['kelas'] + '</div>';
      html += '    <div class="item">Status: ' + data[i]['status'] + '</div>';
      html += '    <div style="font-size:12px;">Tarif: Rp. ' + data[i]['trf_kamar'] + '</div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </div>';
      html += '</li>';
    }

    $$(".rawatinap-list").html(html);
  });

});

//=================================================//
// Load data untuk halaman laboratorium.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="laboratorium"]', function(e) {

  //Getting Dokter list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'laboratorium',
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <div class="item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title">';
      html += '    <div class="item">Jenis: ' + data[i]['nm_perawatan'] + '</div>';
      html += '    <div style="font-size:12px;">Tarif: ' + data[i]['total_byr'] + '</div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </div>';
      html += '</li>';
    }

    $$(".laboratorium-list").html(html);
  });

});

//=================================================//
// Load data untuk halaman radiologi.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="radiologi"]', function(e) {

  //Getting Dokter list
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: 'radiologi',
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <div class="item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title">';
      html += '    <div class="item">Jenis: ' + data[i]['nm_perawatan'] + '</div>';
      html += '    <div style="font-size:12px;">Tarif: ' + data[i]['total_byr'] + '</div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </div>';
      html += '</li>';
    }

    $$(".radiologi-list").html(html);
  });

});

//=================================================//
// Load data untuk halaman riwayat-detail.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="riwayatdetail"]', function(e) {

  var page = e.detail;
  var no_rkm_medis = page.route.params.no_rkm_medis;
  var tgl_registrasi = page.route.params.tgl_registrasi;
  var no_reg = page.route.params.no_reg;

  //Getting History list
  app.dialog.preloader("Loading...");
  app.request.post(apiUrl + 'apam/', {
    action: 'riwayatdetail',
    no_rkm_medis: no_rkm_medis,
    tgl_registrasi: tgl_registrasi,
    no_reg: no_reg,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {

      html += '<div class="block-title">Data Pendaftaran</div>';
      html += '<div class="card">';
      html += ' <div class="list">';
      html += '  <ul>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Nomor Rawat</div>';
      html += '      <div class="item-after">' + data[i]['no_rawat'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Tanggal</div>';
      html += '      <div class="item-after">' + data[i]['tgl_registrasi'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Klinik</div>';
      html += '      <div class="item-after">' + data[i]['nm_poli'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Dokter</div>';
      html += '      <div class="item-after">' + data[i]['nm_dokter'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Cara Bayar</div>';
      html += '      <div class="item-after">' + data[i]['png_jawab'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '  </ul>';
      html += ' </div>';
      html += '</div>';

      html += '<div class="block-title">Pemeriksaan</div>';
      html += '<div class="card padding">';
      html += '  <div class="card-content">Keluhan: ' + data[i]['keluhan'] + '</div>';
      html += '  <div class="card-content">Pemeriksaan: ' + data[i]['pemeriksaan'] + '</div>';
      html += '</div>';

      html += '<div class="block-title">Diagnosa</div>';
      html += '<div class="card padding">';
      html += '  <div class="card-content">' + data[i]['nm_penyakit'] + '</div>';
      html += '</div>';

      html += '<div class="block-title">Resep Obat</div>';
      html += '<div class="card padding">';
      html += '  <div class="card-content">' + data[i]['nama_brng'] + '</div>';
      html += '</div>';

      html += '<div class="block-title">Pemeriksaan Laboratorium</div>';
      html += '<div class="card padding">';
      if(data[i]['pemeriksaan_lab'] == '') {
        html += '  <div class="card-content">null</div>';
      } else {
        html += '  <div class="card-content">' + data[i]['pemeriksaan_lab'] + '</div>';
      }
      html += '</div>';

      html += '<div class="block-title">Pemeriksaan Radiologi</div>';
      html += '<div class="card padding">';
      if(data[i]['hasil_radiologi'] == '') {
        html += '  <div class="card-content">null</div>';
      } else {
        html += '  <div class="card-content">' + data[i]['hasil_radiologi'] + '</div>';
      }
      html += '</div>';

      html += '<div class="block-title">Hasil Radiologi</div>';
      html += '<div class="card padding">';
      if(data[i]['gambar_radiologi'] == null) {
        html += '  <div class="card-content">' + data[i]['gambar_radiologi'] + '</div>';
      } else {
        html += '  <div class="card-content"><img src="' + webapps_url + 'radiologi/' + data[i]['gambar_radiologi'] + '" width="100%"/></div>';
      }
      html += '</div>';

    }

    $$(".riwayat-detail").html(html);

  });

});

//=================================================//
// Load data untuk halaman riwayat-detail.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="riwayatranap-detail"]', function(e) {

  var page = e.detail;
  var no_rkm_medis = page.route.params.no_rkm_medis;
  var tgl_registrasi = page.route.params.tgl_registrasi;
  var no_reg = page.route.params.no_reg;

  //Getting History list
  app.dialog.preloader("Loading...");
  app.request.post(apiUrl + 'apam/', {
    action: 'riwayatranapdetail',
    no_rkm_medis: no_rkm_medis,
    tgl_registrasi: tgl_registrasi,
    no_reg: no_reg,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {

      html += '<div class="block-title">Data Pendaftaran</div>';
      html += '<div class="card">';
      html += ' <div class="list">';
      html += '  <ul>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Nomor Rawat</div>';
      html += '      <div class="item-after">' + data[i]['no_rawat'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Tanggal</div>';
      html += '      <div class="item-after">' + data[i]['tgl_registrasi'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Bangsal/Kamar</div>';
      html += '      <div class="item-after">' + data[i]['nm_bangsal'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Dokter</div>';
      html += '      <div class="item-after">' + data[i]['nm_dokter'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '   <li>';
      html += '    <div class="item-content">';
      html += '     <div class="item-inner">';
      html += '      <div class="item-title">Cara Bayar</div>';
      html += '      <div class="item-after">' + data[i]['png_jawab'] + '</div>';
      html += '     </div>';
      html += '    </div>';
      html += '   </li>';
      html += '  </ul>';
      html += ' </div>';
      html += '</div>';

      html += '<div class="block-title">Pemeriksaan</div>';
      html += '<div class="card padding">';
      html += '  <div class="card-content">Keluhan: ' + data[i]['keluhan'] + '</div>';
      html += '  <div class="card-content">Pemeriksaan: ' + data[i]['pemeriksaan'] + '</div>';
      html += '</div>';

      html += '<div class="block-title">Diagnosa</div>';
      html += '<div class="card padding">';
      html += '  <div class="card-content">' + data[i]['nm_penyakit'] + '</div>';
      html += '</div>';

      html += '<div class="block-title">Resep Obat</div>';
      html += '<div class="card padding">';
      html += '  <div class="card-content">' + data[i]['nama_brng'] + '</div>';
      html += '</div>';

      html += '<div class="block-title">Pemeriksaan Laboratorium</div>';
      html += '<div class="card padding">';
      if(data[i]['pemeriksaan_lab'] == '') {
        html += '  <div class="card-content">null</div>';
      } else {
        html += '  <div class="card-content">' + data[i]['pemeriksaan_lab'] + '</div>';
      }
      html += '</div>';

      html += '<div class="block-title">Pemeriksaan Radiologi</div>';
      html += '<div class="card padding">';
      if(data[i]['hasil_radiologi'] == '') {
        html += '  <div class="card-content">null</div>';
      } else {
        html += '  <div class="card-content">' + data[i]['hasil_radiologi'] + '</div>';
      }
      html += '</div>';

      html += '<div class="block-title">Hasil Radiologi</div>';
      html += '<div class="card padding">';
      if(data[i]['gambar_radiologi'] == null) {
        html += '  <div class="card-content">' + data[i]['gambar_radiologi'] + '</div>';
      } else {
        html += '  <div class="card-content"><img src="' + webapps_url + 'radiologi/' + data[i]['gambar_radiologi'] + '" width="100%"/></div>';
      }
      html += '</div>';

    }

    $$(".riwayatranap-detail").html(html);

  });

});

//=================================================//
  // Load data untuk halaman profil.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="profil"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  var getLayout = localStorage.getItem("layout");
  $$("input[value=" + getLayout + "]").prop('checked', true);

  var getColor = localStorage.getItem("color");
  $$("option[value=" + getColor + "]").prop('selected', true);

  var typeNumber = 4;
  var errorCorrectionLevel = 'L';
  cellSize = 6,
	margin = 10;
  var qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(no_rkm_medis);
  qr.make();
  document.getElementById('qrKartuVirtual').innerHTML = qr.createImgTag(cellSize, margin);

  //Getting user information
  app.dialog.preloader('Loading...');
  app.request.post(apiUrl + 'apam/', {
    action: "profil",
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    //app.dialog.close();
    data = JSON.parse(data);

    $$('.no_rkm_medis').text(data['no_rkm_medis']);
    $$('.nm_pasien').text(data['nm_pasien']);
    $$('.tgl_lahir').text(data['tgl_lahir']);
    $$('.alamat').text(data['alamat']);
    document.getElementById("fotoprofil").src = data['foto'];

  });

  //Getting Booking list
  app.request.post(apiUrl + 'apam/', {
    action: 'booking',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    //app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <a href="/booking/' + no_rkm_medis + '/' + data[i]['tanggal_periksa'] + '/' + data[i]['no_reg'] + '/" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tanggal_periksa'] + ' / ' + data[i]['status'] + '</div>';
      html += '     ' + data[i]['nm_poli'] + '';
      html += '     <div class="item">' + data[i]['nm_dokter'] + '</div>';
      html += '     <div class="">' + data[i]['png_jawab'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';
    }

    $$(".booking-list").html(html);

  });

  //Getting History list
  //app.dialog.preloader("Loading...");
  app.request.post(apiUrl + 'apam/', {
    action: 'riwayat',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <a href="/riwayat/' + no_rkm_medis + '/' + data[i]['tgl_registrasi'] + '/' + data[i]['no_reg'] + '/" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tgl_registrasi'] + '</div>';
      html += '     ' + data[i]['nm_poli'] + '';
      html += '     <div class="item">' + data[i]['nm_dokter'] + '</div>';
      html += '     <div class="">' + data[i]['png_jawab'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';
    }

    $$(".riwayat-list").html(html);

  });

  app.request.post(apiUrl + 'apam/', {
    action: 'riwayatranap',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      html += ' <a href="/riwayatranap/' + no_rkm_medis + '/' + data[i]['tgl_registrasi'] + '/' + data[i]['no_reg'] + '/" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tgl_registrasi'] + '</div>';
      html += '     ' + data[i]['nm_bangsal'] + '';
      html += '     <div class="item">' + data[i]['nm_dokter'] + '</div>';
      html += '     <div class="">' + data[i]['png_jawab'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';
    }

    $$(".riwayatranap-list").html(html);

  });

  //Getting History list
  //app.dialog.preloader("Loading...");
  app.request.post(apiUrl + 'apam/', {
    action: 'billing',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      html += '<li>';
      //html += ' <a href="/billing/' + no_rkm_medis + '/' + data[i]['tgl_registrasi'] + '/" class="item-link item-content">';
      html += ' <a href="#" class="item-link item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title-row">';
      html += '    <div class="item-title">';
      html += '     <div class="item-header">' + data[i]['tgl_registrasi'] + '</div>';
      html += '     <b>Klinik:</b> ' + data[i]['nm_poli'] + '';
      html += '     <div class=""><b>Kode:</b> ' + data[i]['kd_billing'] + '</div>';
      html += '     <div class=""><b>Total:</b> Rp. ' + data[i]['total_bayar'] + '</div>';
      html += '    </div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </a>';
      html += '</li>';
    }

    $$(".billing-list").html(html);

  });

});

//=================================================//
// Load data untuk halaman daftar.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="daftar"]', function(e) {

  var today = new Date();
  var startDay = new Date().setDate(today.getDate() + startDate);
  var endDay = new Date().setDate(today.getDate() + endDate);
  var yearBefore = new Date().setDate(today.getDate() - 365);
  var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus' , 'September' , 'Oktober', 'November', 'Desember'];
  var dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  var calendar = app.calendar.create({
    containerEl: '#calendar-container',
    inputEl: '.tanggal',
    dateFormat: 'yyyy-mm-dd',
    disabled: [
      {
        from: yearBefore,
        to: startDay
      },
      {
        from: endDay
      }
    ],
    //value: [new Date()],
    weekHeader: true,
    dayNamesShort: dayNamesShort,
    renderToolbar: function () {
      return '<div class="toolbar calendar-custom-toolbar no-shadow">' +
        '<div class="toolbar-inner">' +
          '<div class="left">' +
            '<a href="#" class="link icon-only"><i class="icon icon-back ' + (app.theme === 'md' ? 'color-black' : '') + '"></i></a>' +
          '</div>' +
          '<div class="center"></div>' +
          '<div class="right">' +
            '<a href="#" class="link icon-only"><i class="icon icon-forward ' + (app.theme === 'md' ? 'color-black' : '') + '"></i></a>' +
          '</div>' +
        '</div>' +
      '</div>';
    },
    on: {
      init: function (c) {
        $$('.calendar-custom-toolbar .center').text(monthNames[c.currentMonth] +' ' + c.currentYear);
        $$('.calendar-custom-toolbar .left .link').on('click', function () {
          calendar.prevMonth();
        });
        $$('.calendar-custom-toolbar .right .link').on('click', function () {
          calendar.nextMonth();
        });
      },
      monthYearChangeStart: function (c) {
        $$('.calendar-custom-toolbar .center').text(monthNames[c.currentMonth] +' ' + c.currentYear);
      }
    }
  });

  $$('.page[data-name="daftar"] .cekjadwal-btn').on('click', function () {

    var tanggal = $$('.tanggal').val();

    if(tanggal == "") {
      app.dialog.alert('Silahkan pilih tanggal berobat.');
    } else {

      app.dialog.preloader("Loading...");

      app.request.post(apiUrl + 'apam/', {
        action: 'jadwalklinik',
        tanggal: tanggal,
        token: token
      }, function (data) {
        app.dialog.close();
        data = JSON.parse(data);

        var html = '';
        html += '<option class="kd_poli" value="" selected>____Pilih Klinik____</option>';
        for(i=0; i<data.length; i++) {
          html += '<option class="kd_poli" value="' + data[i]['kd_poli'] + '">' + data[i]['nm_poli'] + ' [' + data[i]['jam_mulai'] + ' - ' + data[i]['jam_selesai'] + ']</option>';
        }

        $$(".klinik-list").html(html);
        $$(".klinik-list~.item-content .item-after").html('____Pilih Klinik____');
      });

      $$('body').on('change', '.klinik-list', function() {
        var kd_poli = $$(this).val();
        var tanggal = $$('.tanggal').val();

        app.request.post(apiUrl + 'apam/', {
          action: 'jadwaldokter',
          tanggal: tanggal,
          kd_poli: kd_poli,
          token: token
        }, function (data) {
          app.dialog.close();
          data = JSON.parse(data);

          var html = '';
          var attrStr = '';

          for(i=0; i<data.length; i++) {
            if(i == 0) attrStr = 'checked';
            else attrStr = "";

            html += '<li>';
            html += '  <label class="item-radio item-content">';
            html += '    <input type="radio" class="kd_dokter" name="kd_dokter" value="' + data[i]['kd_dokter'] + '" ' + attrStr + '>';
            html += '    <i class="icon icon-radio"></i>';
            html += '    <div class="item-inner">';
            html += '      <div class="item-title">' + data[i]['nm_dokter'] + '</div>';
            html += '    </div>';
            html += '  </label>';
            html += '</li>';

          }

          $$(".dokter-list").html(html);
          $$(".dokter-list~.item-content .item-after").html(data[0]['nm_dokter']);
          $$(".dokter-list").show();
        });

      });

    }

    $$(".klinik").show();
    $$(".dokter-list").hide();

  });

  app.request.post(apiUrl + 'apam/', {
    action: "carabayar",
    token: token
  }, function (data) {
    //app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    html += '<option class="kd_pj" value="" selected>____Pilih____</option>';

    for(i=0; i<data.length; i++) {
      html += '<option class="kd_pj" value="' + data[i]['kd_pj'] + '">' + data[i]['png_jawab'] + '</option>';
    }

    $$(".penjab-list").html(html);
    $$(".penjab-list~.item-content .item-after").html('____Pilih____');

  });

  $$('.page[data-name="daftar"] .daftar-btn').on('click', function () {

    var no_rkm_medis = localStorage.getItem("no_rkm_medis");
    var tanggal = $$('#daftar-form .tanggal').val();
    var kd_poli = $$('#daftar-form .kd_poli').val();
    var kd_dokter = $$("input[name='kd_dokter']:checked").val();
    var kd_pj = $$('#daftar-form .kd_pj').val();

    if(no_rkm_medis == "") {
      app.dialog.alert('Nomor rekam medis anda tidak sesuai dengan akun login.');
    }
    else if(tanggal == "") {
      app.dialog.alert('Silahkan masukkan tanggal berobat.');
    }
    else if(kd_poli == "") {
      app.dialog.alert('Pilih klinik tujuan anda.');
    }
    else if(kd_dokter == "") {
      app.dialog.alert('Silahkan pilih dokter.');
    }
    else if(kd_pj == "") {
      app.dialog.alert('Silahkan pilih cara bayar.');
    }
    else if(kd_pj == kd_pj_bpjs) {
      app.dialog.confirm('<center>Anda memilih cara bayar<br>BPJS Kesehatan.<br><img src="img/logo_mjkn.png" width="150px"><br>Apakah anda akan berpindah ke aplikasi<br>Mobile JKN BPJS?</center>',
      function () {
        window.open('https://play.google.com/store/apps/details?id=app.bpjs.mobile&hl=id&gl=US', '_system');
      },
      function () {
        app.dialog.preloader("Loading...");
        app.request.post(apiUrl + 'apam/', {
          action: "daftar",
          no_rkm_medis: no_rkm_medis,
          tanggal: tanggal,
          kd_poli: kd_poli,
          kd_dokter: kd_dokter,
          kd_pj: kd_pj,
          token: token
        }, function (data) {
          app.dialog.close();
          data = JSON.parse(data);

          if(data.state == "duplication") {
            app.dialog.alert('Anda sudah terdaftar ditanggal pilihan anda.');
          }
          else if(data.state == "limit") {
            app.dialog.alert('Kuota pendaftaran terpenuhi. Silahkan pilih hari/tanggal lain.');
          }
          else if(data.state == "success") {
            mainView.router.navigate('/sukses/', {
              clearPreviousHistory: true
            });
          }
          else {
            app.dialog.alert('Register error: ', data);
          }
        });
      });
    }
    else {
      // Show Preloader
      app.dialog.preloader("Loading...");

      app.request.post(apiUrl + 'apam/', {
        action: "daftar",
        no_rkm_medis: no_rkm_medis,
        tanggal: tanggal,
        kd_poli: kd_poli,
        kd_dokter: kd_dokter,
        kd_pj: kd_pj,
        token: token
      }, function (data) {
        //console.log(data);
        app.dialog.close();
        data = JSON.parse(data);

        if(data.state == "duplication") {
          app.dialog.alert('Anda sudah terdaftar ditanggal pilihan anda.');
        }
        else if(data.state == "limit") {
          app.dialog.alert('Kuota pendaftaran terpenuhi. Silahkan pilih hari/tanggal lain.');
        }
        else if(data.state == "success") {
          mainView.router.navigate('/sukses/', {
            clearPreviousHistory: true
          });
        }
        else {
          app.dialog.alert('Register error: ', data);
        }
      });
    }

  });

});


//=================================================//
// Load data untuk halaman sukses.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="sukses"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  //Getting Booking Result
  app.dialog.preloader("Loading...");
  app.request.post(apiUrl + 'apam/', {
    action: 'sukses',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {
      var typeNumber = 4;
      var errorCorrectionLevel = 'L';
      cellSize = 6,
    	margin = 10;
      var qr = qrcode(typeNumber, errorCorrectionLevel);
      qr.addData(data[i]['no_reg']);
      qr.make();
      document.getElementById('qrBookingSukses').innerHTML = qr.createImgTag(cellSize, margin);
      html += ' <div class="item-content">';
      html += '  <div class="item-inner">';
      html += '   <div class="item-title">';
      html += '    Nomor Kartu Berobat: ' + no_rkm_medis + '';
      html += '    <div class="item-header">Tanggal booking: ' + data[i]['tanggal_booking'] + '</div>';
      html += '    <div class="item-header">Tanggal periksa: ' + data[i]['tanggal_periksa'] + '</div>';
      html += '    <div class="item">Status booking: ' + data[i]['status'] + '</div>';
      html += '    Klinik: ' + data[i]['nm_poli'] + '';
      html += '    <div class="item">Dokter: ' + data[i]['nm_dokter'] + '</div>';
      html += '    <div class="item">Nomor antrian: ' + data[i]['no_reg'] + '</div>';
      html += '    <div class="item-footer">Cara bayar: ' + data[i]['png_jawab'] + '</div>';
      html += '   </div>';
      html += '  </div>';
      html += ' </div>';
    }

    $$(".sukses-detail").html(html);

  });

});

//=================================================//
// Load data untuk halaman pengaduan.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="pengaduan"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  //Getting Booking list
  app.dialog.preloader("Loading...");
  app.request.post(apiUrl + 'apam/', {
    action: 'pengaduan',
    no_rkm_medis: no_rkm_medis,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {

      /*html += '<li class="swipeout">';
      html += '    <a href="/pengaduan/' + no_rkm_medis + '/' + data[i]['id'] + '/" class="item-link item-content swipeout-content">';
      html += '        <div class="item-media"><img src="img/' + data[i]['jk'] + '.png" width="44" alt=""></div>';
      html += '        <div class="item-inner">';
      html += '            <div class="item-title-row">';
      html += '                <div class="item-title">' + data[i]['nm_pasien'] + '</div>';
      html += '                <div class="item-after">' + data[i]['tanggal'] + '</div>';
      html += '            </div>';
      html += '            <div class="item-text">' + data[i]['pesan'] + '</div>';
      html += '        </div>';
      html += '    </a>';
      html += '</li>';*/

      html += '<li>';
      html += '  <a href="/pengaduan/' + no_rkm_medis + '/' + data[i]['id'] + '/" class="item-link item-content">';
      html += '    <div class="item-media"><img src="img/' + data[i]['jk'] + '.png" width="50"></div>';
      html += '    <div class="item-inner">';
      html += '      <div class="item-title-row">';
      html += '        <div class="item-title">' + data[i]['nm_pasien'] + '</div>';
      html += '        <div class="item-after text-primary"><i class="fa fa-check ml-5"></i></div>';
      html += '      </div>';
      html += '      <div class="" style="font-size:13px;">' + data[i]['pesan'] + '</div>';
      html += '      <div class="item-subtitle">' + data[i]['tanggal'] + '</div>';
      html += '    </div>';
      html += '  </a>';
      html += '</li>';

    }

    $$(".pengaduan-list").html(html);

  });

  $$('.page[data-name="pengaduan"] .pengaduan-btn').on('click', function () {

    var no_rkm_medis = localStorage.getItem("no_rkm_medis");
    var message = $$('#pengaduan-form .message').val();

    if(message == "") {
      app.views.main.router.back('/pengaduan/', {
        ignoreCache: true,
        force: true,
        context: {}
      });
    } else {

      app.request.post(apiUrl + 'apam/', {
        action: "simpanpengaduan",
        no_rkm_medis: no_rkm_medis,
        message: message,
        token: token
      }, function (data) {
        app.dialog.close();
        data = JSON.parse(data);
        if(data.state == "success") {
          app.dialog.alert('Pengaduan anda telah disimpan!. Silahkan tekan tombol <b>Ya</b> untuk kembali ke halaman utama.', function () {
            app.views.main.router.back('/home/', {
              ignoreCache: true,
              force: true,
              context: {}
            });
          });
        }
      });

    }

    app.sheet.close('.pengaduan-sheet');

  });

});


//=================================================//
// Load data untuk halaman riwayat-detail.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="pengaduandetail"]', function(e) {

  var page = e.detail;
  var no_rkm_medis = page.route.params.no_rkm_medis;
  var pengaduan_id = page.route.params.id;

  //Getting History list
  app.dialog.preloader("Loading...");
  app.request.post(apiUrl + 'apam/', {
    action: 'pengaduandetail',
    no_rkm_medis: no_rkm_medis,
    pengaduan_id: pengaduan_id,
    token: token
  }, function (data) {
    //console.log(data);
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';

    if(data.state == "invalid") {

      html += '<div class="card facebook-card">';
      html += '  <div class="card-header">';
      html += '    <div class="facebook-avatar"><img src="img/L.png" width="34" height="34"/></div>';
      html += '    <div class="facebook-name">Bagian Pengaduan</div>';
      html += '    <div class="facebook-date">' + nama_instansi + '</div>';
      html += '  </div>';
      html += '  <div class="card-content card-content-padding">';
      html += '    <p>Pengaduan dengan nomor #<b>' + pengaduan_id + '</b> masih dalam proses verifikasi. Maaf atas ketidaknyamanan ini.</p>';
      html += '  </div>';
      html += '</div>';

    } else {

      for(i=0; i<data.length; i++) {

        html += '<div class="card facebook-card">';
        html += '  <div class="card-header">';
        html += '    <div class="facebook-avatar"><img src="img/L.png" width="34" height="34"/></div>';
        html += '    <div class="facebook-name">' + data[i]['nama'] + '</div>';
        html += '    <div class="facebook-date">' + data[i]['tanggal'] + '</div>';
        html += '  </div>';
        html += '  <div class="card-content card-content-padding">';
        html += '    <p>' + data[i]['pesan'] + '</p>';
        html += '  </div>';
        html += '</div>';

      }
    }

    $$(".pengaduan-detail").html(html);

  });

  $$('.page[data-name="pengaduandetail"] .pengaduandetail-btn').on('click', function () {

    var no_rkm_medis = localStorage.getItem("no_rkm_medis");
    //var pengaduan_id = $$('#pengaduandetail-form .message').val();
    var message = $$('#pengaduandetail-form .message').val();
    var pengaduan_id = page.route.params.id;

    if(message == "") {
      app.views.main.router.back('/pengaduan/', {
        ignoreCache: true,
        force: true,
        context: {}
      });
    } else {

      app.request.post(apiUrl + 'apam/', {
        action: "simpanpengaduandetail",
        no_rkm_medis: no_rkm_medis,
        message: message,
        pengaduan_id: pengaduan_id,
        token: token
      }, function (data) {
        //console.log(data);
        app.dialog.close();
        data = JSON.parse(data);
        if(data.state == "success") {
          app.dialog.alert('Balasan pengaduan anda telah disimpan!. Silahkan tekan tombol <b>Ya</b> untuk kembali ke halaman pengaduan.', function () {
            app.views.main.router.back('/pengaduan/', {
              ignoreCache: true,
              force: true,
              context: {}
            });
          });
        }
      });

    }

    app.sheet.close('.pengaduandetail-sheet');

  });

});


//=================================================//
  // Load data untuk halaman news.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="news"]', function(e) {

  //Getting Booking list
  app.request.post(apiUrl + 'apam/', {
    action: 'news',
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {

      html += '<li>';
      html += '  <div class="course-bx style-1">';
      html += '    <div class="dz-media"><a href="/news/' + data[i]['id'] + '/"><img src="' + website_upload + 'website/news/' + data[i]['cover_photo'] + '" width="55"/></a></div>';
      html += '    <div class="dz-info">';
      html += '      <div class="dz-head">';
      html += '        <a href="/course-detail/" class="categorie">Berita</a>';
      html += '        <h6 class="item-title title"><a href="/news/' + data[i]['id'] + '/">' + data[i]['title'] + '</a></h6>';
      html += '      </div>';
      html += '      <div class="dz-meta">';
      html += '        <ul>';
      html += '          <li>';
      html += '            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 32 32">';
      html += '              <path d="m28 3h-22a1 1 0 0 0 -1 1v5h-1a1 1 0 0 0 0 2h1v4h-1a1 1 0 0 0 0 2h1v4h-1a1 1 0 0 0 0 2h1v5a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1v-24a1 1 0 0 0 -1-1zm-1 24h-20v-4h1a1 1 0 0 0 0-2h-1v-4h1a1 1 0 0 0 0-2h-1v-4h1a1 1 0 0 0 0-2h-1v-4h20z"/>';
      html += '              <path d="m19 14h4a1 1 0 0 0 1-1v-4a1 1 0 0 0 -1-1h-4a1 1 0 0 0 -1 1v4a1 1 0 0 0 1 1zm1-4h2v2h-2z"/>';
      html += '            </svg>';
      html += '            ' + data[i]['tanggal'] + '';
      html += '          </li>';
      html += '        </ul>';
      html += '      </div>';
      html += '    </div>';
      html += '  </div>';
      html += '</li>';

    }

    $$(".news-list").html(html);

  });

});

//=================================================//
  // Load data untuk halaman news-detail.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="newsdetail"]', function(e) {

  var page = e.detail;
  var id = page.route.params.id;

  //Getting Booking list
  app.request.post(apiUrl + 'apam/', {
    action: 'newsdetail',
    id: id,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);
    var html = '';
    for(i=0; i<data.length; i++) {

      html += '<div class="card demo-facebook-card">';
      html += ' <div class="card-header">';
      html += '   <div class="demo-facebook-avatar"><img src="' + website_upload + 'website/news/' + data[i]['cover_photo'] + '" width="34" height="34"/></div>';
      html += '   <div class="demo-facebook-name">' + data[i]['title'] + '</div>';
      html += '   <div class="demo-facebook-date">' + data[i]['tanggal'] + '</div>';
      html += ' </div>';
      html += ' <div class="card-content card-content-padding">';
      html += '   <img src="' + website_upload + 'website/news/' + data[i]['cover_photo'] + '" width="100%"/><p>' + data[i]['content'] + '</p>';
      html += ' </div>';
      html += '</div>';

    }

    $$(".news-detail").html(html);

  });

});


//=================================================//
  // Load data untuk halaman pengaturan.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="pengaturan"]', function(e) {

  var no_rkm_medis = localStorage.getItem("no_rkm_medis");

  var getLayout = localStorage.getItem("layout");
  $$("input[value=" + getLayout + "]").prop('checked', true);

  var getColor = localStorage.getItem("color");
  $$("option[value=" + getColor + "]").prop('selected', true);

  $$('input[name="layout"]').on('change', function () {
    if (this.checked) {
      localStorage.setItem("layout", this.value);
      $$('.view').removeClass('theme-white');
      $$('.view').addClass(this.value);
    } else {
      localStorage.setItem("layout", "theme-white");
      $$('.view').removeClass('theme-dark');
      $$('.view').addClass("theme-white");
    }
  });

  $$('select[name="color"]').on('change', function () {
    localStorage.setItem("color", this.value);
    $$('.view').removeClass('color-theme-default color-theme-red color-theme-blue color-theme-lightblue color-theme-green color-theme-pink color-theme-orange color-theme-deeporange color-theme-yellow color-theme-lime color-theme-teal color-theme-purple color-theme-deeppurple color-theme-gray color-theme-black');
    $$('.view').addClass(this.value);
  });

});

$$(document).on('page:init', '.page[data-name="akun"]', function(e) {

  $$('.logout-btn').on('click', function () {
    app.dialog.confirm('Anda yakin ingin signout?', function () {
      app.dialog.alert('Anda telah keluar sepenuhnya dari sistem!');
      localStorage.removeItem("no_rkm_medis");
      //localStorage.removeItem("layout");
      //localStorage.removeItem("color");
      mainView.router.navigate('/', {
        clearPreviousHistory: true
      });
    });
  });

  $$('.hapus-akun-btn').on('click', function () {

    var no_rkm_medis = localStorage.getItem("no_rkm_medis");

    app.dialog.confirm('Anda yakin ingin menghapus akun Rekam Medik anda?', function () {
      app.request.post(apiUrl + 'apam/', {
        action: "simpanretensirekammedik",
        no_rkm_medis: no_rkm_medis,
        token: token
      }, function (data) {
        app.dialog.close();
        data = JSON.parse(data);
        if(data.state == "success") {
          app.dialog.alert('Anda telah menghapus akun Rekam Medik anda sepenuhnya dari sistem!. Silahkan tekan tombol <b>Ya</b> untuk kembali ke halaman utama.', function () {
            localStorage.removeItem("no_rkm_medis");
            mainView.router.navigate('/', {
              clearPreviousHistory: true
            });  
          });
        }
      });
    });

  });

});
