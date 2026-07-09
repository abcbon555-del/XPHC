import '../core/api_client.dart';
import '../core/secure_storage.dart';
import '../models/nguoi_dung.dart';

/// Service xu ly dang nhap / dang xuat / lay thong tin nguoi dung hien tai.
class AuthService {
  AuthService({ApiClient? apiClient})
      : _api = apiClient ?? ApiClient.instance;

  final ApiClient _api;

  Future<NguoiDung> dangNhap({
    required String tenDangNhap,
    required String matKhau,
  }) async {
    try {
      final response = await _api.dio.post('/auth/login', data: {
        'ten_dang_nhap': tenDangNhap,
        'mat_khau': matKhau,
      });
      final data = response.data as Map<String, dynamic>;
      await SecureStorageService.instance.luuTokens(
        accessToken: data['access_token'].toString(),
        refreshToken: data['refresh_token'].toString(),
        tokenType: data['token_type']?.toString() ?? 'bearer',
      );
      return layThongTinNguoiDung();
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }

  Future<NguoiDung> layThongTinNguoiDung() async {
    try {
      final response = await _api.dio.get('/auth/me');
      return NguoiDung.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }

  Future<void> dangXuat() async {
    await SecureStorageService.instance.xoaTokens();
  }

  Future<bool> daDangNhap() => SecureStorageService.instance.daDangNhap();
}
