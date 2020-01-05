<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header("Access-Control-Allow-Headers: X-Requested-With");

ini_set('display_errors', 0);
error_reporting(E_ERROR | E_WARNING | E_PARSE);

require_once('config.php');

$action = trim(isset($_REQUEST['action'])?$_REQUEST['action']:null);

if($action == "signin") {
  $data = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $no_ktp = trim($_REQUEST['no_ktp']);
  $sql = "SELECT no_rkm_medis, no_ktp FROM pasien WHERE no_rkm_medis = '$no_rkm_medis'";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }

  if(num_rows($result) == 0) {
    $data['state'] = 'invalid';
    echo json_encode($data);
  } else {
    if($results[0]["no_ktp"] == $no_ktp) {
      $data['state'] = 'valid';
      $data['no_rkm_medis'] = $results[0]["no_rkm_medis"];
      echo json_encode($data);
    } else {
      $data['state'] = 'invalid';
      echo json_encode($data);
    }
  }
}

if($action == "notifbooking") {
  $data = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $sql = "SELECT stts FROM reg_periksa WHERE tgl_registrasi = '$date' AND no_rkm_medis = '$no_rkm_medis' AND (stts = 'Belum' OR stts = 'Berkas Diterima')";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }

  if(num_rows($result) == 0) {
    $data['state'] = 'invalid';
    echo json_encode($data);
  } else {
    if($results[0]["stts"] == 'Belum') {
      $data['state'] = 'notifbooking';
      $data['stts'] = 'Terdaftar';
      echo json_encode($data);
    } else if($results[0]["stts"] == 'Berkas Diterima') {
        $data['state'] = 'notifberkas';
        $data['stts'] = 'Berkas Rekam Medik Di meja Dokter';
        echo json_encode($data);
    } else {
      $data['state'] = 'invalid';
      echo json_encode($data);
    }
  }

}

if($action == "antrian") {
  $results = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $sql = "SELECT a.tgl_registrasi, a.no_reg, a.stts, b.nm_poli, c.nm_dokter, d.png_jawab, a.no_rawat FROM reg_periksa a LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter LEFT JOIN penjab d ON a.kd_pj = d.kd_pj WHERE a.no_rkm_medis = '$no_rkm_medis' AND a.tgl_registrasi = '$date' ORDER BY a.tgl_registrasi ASC LIMIT 1";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "booking") {
  $results = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $sql = "SELECT a.tanggal_booking, a.tanggal_periksa, a.no_reg, a.status, b.nm_poli, c.nm_dokter, d.png_jawab FROM booking_registrasi a LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter LEFT JOIN penjab d ON a.kd_pj = d.kd_pj WHERE a.no_rkm_medis = '$no_rkm_medis' ORDER BY a.tanggal_periksa DESC";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "lastbooking") {
  $results = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $sql = "SELECT a.tanggal_booking, a.tanggal_periksa, a.no_reg, a.status, b.nm_poli, c.nm_dokter, d.png_jawab FROM booking_registrasi a LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter LEFT JOIN penjab d ON a.kd_pj = d.kd_pj WHERE a.no_rkm_medis = '$no_rkm_medis' ORDER BY a.tanggal_periksa DESC LIMIT 3";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "bookingdetail") {
  $results = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $tanggal_periksa = trim($_REQUEST['tanggal_periksa']);
  $no_reg = trim($_REQUEST['no_reg']);
  $sql = "SELECT a.tanggal_booking, a.tanggal_periksa, a.no_reg, a.status, b.nm_poli, c.nm_dokter, d.png_jawab FROM booking_registrasi a LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter LEFT JOIN penjab d ON a.kd_pj = d.kd_pj WHERE a.no_rkm_medis = '$no_rkm_medis' AND a.tanggal_periksa = '$tanggal_periksa' AND a.no_reg = '$no_reg'";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "kamar") {
  $results = array();
  $sql = "SELECT nama.kelas, (SELECT COUNT(*) FROM kamar WHERE kelas=nama.kelas AND statusdata='1') AS total, (SELECT COUNT(*) FROM kamar WHERE  kelas=nama.kelas AND statusdata='1' AND status='ISI') AS isi, (SELECT COUNT(*) FROM kamar WHERE  kelas=nama.kelas AND statusdata='1' AND status='KOSONG') AS kosong FROM (SELECT DISTINCT kelas FROM kamar WHERE statusdata='1') AS nama ORDER BY nama.kelas ASC";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "dokter") {

  $tanggal = @$_REQUEST['tanggal'];

  if($tanggal) {
    $getTanggal = $tanggal;
  } else {
    $getTanggal = $date;
  }
  $results = array();

  $hari = fetch_array(query("SELECT DAYNAME('$getTanggal')"));
  $namahari = "";
  if($hari[0] == "Sunday"){
      $namahari = "AKHAD";
  }else if($hari[0] == "Monday"){
      $namahari = "SENIN";
  }else if($hari[0] == "Tuesday"){
     	$namahari = "SELASA";
  }else if($hari[0] == "Wednesday"){
      $namahari = "RABU";
  }else if($hari[0] == "Thursday"){
      $namahari = "KAMIS";
  }else if($hari[0] == "Friday"){
      $namahari = "JUMAT";
  }else if($hari[0] == "Saturday"){
      $namahari = "SABTU";
  }

  $sql = "SELECT dokter.nm_dokter, dokter.jk, poliklinik.nm_poli, DATE_FORMAT(jadwal.jam_mulai, '%H:%i') AS jam_mulai, DATE_FORMAT(jadwal.jam_selesai, '%H:%i') AS jam_selesai, dokter.kd_dokter FROM jadwal INNER JOIN dokter INNER JOIN poliklinik on dokter.kd_dokter=jadwal.kd_dokter AND jadwal.kd_poli=poliklinik.kd_poli WHERE jadwal.hari_kerja='$namahari'";
  $result = query($sql);
  if(num_rows($result) == 0){
    $send_data['state'] = 'notfound';
    echo json_encode($send_data);
  } else {
    while ($row = fetch_assoc($result)) {
      $results[] = $row;
    }
    echo json_encode($results);
  }

}

