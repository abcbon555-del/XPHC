import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Wrapper quanh flutter_secure_storage de luu access_token / refresh_token.
/// Tach rieng thanh 1 lop de de thay the / mock trong test neu can.
class SecureStorageService {
  SecureStorageService._();
  static final SecureStorageService instance = SecureStorageService._();

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const String _keyAccessToken = 'access_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyTokenType = 'token_type';

  Future<void> luuTokens({
    required String accessToken,
    required String refreshToken,
    String tokenType = 'bearer',
  }) async {
    await _storage.write(key: _keyAccessToken, value: accessToken);
    await _storage.write(key: _keyRefreshToken, value: refreshToken);
    await _storage.write(key: _keyTokenType, value: tokenType);
  }

  Future<String?> layAccessToken() => _storage.read(key: _keyAccessToken);
  Future<String?> layRefreshToken() => _storage.read(key: _keyRefreshToken);
  Future<String?> layTokenType() => _storage.read(key: _keyTokenType);

  Future<void> xoaTokens() async {
    await _storage.delete(key: _keyAccessToken);
    await _storage.delete(key: _keyRefreshToken);
    await _storage.delete(key: _keyTokenType);
  }

  Future<bool> daDangNhap() async {
    final token = await layAccessToken();
    return token != null && token.isNotEmpty;
  }
}
