import 'dart:async';

import 'package:dio/dio.dart';
import 'secure_storage.dart';

/// Base URL cua backend FastAPI.
/// Truyen qua --dart-define=API_BASE_URL=http://<host>:8000/api/v1 khi build/run.
/// Neu khong truyen, mac dinh tro toi localhost (dung cho emulator Android
/// thi doi thanh 10.0.2.2 thay vi localhost - xem README).
const String _defaultBaseUrl = 'http://10.0.2.2:8000/api/v1';

const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: _defaultBaseUrl,
);

/// Exception dung chung cho loi goi API, giu nguyen message tu backend
/// (thuong la {"detail": "..."}).
class ApiException implements Exception {
  final int? statusCode;
  final String message;
  ApiException(this.message, {this.statusCode});

  bool get isForbidden => statusCode == 403;
  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}

/// Wrapper Dio dung chung cho toan bo app.
/// - Tu dong gan Authorization header tu SecureStorage.
/// - Tu dong refresh token khi gap 401, retry lai request 1 lan.
/// - Khi refresh that bai -> nem AuthExpiredException de UI dieu huong ve Login.
class AuthExpiredException implements Exception {}

class ApiClient {
  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: apiBaseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 60),
      ),
    );
    _dio.interceptors.add(_authInterceptor());
  }

  static final ApiClient instance = ApiClient._internal();
  late final Dio _dio;
  Dio get dio => _dio;

  bool _isRefreshing = false;
  Completer<void>? _refreshCompleter;

  InterceptorsWrapper _authInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Cac request refresh khong can gan access token
        if (!options.path.contains('/auth/refresh') &&
            !options.path.contains('/auth/login')) {
          final token = await SecureStorageService.instance.layAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
        }
        handler.next(options);
      },
      onError: (DioException error, handler) async {
        final statusCode = error.response?.statusCode;
        final requestOptions = error.requestOptions;

        if (statusCode == 401 && !requestOptions.path.contains('/auth/')) {
          try {
            await _refreshTokenIfNeeded();
            // Retry request goc voi token moi
            final newToken =
                await SecureStorageService.instance.layAccessToken();
            requestOptions.headers['Authorization'] = 'Bearer $newToken';
            final response = await _dio.fetch(requestOptions);
            return handler.resolve(response);
          } catch (_) {
            await SecureStorageService.instance.xoaTokens();
            return handler.reject(
              DioException(
                requestOptions: requestOptions,
                error: AuthExpiredException(),
              ),
            );
          }
        }
        handler.next(error);
      },
    );
  }

  Future<void> _refreshTokenIfNeeded() async {
    if (_isRefreshing) {
      // Da co 1 refresh dang chay, cho no xong roi dung ket qua
      return _refreshCompleter?.future;
    }
    _isRefreshing = true;
    _refreshCompleter = Completer<void>();
    try {
      final refreshToken =
          await SecureStorageService.instance.layRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        throw AuthExpiredException();
      }
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
      );
      final data = response.data as Map<String, dynamic>;
      await SecureStorageService.instance.luuTokens(
        accessToken: data['access_token'].toString(),
        refreshToken: (data['refresh_token'] ?? refreshToken).toString(),
        tokenType: data['token_type']?.toString() ?? 'bearer',
      );
      _refreshCompleter?.complete();
    } catch (e) {
      _refreshCompleter?.completeError(e);
      rethrow;
    } finally {
      _isRefreshing = false;
    }
  }

  /// Helper chuyen doi DioException -> ApiException voi message de doc.
  static ApiException parseError(Object error) {
    if (error is DioException) {
      if (error.error is AuthExpiredException) {
        return ApiException(
          'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
          statusCode: 401,
        );
      }
      final statusCode = error.response?.statusCode;
      final data = error.response?.data;
      String message = 'Lỗi kết nối máy chủ';
      if (data is Map && data['detail'] != null) {
        message = data['detail'].toString();
      } else if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.connectionError) {
        message = 'Không thể kết nối máy chủ. Kiểm tra mạng hoặc chế độ ngoại tuyến (Offline).';
      }
      return ApiException(message, statusCode: statusCode);
    }
    return ApiException(error.toString());
  }
}
