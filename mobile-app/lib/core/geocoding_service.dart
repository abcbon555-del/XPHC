import 'package:dio/dio.dart';

/// Interface chung cho dich vu Reverse Geocoding (toa do -> dia chi chu).
/// Tach interface rieng de co the swap giua implementation that (Nominatim)
/// va mock (khi mat mang) ma khong anh huong code goi no.
abstract class GeocodingService {
  /// Tra ve dia chi dang text tu toa do (latitude, longitude).
  /// Khong bao gio throw - neu loi thi tra ve chuoi fallback "lat, lng".
  Future<String> reverseGeocode({required double lat, required double lng});
}

/// Implementation that, goi Nominatim (OpenStreetMap) - HOAN TOAN MIEN PHI,
/// khong can API key/billing. Xem: https://nominatim.org/release-docs/latest/api/Reverse/
///
/// Luu y chinh sach su dung cua Nominatim (usage policy):
/// - Toi da ~1 request/giay (voi quy mo 1 xa, vai chuc bien ban/ngay thi thoai mai du dung).
/// - Bat buoc gui header User-Agent dinh danh ung dung (khong duoc de trong/mac dinh).
/// - Khong dung cho tai lon/production quy mo lon - neu can, tu host lai Nominatim
///   hoac chuyen sang dich vu tra phi (Google/Mapbox) sau nay ma khong doi interface nay.
class NominatimGeocodingService implements GeocodingService {
  NominatimGeocodingService({Dio? dio}) : _dio = dio ?? Dio();

  final Dio _dio;

  static const String _endpoint = 'https://nominatim.openstreetmap.org/reverse';
  static const String _userAgent = 'XPHC-MobileApp/1.0 (quan-ly-vi-pham-cap-xa)';

  @override
  Future<String> reverseGeocode({required double lat, required double lng}) async {
    try {
      final response = await _dio.get(
        _endpoint,
        queryParameters: {
          'lat': lat,
          'lon': lng,
          'format': 'jsonv2',
          'accept-language': 'vi',
        },
        options: Options(headers: {'User-Agent': _userAgent}),
      );
      final data = response.data as Map<String, dynamic>;
      final displayName = data['display_name']?.toString();
      if (displayName != null && displayName.isNotEmpty) {
        return displayName;
      }
      return MockGeocodingService().reverseGeocode(lat: lat, lng: lng);
    } catch (_) {
      // Loi mang / vuot rate limit / Nominatim tam thoi qua tai -> fallback,
      // khong lam vo luong nghiep vu lap bien ban.
      return MockGeocodingService().reverseGeocode(lat: lat, lng: lng);
    }
  }
}

/// Fallback / mock: tra ve toa do dang chuoi "lat, lng" (lam tron 6 so thap phan).
/// Dung khi goi Nominatim loi (mat mang, vuot rate limit...).
class MockGeocodingService implements GeocodingService {
  @override
  Future<String> reverseGeocode({required double lat, required double lng}) async {
    return '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}';
  }
}

/// Factory tien loi: mac dinh dung Nominatim (mien phi, khong can API key).
GeocodingService taoGeocodingService() {
  return NominatimGeocodingService();
}