if($action == "riwayat") {
  $results = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $sql = "SELECT a.tgl_registrasi, a.no_rawat, a.no_reg, b.nm_poli, c.nm_dokter, d.png_jawab FROM reg_periksa a LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter LEFT JOIN penjab d ON a.kd_pj = d.kd_pj WHERE a.no_rkm_medis = '$no_rkm_medis' AND a.stts = 'Sudah' ORDER BY a.tgl_registrasi DESC";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "riwayatdetail") {
  $results = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $tgl_registrasi = trim($_REQUEST['tgl_registrasi']);
  $no_reg = trim($_REQUEST['no_reg']);
  $sql = "SELECT a.tgl_registrasi, a.no_rawat, a.no_reg, b.nm_poli, c.nm_dokter, d.png_jawab, e.keluhan, e.pemeriksaan, GROUP_CONCAT(DISTINCT g.nm_penyakit SEPARATOR '<br>') AS nm_penyakit, GROUP_CONCAT(DISTINCT i.nama_brng SEPARATOR '<br>') AS nama_brng FROM reg_periksa a LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter LEFT JOIN penjab d ON a.kd_pj = d.kd_pj LEFT JOIN pemeriksaan_ralan e ON a.no_rawat = e.no_rawat LEFT JOIN diagnosa_pasien f ON a.no_rawat = f.no_rawat LEFT JOIN penyakit g ON f.kd_penyakit = g.kd_penyakit LEFT JOIN detail_pemberian_obat h ON a.no_rawat = h.no_rawat LEFT JOIN databarang i ON h.kode_brng = i.kode_brng WHERE a.no_rkm_medis = '$no_rkm_medis' AND a.tgl_registrasi = '$tgl_registrasi' AND a.no_reg = '$no_reg' GROUP BY a.no_rawat";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "profil") {
  $results = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $sql = "SELECT * FROM pasien WHERE no_rkm_medis = '$no_rkm_medis'";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results[0]);
}

if($action == "jadwalklinik") {
  $results = array();
  $tanggal = trim($_REQUEST['tanggal']);

  $tentukan_hari=date('D',strtotime($tanggal));
  $day = array(
    'Sun' => 'AKHAD',
    'Mon' => 'SENIN',
    'Tue' => 'SELASA',
    'Wed' => 'RABU',
    'Thu' => 'KAMIS',
    'Fri' => 'JUMAT',
    'Sat' => 'SABTU'
  );
  $hari=$day[$tentukan_hari];

  $sql = "SELECT a.kd_poli, b.nm_poli, DATE_FORMAT(a.jam_mulai, '%H:%i') AS jam_mulai, DATE_FORMAT(a.jam_selesai, '%H:%i') AS jam_selesai FROM jadwal a, poliklinik b, dokter c WHERE a.kd_poli = b.kd_poli AND a.kd_dokter = c.kd_dokter AND a.hari_kerja LIKE '%$hari%' GROUP BY b.kd_poli";

  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "jadwaldokter") {
  $results = array();
  $tanggal = trim($_REQUEST['tanggal']);
  $kd_poli = trim($_REQUEST['kd_poli']);

  $tentukan_hari=date('D',strtotime($tanggal));
  $day = array(
    'Sun' => 'AKHAD',
    'Mon' => 'SENIN',
    'Tue' => 'SELASA',
    'Wed' => 'RABU',
    'Thu' => 'KAMIS',
    'Fri' => 'JUMAT',
    'Sat' => 'SABTU'
  );
  $hari=$day[$tentukan_hari];

  $sql = "SELECT a.kd_dokter, c.nm_dokter FROM jadwal a, poliklinik b, dokter c WHERE a.kd_poli = b.kd_poli AND a.kd_dokter = c.kd_dokter AND a.kd_poli = '$kd_poli' AND a.hari_kerja LIKE '%$hari%'";

  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "carabayar") {
  $results = array();
  $sql = "SELECT * FROM penjab";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}

