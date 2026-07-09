import 'package:flutter/foundation.dart';

import '../models/thon.dart';
import '../models/linh_vuc.dart';
import '../models/hanh_vi.dart';
import '../services/danh_muc_service.dart';

/// Provider cache danh muc dung chung (Thon, Linh vuc, Hanh vi) trong phien
/// lam viec, tranh goi lai API nhieu lan khi mo lai form Lap bien ban.
class DanhMucProvider extends ChangeNotifier {
  DanhMucProvider({DanhMucService? danhMucService})
      : _service = danhMucService ?? DanhMucService();

  final DanhMucService _service;

  List<Thon> danhSachThon = [];
  List<LinhVuc> danhSachLinhVuc = [];
  List<HanhVi> danhSachHanhVi = [];

  bool dangTai = false;
  String? loi;

  Future<void> taiDanhMuc({bool lamMoi = false}) async {
    if (!lamMoi && danhSachThon.isNotEmpty && danhSachLinhVuc.isNotEmpty) {
      return; // da co cache
    }
    dangTai = true;
    loi = null;
    notifyListeners();
    try {
      final ketQua = await Future.wait([
        _service.layDanhSachThon(),
        _service.layDanhSachLinhVuc(),
        _service.layDanhSachHanhVi(),
      ]);
      danhSachThon = ketQua[0] as List<Thon>;
      danhSachLinhVuc = ketQua[1] as List<LinhVuc>;
      danhSachHanhVi = ketQua[2] as List<HanhVi>;
    } catch (e) {
      loi = e.toString();
    } finally {
      dangTai = false;
      notifyListeners();
    }
  }

  List<HanhVi> hanhViTheoLinhVuc(String linhVucId) {
    return danhSachHanhVi.where((h) => h.linhVucId == linhVucId).toList();
  }
}
