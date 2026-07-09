import '../core/api_client.dart';
import '../models/thon.dart';
import '../models/linh_vuc.dart';
import '../models/hanh_vi.dart';

/// Service lay danh muc dung chung: Thon, Linh vuc VPHC, Hanh vi vi pham.
/// Cac API nay chi doc (GET), co the cache trong bo nho neu can trong tuong lai.
class DanhMucService {
  DanhMucService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient.instance;

  final ApiClient _api;

  Future<List<Thon>> layDanhSachThon() async {
    try {
      final response = await _api.dio.get('/thon');
      final list = response.data as List;
      return list
          .map((e) => Thon.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }

  Future<List<LinhVuc>> layDanhSachLinhVuc() async {
    try {
      final response = await _api.dio.get('/linh-vuc');
      final list = response.data as List;
      final ketQua = list
          .map((e) => LinhVuc.fromJson(e as Map<String, dynamic>))
          .toList();
      ketQua.sort((a, b) =>
          (a.thuTuHienThi ?? 0).compareTo(b.thuTuHienThi ?? 0));
      return ketQua;
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }

  Future<List<HanhVi>> layDanhSachHanhVi({String? linhVucId}) async {
    try {
      final response = await _api.dio.get('/hanh-vi');
      final list = response.data as List;
      final ketQua = list
          .map((e) => HanhVi.fromJson(e as Map<String, dynamic>))
          .toList();
      if (linhVucId == null) return ketQua;
      return ketQua.where((h) => h.linhVucId == linhVucId).toList();
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }

  /// Sua ten Thon - CHI Admin duoc phep (backend chan bang require_admin,
  /// day chi la UX phu tro giong cac quyen khac trong app).
  Future<Thon> suaTenThon({required String id, required String tenThonMoi}) async {
    try {
      final response = await _api.dio.put('/thon/$id', data: {'ten_thon': tenThonMoi});
      return Thon.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }
}
