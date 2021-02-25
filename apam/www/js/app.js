//Main configuration. Silahkan sesuaikan settingan dibawah ini sesuai. Baca komentar dibelakangnya
const nama_instansi = 'RS Masa Kini'; // Hospital Name
const apiUrl = 'https://khanza.basoro.id/api/'; // API Server URL
const website_upload = 'https://khanza.basoro.id/uploads/'; // API Server URL
const token = 'qtbexUAxzqO3M8dCOo2vDMFvgYjdUEdMLVo341'; // Token code for security purpose
const startDate = 0; // Start date of day for registration
const endDate = 7; // End date of day for registration
const debug = 0; // Ganti menjadi 0 sebelum build di phonegap.com

// Dom7
var $$ = Dom7;

// Theme
var theme = 'auto';
if (document.location.search.indexOf('theme=') >= 0) {
  theme = document.location.search.split('theme=')[1].split('&')[0];
}

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'com.rshdbarabai.apam', // App bundle ID
  name: 'APAM Barabai', // App name
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
  routes: routes,
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
  vi: {
    placementId: 'pltd4o7ibb9rc653x14',
  },
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
    document.addEventListener('resume', function(){
      ga('send', 'pageview' , {'location' : 'http://api.rshdbarabai.com/pasien-rest/index.html' });
    }, false);
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

        if(data.state == "invalid") {
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
                  //app.dialog.alert('Notification closed');
                  //mainView.router.navigate('/notifikasi/');
                  app.request.post(apiUrl + 'apam/', {
                    action: 'tandaisudahdibacasemua',
                    no_rkm_medis: no_rkm_medis,
                    token: token
                  }, function (data) {
                    //app.dialog.alert('Notifikasi ' + judul + ' sudah dibaca..!');
                  });
                },
              },
            }).open();
          }
        }
      });
      //clearInterval(notifikasi);
    }, 3000);

    var notifikasi = setInterval(function () {
      app.request.post(apiUrl + 'apam/', {
        action: 'hitungralan',
        no_rkm_medis: no_rkm_medis,
        token: token
      }, function (data) {
        $$('.hitungralan').text(data);
      });
      //clearInterval(notifikasi);
    }, 3000);

    var notifikasi = setInterval(function () {
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

      $$('.services_11').text(data[i]['services_11']);
      $$('.services_12').text(data[i]['services_12']);
      document.getElementById("services_13").src = website_upload + '' + data[i]['services_13'];
      $$('.services_14').text(data[i]['services_14']);

      $$('.services_21').text(data[i]['services_21']);
      $$('.services_22').text(data[i]['services_22']);
      document.getElementById("services_23").src = website_upload + '' + data[i]['services_23'];
      $$('.services_24').text(data[i]['services_24']);

      $$('.services_31').text(data[i]['services_31']);
      $$('.services_32').text(data[i]['services_32']);
      document.getElementById("services_33").src = website_upload + '' + data[i]['services_33'];
      $$('.services_34').text(data[i]['services_34']);

      $$('.services_41').text(data[i]['services_41']);
      $$('.services_42').text(data[i]['services_42']);
      document.getElementById("services_43").src = website_upload + '' + data[i]['services_43'];
      $$('.services_44').text(data[i]['services_44']);

      $$('.services_51').text(data[i]['services_51']);
      $$('.services_52').text(data[i]['services_52']);
      document.getElementById("services_53").src = website_upload + '' + data[i]['services_53'];
      $$('.services_54').text(data[i]['services_54']);

      $$('.services_61').text(data[i]['services_61']);
      $$('.services_62').text(data[i]['services_62']);
      document.getElementById("services_63").src = website_upload + '' + data[i]['services_63'];
      $$('.services_64').text(data[i]['services_64']);

    }

  });

  //Getting Booking list
  app.request.post(apiUrl + 'apam/', {
    action: 'lastblog',
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
      html += '  <div class="item-content">';
      html += '    <div class="item-media"><img src="' + website_upload + '/blog/' + data[i]['cover_photo'] + '" width="55"/></div>';
      html += '    <div class="item-inner">';
      html += '      <div class="item-title-row">';
      html += '        <h6 class="item-title"><a href="/blog/' + data[i]['id'] + '/">' + data[i]['title'] + '</a></h6>';
      html += '        <a class="item-after bookmark-btn">';
      html += '          <i class="fa fa-bookmark-o"></i>';
      html += '          <i class="fa fa-bookmark"></i>';
      html += '        </a>';
      html += '      </div>';
      html += '      <div class="item-subtitle">' + data[i]['tanggal'] + '</div>';
      html += '      <div class="item-price">Pengumuman</div>';
      html += '    </div>';
      html += '  </div>';
      html += '  <div class="sortable-handler"></div>';
      html += '</li>';

    }

    $$(".lastblog-list").html(html);

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
      html += '<div class="row">';
      html += '  <div class="col">';
      html += '      <div class="text-align-center" style="font-size:18px;font-weight:bold;text-shadow: 2px 2px 4px #000000;color:#fff;padding-top:px;"><img src="' + apiUrl + 'barcode.php?text=' + data[i]['no_rawat'] + '&size=40&print=true"></div>';
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
      html += '<li><a href="/rawatinap/" class="item-link">';
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
      html += '    <div style="font-size:12px;">Tarif: ' + data[i]['registrasi'] + '</div>';
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
      html += '    <div style="font-size:12px;">Tarif: ' + data[i]['trf_kamar'] + '</div>';
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
    app.dialog.close();
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
      html += '      <div class="item-text">' + data[i]['pesan'] + '</div>';
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
  // Load data untuk halaman blog.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="blog"]', function(e) {

  //Getting Booking list
  app.request.post(apiUrl + 'apam/', {
    action: 'blog',
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);

    var html = '';
    for(i=0; i<data.length; i++) {

      html += '<li>';
      html += '  <div class="item-content">';
      html += '    <div class="item-media"><img src="' + website_upload + '/blog/' + data[i]['cover_photo'] + '" width="55"/></div>';
      html += '    <div class="item-inner">';
      html += '      <div class="item-title-row">';
      html += '        <h6 class="item-title"><a href="/blog/' + data[i]['id'] + '/">' + data[i]['title'] + '</a></h6>';
      html += '        <a class="item-after bookmark-btn">';
      html += '          <i class="fa fa-bookmark-o"></i>';
      html += '          <i class="fa fa-bookmark"></i>';
      html += '        </a>';
      html += '      </div>';
      html += '      <div class="item-subtitle">' + data[i]['tanggal'] + '</div>';
      html += '      <div class="item-price">Pengumuman</div>';
      html += '    </div>';
      html += '  </div>';
      html += '  <div class="sortable-handler"></div>';
      html += '</li>';

    }

    $$(".blog-list").html(html);

  });

});

