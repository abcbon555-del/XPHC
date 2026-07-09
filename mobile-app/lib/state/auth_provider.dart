import 'package:flutter/foundation.dart';

import '../core/api_client.dart';
import '../models/nguoi_dung.dart';
import '../services/auth_service.dart';

enum TrangThaiAuth { dangKiemTra, chuaDangNhap, daDangNhap }

/// Provider quan ly trang thai dang nhap + thong tin nguoi dung + quyen han.
/// UI (vd nut "Lap bien ban moi") doc quyen tu day de an/hien - nhung viec
/// chan that su van do backend dam nhiem (tra ve 403).
class AuthProvider extends ChangeNotifier {
  AuthProvider({AuthService? authService}) : _authService = authService ?? AuthService();

  final AuthService _authService;

  TrangThaiAuth trangThai = TrangThaiAuth.dangKiemTra;
  NguoiDung? nguoiDung;
  String? loiDangNhap;
  bool dangXuLy = false;

  bool get quyenNhapLieu => nguoiDung?.quyenNhapLieu ?? false;
  bool get quyenUploadTaiLieu => nguoiDung?.quyenUploadTaiLieu ?? false;
  bool get quyenXuatBaoCao => nguoiDung?.quyenXuatBaoCao ?? false;
  bool get isAdmin => nguoiDung?.isAdmin ?? false;

  Future<void> khoiTao() async {
    final daDangNhap = await _authService.daDangNhap();
    if (!daDangNhap) {
      trangThai = TrangThaiAuth.chuaDangNhap;
      notifyListeners();
      return;
    }
    try {
      nguoiDung = await _authService.layThongTinNguoiDung();
      trangThai = TrangThaiAuth.daDangNhap;
    } catch (_) {
      trangThai = TrangThaiAuth.chuaDangNhap;
    }
    notifyListeners();
  }

  Future<bool> dangNhap(String tenDangNhap, String matKhau) async {
    dangXuLy = true;
    loiDangNhap = null;
    notifyListeners();
    try {
      nguoiDung = await _authService.dangNhap(
        tenDangNhap: tenDangNhap,
        matKhau: matKhau,
      );
      trangThai = TrangThaiAuth.daDangNhap;
      dangXuLy = false;
      notifyListeners();
      return true;
    } catch (e) {
      loiDangNhap = e is ApiException ? e.message : e.toString();
      dangXuLy = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> dangXuat() async {
    await _authService.dangXuat();
    nguoiDung = null;
    trangThai = TrangThaiAuth.chuaDangNhap;
    notifyListeners();
  }
}
