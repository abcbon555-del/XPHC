import 'package:flutter/foundation.dart';

import '../core/local_db.dart';
import '../core/sync_service.dart';
import '../models/ho_so_local.dart';

/// Provider bao boc SyncService, giu danh sach ho so local + so luong theo
/// trang thai de hien thi tren SyncStatusScreen va cac badge khac trong app.
class SyncProvider extends ChangeNotifier {
  SyncProvider({SyncService? syncService})
      : syncService = syncService ?? SyncService() {
    this.syncService.onSyncCompleted.listen((_) => taiDanhSach());
  }

  final SyncService syncService;

  List<HoSoLocal> danhSach = [];
  Map<String, int> soLuongTheoTrangThai = {
    SyncStatus.pending: 0,
    SyncStatus.synced: 0,
    SyncStatus.failed: 0,
  };
  bool dangTai = false;

  void khoiDongLangNgheMang() {
    syncService.batDauLangNghe();
  }

  Future<void> taiDanhSach() async {
    dangTai = true;
    notifyListeners();
    danhSach = await LocalDb.instance.layTatCa();
    soLuongTheoTrangThai = await LocalDb.instance.demTheoTrangThai();
    dangTai = false;
    notifyListeners();
  }

  Future<void> dongBoNgay() async {
    await syncService.dongBoNgay();
    await taiDanhSach();
  }

  @override
  void dispose() {
    syncService.dispose();
    super.dispose();
  }
}
