import 'package:flutter/foundation.dart';

import '../core/sync_service.dart';
import '../models/doi_tuong.dart';
import '../models/hanh_vi.dart';
import '../models/linh_vuc.dart';
import '../models/thon.dart';
import '../services/doi_tuong_service.dart';
import '../services/ho_so_service.dart';

/// Provider giu toan bo state cua man hinh "Lap bien ban moi":
/// - Doi tuong vi pham da chon / tao moi.
/// - Thon, linh vuc, hanh vi da chon.
/// - Toa do + dia chi map (tu MapPickerScreen).
/// - Danh sach duong dan file anh/video da chup (tu CaptureMediaScreen).
class NewBienBanProvider extends ChangeNotifier {
  NewBienBanProvider({
    DoiTuongService? doiTuongService,
    HoSoService? hoSoService,
    SyncService? syncService,
  })  : _doiTuongService = doiTuongService ?? DoiTuongService(),
        _hoSoService = hoSoService ?? HoSoService(),
        _syncService = syncService ?? SyncService();

  final DoiTuongService _doiTuongService;
  final HoSoService _hoSoService;
  final SyncService _syncService;

  // Buoc 1: Doi tuong
  DoiTuong? doiTuongDaChon;
  List<DoiTuong> ketQuaTimKiem = [];
  bool dangTimKiem = false;

  // Buoc 2: Thon / Linh vuc / Hanh vi
  Thon? thonDaChon;
  LinhVuc? linhVucDaChon;
  HanhVi? hanhViDaChon;
  String hanhViMoTaThem = '';

  // Buoc 3: Tien phat (so bien ban do server tu sinh sau khi dong bo)
  double? soTienPhat;

  // Buoc 4: Vi tri
  double? kinhDo;
  double? viDo;
  String? diaChiMap;

  // Buoc 5: File dinh kem (duong dan local)
  final List<String> duongDanFileLocal = [];

  bool dangLuu = false;
  String? loi;

  void chonDoiTuong(DoiTuong doiTuong) {
    doiTuongDaChon = doiTuong;
    ketQuaTimKiem = [];
    notifyListeners();
  }

  void boChonDoiTuong() {
    doiTuongDaChon = null;
    notifyListeners();
  }

  Future<void> timKiemDoiTuong(String tuKhoa) async {
    dangTimKiem = true;
    notifyListeners();
    try {
      ketQuaTimKiem = await _doiTuongService.timKiem(tuKhoa);
    } catch (e) {
      loi = e.toString();
    } finally {
      dangTimKiem = false;
      notifyListeners();
    }
  }

  Future<bool> taoDoiTuongMoi({
    required String hoTen,
    String? soCccd,
    String? soDt,
    String? diaChi,
  }) async {
    try {
      final doiTuong = await _doiTuongService.taoMoi(
        hoTen: hoTen,
        soCccd: soCccd,
        soDt: soDt,
        diaChi: diaChi,
      );
      chonDoiTuong(doiTuong);
      return true;
    } catch (e) {
      loi = e.toString();
      notifyListeners();
      return false;
    }
  }

  void chonThon(Thon thon) {
    thonDaChon = thon;
    notifyListeners();
  }

  void chonLinhVuc(LinhVuc linhVuc) {
    linhVucDaChon = linhVuc;
    hanhViDaChon = null; // reset hanh vi khi doi linh vuc
    notifyListeners();
  }

  void chonHanhVi(HanhVi? hanhVi) {
    hanhViDaChon = hanhVi;
    notifyListeners();
  }

  void capNhatMoTaThem(String moTa) {
    hanhViMoTaThem = moTa;
  }

  void capNhatSoTienPhat(double? soTien) {
    soTienPhat = soTien;
  }

  void capNhatViTri({
    required double lat,
    required double lng,
    String? diaChi,
  }) {
    viDo = lat;
    kinhDo = lng;
    diaChiMap = diaChi;
    notifyListeners();
  }

  void themFile(String duongDan) {
    duongDanFileLocal.add(duongDan);
    notifyListeners();
  }

  void xoaFile(String duongDan) {
    duongDanFileLocal.remove(duongDan);
    notifyListeners();
  }

  bool get hopLe {
    return doiTuongDaChon != null &&
        thonDaChon != null &&
        linhVucDaChon != null &&
        kinhDo != null &&
        viDo != null;
  }

  /// Luu bien ban: LUON ghi vao local DB truoc, sau do thu sync ngay neu co mang.
  /// Tra ve true neu ghi local thanh cong (khong phu thuoc viec sync ngay co
  /// thanh cong hay khong - du lieu da an toan trong local DB).
  Future<bool> luuBienBan() async {
    if (!hopLe) {
      loi = 'Vui lòng nhập đầy đủ thông tin bắt buộc (đối tượng, thôn, lĩnh vực, vị trí).';
      notifyListeners();
      return false;
    }
    dangLuu = true;
    loi = null;
    notifyListeners();
    try {
      await _hoSoService.taoBienBanMoi(
        doiTuongId: doiTuongDaChon!.id,
        doiTuongHoTen: doiTuongDaChon!.hoTen,
        thonId: thonDaChon!.id,
        thonTen: thonDaChon!.tenThon,
        linhVucId: linhVucDaChon!.id,
        linhVucTen: linhVucDaChon!.tenLinhVuc,
        hanhViId: hanhViDaChon?.id,
        hanhViMoTaThem: hanhViMoTaThem.trim().isEmpty ? null : hanhViMoTaThem.trim(),
        kinhDo: kinhDo!,
        viDo: viDo!,
        diaChiMap: diaChiMap,
        soTienPhat: soTienPhat,
        duongDanFileLocal: List.from(duongDanFileLocal),
      );

      // Thu sync ngay neu co mang - khong block UI qua lau, khong throw loi
      // len tren vi du lieu da an toan trong local DB roi.
      // ignore: unawaited_futures
      _syncService.dongBoNgay();

      return true;
    } catch (e) {
      loi = e.toString();
      return false;
    } finally {
      dangLuu = false;
      notifyListeners();
    }
  }

  void resetForm() {
    doiTuongDaChon = null;
    ketQuaTimKiem = [];
    thonDaChon = null;
    linhVucDaChon = null;
    hanhViDaChon = null;
    hanhViMoTaThem = '';
    soTienPhat = null;
    kinhDo = null;
    viDo = null;
    diaChiMap = null;
    duongDanFileLocal.clear();
    loi = null;
    notifyListeners();
  }
}