//=================================================//
  // Load data untuk halaman blog-detail.html               //
//=================================================//

$$(document).on('page:init', '.page[data-name="blogdetail"]', function(e) {

  var page = e.detail;
  var id = page.route.params.id;

  //Getting Booking list
  app.request.post(apiUrl + 'apam/', {
    action: 'blogdetail',
    id: id,
    token: token
  }, function (data) {
    app.dialog.close();
    data = JSON.parse(data);
    var html = '';
    for(i=0; i<data.length; i++) {

      html += '<div class="card demo-facebook-card">';
      html += ' <div class="card-header">';
      html += '   <div class="demo-facebook-avatar"><img src="' + website_upload + '/blog/' + data[i]['cover_photo'] + '" width="34" height="34"/></div>';
      html += '   <div class="demo-facebook-name">' + data[i]['title'] + '</div>';
      html += '   <div class="demo-facebook-date">' + data[i]['tanggal'] + '</div>';
      html += ' </div>';
      html += ' <div class="card-content card-content-padding">';
      html += '   <img src="' + website_upload + '/blog/' + data[i]['cover_photo'] + '" width="100%"/><p>' + data[i]['content'] + '</p>';
      html += ' </div>';
      html += '</div>';

    }

    $$(".blog-detail").html(html);

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
