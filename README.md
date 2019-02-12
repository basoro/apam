# apam-barabai
Aplikasi Pasien dan Antrian Mandiri

Update Database
====================

ALTER TABLE `pengaduan`
CHANGE `date_time` `date_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP AFTER `id`;

CREATE TABLE `pengaduan_detail` (
  `id` int(11) NOT NULL,
  `pengaduan_id` int(11) NOT NULL,
  `date_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `message` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC;

ALTER TABLE `pengaduan_detail`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `pengaduan_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;
