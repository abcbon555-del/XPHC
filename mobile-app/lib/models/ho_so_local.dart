import 'dart:convert';

/// Trang thai dong bo cua 1 ban ghi ho so luu local.
class SyncStatus {
  static const String pending = 'pending';
  static const String synced = 'synced';
  static const String failed = 'failed';
}

/// Model phan anh bang `ho_so_local` trong sqflite.
/// Day la ban ghi "nhap lieu tai hien truong" truoc khi duoc dong bo len
/// server qua POST /ho-so/sync.
class HoSoLocal {
  final String clientUuid; // khoa chinh local, dung lam khoa idempotent khi sync
  final String? serverId; // id tra ve tu server sau khi sync thanh cong
  final String? soBienBan; // do server tu sinh (BB-KTHT...), chi co sau khi sync thanh cong
  final String doiTuongId;
  final String? doiTuongHoTen; // luu them de hien thi khi offline, khong gui len server
  final String thonId;
  final String? thonTen;
  final String linhVucId;
  final String? linhVucTen;
  final String? hanhViId;
  final String? hanhViMoTaThem;
  final double kinhDo;
  final double viDo;
  final String? diaChiMap;
  final double? soTienPhat;
  final DateTime ngayLap;
  final String syncStatus;
  final int soLanThuSync;
  final List<String> duongDanFileLocal; // duong dan file anh/video da luu trong app
  final List<String> duongDanFileDaUpload; // file da upload thanh cong (tranh upload lai)
  final String? ghiChuLoi;

  HoSoLocal({
    required this.clientUuid,
    this.serverId,
    this.soBienBan,
    required this.doiTuongId,
    this.doiTuongHoTen,
    required this.thonId,
    this.thonTen,
    required this.linhVucId,
    this.linhVucTen,
    this.hanhViId,
    this.hanhViMoTaThem,
    required this.kinhDo,
    required this.viDo,
    this.diaChiMap,
    this.soTienPhat,
    required this.ngayLap,
    this.syncStatus = SyncStatus.pending,
    this.soLanThuSync = 0,
    List<String>? duongDanFileLocal,
    List<String>? duongDanFileDaUpload,
    this.ghiChuLoi,
  })  : duongDanFileLocal = duongDanFileLocal ?? [],
        duongDanFileDaUpload = duongDanFileDaUpload ?? [];

  HoSoLocal copyWith({
    String? serverId,
    String? soBienBan,
    String? syncStatus,
    int? soLanThuSync,
    List<String>? duongDanFileLocal,
    List<String>? duongDanFileDaUpload,
    String? ghiChuLoi,
  }) {
    return HoSoLocal(
      clientUuid: clientUuid,
      serverId: serverId ?? this.serverId,
      soBienBan: soBienBan ?? this.soBienBan,
      doiTuongId: doiTuongId,
      doiTuongHoTen: doiTuongHoTen,
      thonId: thonId,
      thonTen: thonTen,
      linhVucId: linhVucId,
      linhVucTen: linhVucTen,
      hanhViId: hanhViId,
      hanhViMoTaThem: hanhViMoTaThem,
      kinhDo: kinhDo,
      viDo: viDo,
      diaChiMap: diaChiMap,
      soTienPhat: soTienPhat,
      ngayLap: ngayLap,
      syncStatus: syncStatus ?? this.syncStatus,
      soLanThuSync: soLanThuSync ?? this.soLanThuSync,
      duongDanFileLocal: duongDanFileLocal ?? this.duongDanFileLocal,
      duongDanFileDaUpload: duongDanFileDaUpload ?? this.duongDanFileDaUpload,
      ghiChuLoi: ghiChuLoi ?? this.ghiChuLoi,
    );
  }