if($action == "daftar") {
  $send_data = array();

  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $tanggal = trim($_REQUEST['tanggal']);
  $kd_poli = trim($_REQUEST['kd_poli']);
  $kd_dokter = trim($_REQUEST['kd_dokter']);
  $kd_pj = trim($_REQUEST['kd_pj']);

  $tentukan_hari=date('D',strtotime($tanggal));
  $day = array(
    'Sun' => 'AKHAD',
    'Mon' => 'SENIN',
    'Tue' => 'SELASA',
    'Wed' => 'RABU',
    'Thu' => 'KAMIS',
    'Fri' => 'JUMAT',
    'Sat' => 'SABTU'
  );
  $hari=$day[$tentukan_hari];

  $sql = "SELECT a.kd_dokter, c.nm_dokter, a.kuota FROM jadwal a, poliklinik b, dokter c WHERE a.kd_poli = b.kd_poli AND a.kd_dokter = c.kd_dokter AND a.kd_poli = '$kd_poli' AND a.hari_kerja LIKE '%$hari%'";

  $result = fetch_assoc(query($sql));

  $check_kuota = fetch_assoc(query("SELECT COUNT(*) AS count FROM booking_registrasi WHERE kd_poli = '$kd_poli' AND tanggal_periksa = '$tanggal'"));
  $curr_count = $check_kuota['count'];
  $curr_kuota = $result['kuota'];
  $online = $curr_kuota / LIMIT;

  $check = fetch_assoc(query("SELECT * FROM booking_registrasi WHERE no_rkm_medis = '$no_rkm_medis' AND tanggal_periksa = '$tanggal'"));

  if($curr_count > $online) {
    $send_data['state'] = 'limit';
    echo json_encode($send_data);
  }
  else if(count($check) == 0) {
      $mysql_date = date( 'Y-m-d' );
      $mysql_time = date( 'H:m:s' );
      $waktu_kunjungan = $tanggal . ' ' . $mysql_time;

      $no_reg_akhir = fetch_array(query("SELECT max(no_reg) FROM booking_registrasi WHERE kd_dokter='$kd_dokter' and tanggal_periksa='$tanggal'"));
      $no_urut_reg = substr($no_reg_akhir[0], 0, 3);
      $no_reg = sprintf('%03s', ($no_urut_reg + 1));

      $list['no_rkm_medis'] = escape($no_rkm_medis);
      $list['tanggal_periksa'] = escape($tanggal);
      $list['kd_poli'] = escape($kd_poli);
      $list['kd_dokter'] = escape($kd_dokter);
      $list['kd_pj'] = escape($kd_pj);
      $list['no_reg'] = escape($no_reg);
      $list['tanggal_booking'] = escape($mysql_date);
      $list['jam_booking'] = escape($mysql_time);
      $list['waktu_kunjungan'] = escape($waktu_kunjungan);
      $list['limit_reg'] = '1';
      $list['status'] = 'Belum';
      insertTable('booking_registrasi', $list);

      $send_data['state'] = 'success';
      $send_data['userid'] = mysqli_insert_id($connection);
      echo json_encode($send_data);
  }
  else{
      $send_data['state'] = 'duplication';
      echo json_encode($send_data);
  }
}

if($action == "sukses") {
  $results = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $sql = "SELECT a.tanggal_booking, a.tanggal_periksa, a.no_reg, a.status, b.nm_poli, c.nm_dokter, d.png_jawab FROM booking_registrasi a LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter LEFT JOIN penjab d ON a.kd_pj = d.kd_pj WHERE a.no_rkm_medis = '$no_rkm_medis' AND a.tanggal_booking = '$date' AND a.jam_booking = (SELECT MAX(ax.jam_booking) FROM booking_registrasi ax WHERE ax.tanggal_booking = a.tanggal_booking) ORDER BY a.tanggal_booking ASC LIMIT 1";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results, JSON_PRETTY_PRINT);
}

