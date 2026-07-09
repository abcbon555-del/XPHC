import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

import '../models/ho_so_local.dart';
import '../services/ho_so_service.dart';
import 'local_db.dart';

/// So lan thu sync toi da truoc khi danh dau 1 ban ghi la 'failed'.
/// Ban ghi 'failed' van co the duoc thu lai thu cong tu man hinh Trang thai dong bo.
const int soLanThuToiDa = 5;

/// Service dieu phoi dong bo du lieu offline -> online.
/// - Lang nghe connectivity_plus: khi co mang tro lai -> tu dong dong bo.
/// - Co the goi thu cong (vd nut "Dong bo ngay" tren man hinh Trang thai dong bo).
/// Luong xu ly cho moi ban ghi pending:
///   1) Goi POST /ho-so/sync (batch) -> lay server_id.
///   2) Voi cac ban ghi thanh cong, upload tung file dinh kem con lai
///      (bo qua file da upload roi, luu trong duong_dan_file_da_upload).
///   3) Danh dau 'synced' khi ca ho so + tat ca file da xong.
///   4) Neu loi buoc nao -> giu 'pending' (hoac 'failed' sau N lan) - KHONG xoa du lieu local.
class SyncService {
  SyncService({HoSoService? hoSoService})
      : _hoSoService = hoSoService ?? HoSoService();

  final HoSoService _hoSoService;
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  bool _dangSync = false;
  final StreamController<void> _syncCompletedController =
      StreamController<void>.broadcast();

  /// Phat su kien moi khi 1 vong dong bo hoan tat (thanh cong hay khong),
  /// de UI (vd SyncStatusScreen) co the refresh danh sach.
  Stream<void> get onSyncCompleted => _syncCompletedController.stream;

  void batDauLangNghe() {
    _subscription?.cancel();
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      final coMang = results.any((r) => r != ConnectivityResult.none);
      if (coMang) {
        dongBoNgay();
      }
    });
  }

  void dungLangNghe() {
    _subscription?.cancel();
    _subscription = null;
  }

  /// Kiem tra hien co mang khong (dung truoc khi luu 1 ho so moi de quyet
  /// dinh co thu sync ngay hay khong).
  Future<bool> coMangKhong() async {
    final results = await _connectivity.checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }

  /// Kich hoat 1 vong dong bo. An toan khi goi nhieu lan lien tiep (chi 1
  /// vong chay tai 1 thoi diem).
  Future<void> dongBoNgay() async {
    if (_dangSync) return;
    _dangSync = true;
    try {
      final coMang = await coMangKhong();
      if (!coMang) return;

      final choDongBo = await LocalDb.instance.layTheoTrangThai(SyncStatus.pending);
      // Cung thu lai cac ban ghi failed nhung chua vuot qua so lan toi da.
      final thatBaiCoTheThu = (await LocalDb.instance.layTheoTrangThai(SyncStatus.failed))
          .where((h) => h.soLanThuSync < soLanThuToiDa)
          .toList();
      final tatCa = [...choDongBo, ...thatBaiCoTheThu];

      if (tatCa.isEmpty) return;

      // Goi batch sync ho so truoc.
      List<Map<String, String>> ketQua;
      try {
        ketQua = await _hoSoService.syncBatch(tatCa);
      } catch (_) {
        // Loi toan bo batch (vd mat mang giua chung, server 500...) -> tang
        // so lan thu cho tung ban ghi, giu nguyen trang thai de thu lai sau.
        for (final hoSo in tatCa) {
          final lanMoi = hoSo.soLanThuSync + 1;
          await LocalDb.instance.capNhatTrangThaiSync(
            hoSo.clientUuid,
            syncStatus: lanMoi >= soLanThuToiDa ? SyncStatus.failed : SyncStatus.pending,
            soLanThuSync: lanMoi,
            ghiChuLoi: 'Loi dong bo ho so (se tu dong thu lai khi co mang).',
          );
        }
        return;
      }

      final mapKetQua = <String, Map<String, String>>{};
      for (final item in ketQua) {
        final clientUuid = item['client_uuid'] ?? '';
        if (clientUuid.isNotEmpty) {
          mapKetQua[clientUuid] = item;
        }
      }

      for (final hoSo in tatCa) {
        // Neu server tra ve id ro rang thi dung, khong thi coi nhu thanh cong
        // (idempotent) nhung chua co server_id -> van thu upload file bang
        // server_id da luu tu truoc (neu co) hoac bo qua upload neu chua co.
        final ketQuaItem = mapKetQua[hoSo.clientUuid];
        final serverId = ketQuaItem?['id'];
        final soBienBan = ketQuaItem?['so_bien_ban'];
        final hoSoSauKhiSyncHoSo = hoSo.copyWith(
          serverId: (serverId != null && serverId.isNotEmpty) ? serverId : hoSo.serverId,
          soBienBan: (soBienBan != null && soBienBan.isNotEmpty) ? soBienBan : hoSo.soBienBan,
        );
        // So bien ban tu server can duoc luu ngay (khong cho toi khi upload
        // file xong), de tranh mat du lieu neu upload file that bai giua chung.
        if (hoSoSauKhiSyncHoSo.soBienBan != hoSo.soBienBan) {
          await LocalDb.instance.upsertHoSo(hoSoSauKhiSyncHoSo);
        }

        await _dongBoFileChoHoSo(hoSoSauKhiSyncHoSo);
      }
    } finally {
      _dangSync = false;
      _syncCompletedController.add(null);
    }
  }

  Future<void> _dongBoFileChoHoSo(HoSoLocal hoSo) async {
    final serverId = hoSo.serverId;
    if (serverId == null || serverId.isEmpty) {
      // Chua co server id (vd backend khong tra ve id trong response sync) ->
      // khong the upload file, giu nguyen pending de thu lai vong sau.
      final lanMoi = hoSo.soLanThuSync + 1;
      await LocalDb.instance.capNhatTrangThaiSync(
        hoSo.clientUuid,
        syncStatus: lanMoi >= soLanThuToiDa ? SyncStatus.failed : SyncStatus.pending,
        soLanThuSync: lanMoi,
        ghiChuLoi: 'Da gui ho so nhung chua nhan duoc server_id de upload file.',
      );
      return;
    }

    final daUpload = List<String>.from(hoSo.duongDanFileDaUpload);
    bool coLoiUpload = false;

    for (final duongDan in hoSo.duongDanFileLocal) {
      if (daUpload.contains(duongDan)) continue; // da upload roi, bo qua
      try {
        await _hoSoService.uploadFile(
          hoSoServerId: serverId,
          duongDanFile: duongDan,
        );
        daUpload.add(duongDan);
      } catch (_) {
        coLoiUpload = true;
        // Van tiep tuc thu cac file khac, khong dung ca vong lap.
      }
    }

    // Luu tien do upload file (du thanh cong hay khong) de lan sau khong upload lai.
    await LocalDb.instance.capNhatTrangThaiSync(
      hoSo.clientUuid,
      syncStatus: coLoiUpload ? SyncStatus.pending : SyncStatus.synced,
      serverId: serverId,
      soLanThuSync: coLoiUpload ? hoSo.soLanThuSync + 1 : hoSo.soLanThuSync,
      duongDanFileDaUpload: daUpload,
      ghiChuLoi: coLoiUpload
          ? 'Ho so da luu tren server nhung mot so file chua upload duoc.'
          : null,
    );
  }

  void dispose() {
    dungLangNghe();
    _syncCompletedController.close();
  }
}
