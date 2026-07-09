import '../core/api_client.dart';
import '../models/doi_tuong.dart';

/// Service tim kiem / tao moi doi tuong vi pham.
class DoiTuongService {
  DoiTuongService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient.instance;

  final ApiClient _api;

  /// Tim doi tuong theo tu khoa (ho_ten / so_cccd / so_dt).
  Future<List<DoiTuong>> timKiem(String tuKhoa) async {
    if (tuKhoa.trim().isEmpty) return [];
    try {
      final response = await _api.dio.get('/doi-tuong', queryParameters: {
        'q': tuKhoa.trim(),
      });
      final list = response.data as List;
      return list
          .map((e) => DoiTuong.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }

  /// Tao moi doi tuong. Neu CCCD da ton tai, backend tra ve doi tuong cu
  /// (khong tao trung) - client khong can tu kiem tra trung lap.
  Future<DoiTuong> taoMoi({
    required String hoTen,
    String? soCccd,
    String? soDt,
    String? diaChi,
  }) async {
    try {
      final response = await _api.dio.post('/doi-tuong', data: {
        'ho_ten': hoTen,
        'so_cccd': soCccd,
        'so_dt': soDt,
        'dia_chi': diaChi,
      });
      return DoiTuong.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }
}
