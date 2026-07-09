import 'package:geolocator/geolocator.dart';

/// Service xu ly quyen va lay vi tri GPS hien tai.
class LocationService {
  /// Kiem tra + xin quyen vi tri. Tra ve true neu co the tiep tuc lay vi tri.
  Future<bool> kiemTraVaXinQuyen() async {
    bool dichVuBat = await Geolocator.isLocationServiceEnabled();
    if (!dichVuBat) {
      return false;
    }

    LocationPermission quyen = await Geolocator.checkPermission();
    if (quyen == LocationPermission.denied) {
      quyen = await Geolocator.requestPermission();
      if (quyen == LocationPermission.denied) {
        return false;
      }
    }

    if (quyen == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Lay vi tri hien tai. Nem Exception neu khong co quyen / khong lay duoc.
  Future<Position> layViTriHienTai() async {
    final coQuyen = await kiemTraVaXinQuyen();
    if (!coQuyen) {
      throw Exception(
        'Không có quyền truy cập vị trí. Vui lòng cấp quyền trong Cài đặt.',
      );
    }
    return Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }
}