if($action == "pengaduan") {
  $results = array();
  $petugas = unserialize(NORMPETUGAS);
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $sql = "SELECT a.*, b.nm_pasien, b.jk FROM pengaduan a, pasien b WHERE a.username = b.no_rkm_medis";
  if(in_array($no_rkm_medis, $petugas)) {
    $sql .= "";
  } else {
   $sql .= " AND a.username = '$no_rkm_medis'";
  }
  $sql .= " ORDER BY a.date_time";
  $result = query($sql);
  while ($row = fetch_array($result)) {
    $results[] = $row;
  }
  echo json_encode($results);
}


if($action == "pengaduandetail") {
  $results = array();
  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $pengaduan_id = trim($_REQUEST['pengaduan_id']);
  $sql = "(SELECT a.*, b.nm_pasien as nama, b.jk FROM pengaduan_detail a, pasien b WHERE a.pengaduan_id = '$pengaduan_id' AND a.username = b.no_rkm_medis) UNION (SELECT a.*, b.nama as nama, b.jk FROM pengaduan_detail a, petugas b WHERE a.pengaduan_id = '$pengaduan_id' AND a.username = b.nip) ORDER BY date_time ASC";
  $result = query($sql);
  if(num_rows($result) == 0) {
    $data['state'] = 'invalid';
    echo json_encode($data);
  } else {
    while ($row = fetch_assoc($result)) {
      $results[] = $row;
    }
    echo json_encode($results);
  }
}

if($action == "simpanpengaduan") {
  $send_data = array();

  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $message = trim($_REQUEST['message']);

  $list['username'] = escape($no_rkm_medis);
  $list['message'] = escape($message);
  insertTable('pengaduan', $list);

  $send_data['state'] = 'success';
  $send_data['userid'] = mysqli_insert_id($connection);
  echo json_encode($send_data);

}

if($action == "simpanpengaduandetail") {
  $send_data = array();

  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  $message = trim($_REQUEST['message']);
  $pengaduan_id = trim($_REQUEST['pengaduan_id']);

  $list['pengaduan_id'] = escape($pengaduan_id);
  $list['username'] = escape($no_rkm_medis);
  $list['message'] = escape($message);
  insertTable('pengaduan_detail', $list);

  $send_data['state'] = 'success';
  $send_data['userid'] = mysqli_insert_id($connection);
  echo json_encode($send_data);

}

if($action == "cekrujukan") {

  ini_set("default_socket_timeout","05");
  set_time_limit(5);
  $f=fopen(BpjsApiUrl,"r");
  $r=fread($f,1000);
  fclose($f);

  $no_rkm_medis = trim($_REQUEST['no_rkm_medis']);
  //$no_rkm_medis = "049970";
  $check = fetch_assoc(query("SELECT no_peserta FROM pasien WHERE no_rkm_medis = '$no_rkm_medis'"));
  $no_peserta = $check['no_peserta'];

  $noRujukan = array();

  if(strlen($r)>1) {
    if($check['no_peserta'] !== "") {
      date_default_timezone_set('UTC');
      $tStamp = strval(time()-strtotime('1970-01-01 00:00:00'));
      $signature = hash_hmac('sha256', ConsID."&".$tStamp, SecretKey, true);
      $encodedSignature = base64_encode($signature);
      $ch = curl_init();
      $headers = array(
       'X-cons-id: '.ConsID.'',
       'X-timestamp: '.$tStamp.'' ,
       'X-signature: '.$encodedSignature.'',
       'Content-Type:application/json',
      );
      curl_setopt($ch, CURLOPT_URL, BpjsApiUrl."Rujukan/List/Peserta/".$no_peserta);
      curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
      curl_setopt($ch, CURLOPT_TIMEOUT, 3);
      curl_setopt($ch, CURLOPT_HTTPGET, 1);
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
      $content = curl_exec($ch);
      $err = curl_error($ch);

      curl_close($ch);
      //print_r($content);
      $result = json_decode($content, true);
      $i = 1;
      $noRujukan = array();
      foreach ($result['response']['rujukan'] as $key => $value) {
        $noRujukan[] = array(
          'noKartu' => $value['peserta']['noKartu'],
          'noRujukan' => $value['noKunjungan'],
          'tglKunjungan' => $value['tglKunjungan'],
          'provPerujuk' => $value['provPerujuk']['nama'],
          'status' => $value['peserta']['statusPeserta']['keterangan'],
          'diagnosa' => $value['diagnosa']['kode']
        );
        if ($i++ == 3) break;
      }
      echo json_encode($noRujukan, JSON_PRETTY_PRINT);
    } else {
      $noRujukan['state'] = 'error';
      echo json_encode($noRujukan, JSON_PRETTY_PRINT);
    }
  } else {
    $noRujukan['state'] = 'offline';
    echo json_encode($noRujukan, JSON_PRETTY_PRINT);
  }
}

?>