  /// Chuyen thanh Map de luu vao sqflite (cot dang JSON string cho list).
  Map<String, dynamic> toDbMap() {
    return {
      'client_uuid': clientUuid,
      'server_id': serverId,
      'so_bien_ban': soBienBan,
      'doi_tuong_id': doiTuongId,
      'doi_tuong_ho_ten': doiTuongHoTen,
      'thon_id': thonId,
      'thon_ten': thonTen,
      'linh_vuc_id': linhVucId,
      'linh_vuc_ten': linhVucTen,
      'hanh_vi_id': hanhViId,
      'hanh_vi_mo_ta_them': hanhViMoTaThem,
      'kinh_do': kinhDo,
      'vi_do': viDo,
      'dia_chi_map': diaChiMap,
      'so_tien_phat': soTienPhat,
      'ngay_lap': ngayLap.toIso8601String(),
      'sync_status': syncStatus,
      'so_lan_thu_sync': soLanThuSync,
      'duong_dan_file_local': jsonEncode(duongDanFileLocal),
      'duong_dan_file_da_upload': jsonEncode(duongDanFileDaUpload),
      'ghi_chu_loi': ghiChuLoi,
    };
  }

  factory HoSoLocal.fromDbMap(Map<String, dynamic> map) {
    List<String> parseList(dynamic raw) {
      if (raw == null) return [];
      try {
        final decoded = jsonDecode(raw.toString());
        if (decoded is List) {
          return decoded.map((e) => e.toString()).toList();
        }
      } catch (_) {}
      return [];
    }

    return HoSoLocal(
      clientUuid: map['client_uuid'].toString(),
      serverId: map['server_id']?.toString(),
      soBienBan: map['so_bien_ban']?.toString(),
      doiTuongId: map['doi_tuong_id']?.toString() ?? '',
      doiTuongHoTen: map['doi_tuong_ho_ten']?.toString(),
      thonId: map['thon_id']?.toString() ?? '',
      thonTen: map['thon_ten']?.toString(),
      linhVucId: map['linh_vuc_id']?.toString() ?? '',
      linhVucTen: map['linh_vuc_ten']?.toString(),
      hanhViId: map['hanh_vi_id']?.toString(),
      hanhViMoTaThem: map['hanh_vi_mo_ta_them']?.toString(),
      kinhDo: (map['kinh_do'] as num?)?.toDouble() ?? 0.0,
      viDo: (map['vi_do'] as num?)?.toDouble() ?? 0.0,
      diaChiMap: map['dia_chi_map']?.toString(),
      soTienPhat: (map['so_tien_phat'] as num?)?.toDouble(),
      ngayLap: DateTime.tryParse(map['ngay_lap']?.toString() ?? '') ??
          DateTime.now(),
      syncStatus: map['sync_status']?.toString() ?? SyncStatus.pending,
      soLanThuSync: map['so_lan_thu_sync'] is int
          ? map['so_lan_thu_sync'] as int
          : int.tryParse(map['so_lan_thu_sync']?.toString() ?? '0') ?? 0,
      duongDanFileLocal: parseList(map['duong_dan_file_local']),
      duongDanFileDaUpload: parseList(map['duong_dan_file_da_upload']),
      ghiChuLoi: map['ghi_chu_loi']?.toString(),
    );
  }

  /// Payload dung cho POST /ho-so/sync (list). Bat buoc co ngay_lap + client_uuid.
  Map<String, dynamic> toSyncPayload() {
    return {
      'client_uuid': clientUuid,
      'doi_tuong_id': doiTuongId,
      'thon_id': thonId,
      'linh_vuc_id': linhVucId,
      'hanh_vi_id': hanhViId,
      'hanh_vi_mo_ta_them': hanhViMoTaThem,
      'kinh_do': kinhDo,
      'vi_do': viDo,
      'dia_chi_map': diaChiMap,
      'so_tien_phat': soTienPhat,
      'ngay_lap': ngayLap.toIso8601String(),
    };
  }

  /// Payload dung cho POST /ho-so (tao truc tiep, khong qua batch sync).
  Map<String, dynamic> toCreatePayload() {
    return {
      'client_uuid': clientUuid,
      'doi_tuong_id': doiTuongId,
      'thon_id': thonId,
      'linh_vuc_id': linhVucId,
      'hanh_vi_id': hanhViId,
      'hanh_vi_mo_ta_them': hanhViMoTaThem,
      'kinh_do': kinhDo,
      'vi_do': viDo,
      'dia_chi_map': diaChiMap,
      'so_tien_phat': soTienPhat,
    };
  }
}
