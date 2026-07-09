import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../core/app_theme.dart';
import '../core/geocoding_service.dart';
import '../services/location_service.dart';

/// Ket qua tra ve tu MapPickerScreen: toa do da chon + dia chi (reverse geocode).
class KetQuaChonViTri {
  final double lat;
  final double lng;
  final String diaChi;

  KetQuaChonViTri({required this.lat, required this.lng, required this.diaChi});
}

/// Man hinh chon vi tri tren ban do - dung flutter_map + OpenStreetMap/Esri
/// (HOAN TOAN MIEN PHI, khong can API key/billing nhu Google Maps SDK).
///
/// Co che "keo-tha ghim": vi flutter_map khong ho tro marker keo-tha truc tiep
/// nhu Google Maps, ta dung pattern pho bien - ghim CO DINH giua man hinh,
/// nguoi dung keo/pan BAN DO ben duoi de chinh vi tri chinh xac thua dat vi
/// pham (tam ghim luon la tam man hinh). Day la UX chuan cho cac app chon vi
/// tri mien phi (khong Google), de dung tuong duong keo-tha marker.
class MapPickerScreen extends StatefulWidget {
  final double? latBanDau;
  final double? lngBanDau;

  const MapPickerScreen({super.key, this.latBanDau, this.lngBanDau});

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  final LocationService _locationService = LocationService();
  final GeocodingService _geocodingService = taoGeocodingService();
  final MapController _mapController = MapController();

  LatLng? _viTriDaChon;
  bool _dangTaiViTri = true;
  bool _dangLayDiaChi = false;
  bool _cheDoVeTinh = false;
  String? _diaChiHienTai;
  String? _loi;

  // Vi tri mac dinh khi khong lay duoc GPS (UBND xa mau - co the doi tuy dia phuong).
  static const LatLng _viTriMacDinh = LatLng(21.028511, 105.804817);

  @override
  void initState() {
    super.initState();
    if (widget.latBanDau != null && widget.lngBanDau != null) {
      _viTriDaChon = LatLng(widget.latBanDau!, widget.lngBanDau!);
      _dangTaiViTri = false;
      _capNhatDiaChi(_viTriDaChon!);
    } else {
      _layViTriHienTai();
    }
  }

  Future<void> _layViTriHienTai() async {
    setState(() {
      _dangTaiViTri = true;
      _loi = null;
    });
    try {
      final viTri = await _locationService.layViTriHienTai();
      final latLng = LatLng(viTri.latitude, viTri.longitude);
      setState(() {
        _viTriDaChon = latLng;
        _dangTaiViTri = false;
      });
      _mapController.move(latLng, 18);
      _capNhatDiaChi(latLng);
    } catch (e) {
      setState(() {
        _loi = 'Không thể lấy vị trí GPS: $e. Bạn có thể kéo bản đồ để chọn vị trí thủ công.';
        _viTriDaChon ??= _viTriMacDinh;
        _dangTaiViTri = false;
      });
    }
  }

  Future<void> _capNhatDiaChi(LatLng viTri) async {
    setState(() => _dangLayDiaChi = true);
    final diaChi = await _geocodingService.reverseGeocode(
      lat: viTri.latitude,
      lng: viTri.longitude,
    );
    if (!mounted) return;
    setState(() {
      _diaChiHienTai = diaChi;
      _dangLayDiaChi = false;
    });
  }

  /// Goi khi nguoi dung ngung pan/zoom ban do - lay tam man hinh lam vi tri da chon.
  void _khiNgungDiChuyenBanDo(MapCamera camera, bool hasGesture) {
    if (!hasGesture) return; // chi xu ly khi nguoi dung tu tay pan, khong phai do code goi move()
    setState(() => _viTriDaChon = camera.center);
    _capNhatDiaChi(camera.center);
  }

  void _xacNhan() {
    if (_viTriDaChon == null) return;
    Navigator.of(context).pop(
      KetQuaChonViTri(
        lat: _viTriDaChon!.latitude,
        lng: _viTriDaChon!.longitude,
        diaChi: _diaChiHienTai ?? '${_viTriDaChon!.latitude}, ${_viTriDaChon!.longitude}',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final viTriHienThi = _viTriDaChon ?? _viTriMacDinh;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chọn vị trí vi phạm'),
        actions: [
          IconButton(
            icon: Icon(_cheDoVeTinh ? Icons.map_outlined : Icons.satellite_alt_outlined),
            tooltip: _cheDoVeTinh ? 'Chuyển sang bản đồ thường' : 'Chuyển sang chế độ vệ tinh',
            onPressed: () => setState(() => _cheDoVeTinh = !_cheDoVeTinh),
          ),
          IconButton(
            icon: const Icon(Icons.my_location),
            tooltip: 'Lấy lại vị trí GPS',
            onPressed: _layViTriHienTai,
          ),
        ],
      ),
      body: Stack(
        children: [
          if (_dangTaiViTri)
            const Center(child: CircularProgressIndicator())
          else
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: viTriHienThi,
                initialZoom: 18,
                onPositionChanged: _khiNgungDiChuyenBanDo,
              ),
              children: [
                // OpenStreetMap (mien phi) hoac Esri World Imagery cho che do "ve tinh"
                // (mien phi, khong can API key) - dong bo lua chon voi Web Admin.
                TileLayer(
                  urlTemplate: _cheDoVeTinh
                      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.xphc.xphc_mobile',
                ),
                const RichAttributionWidget(
                  attributions: [
                    TextSourceAttribution('OpenStreetMap contributors / Esri'),
                  ],
                ),
              ],
            ),
          // Ghim co dinh giua man hinh - dai dien vi tri se duoc chon khi pan ban do.
          const IgnorePointer(
            child: Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: 36),
                child: Icon(Icons.location_pin, size: 44, color: AppColors.danger),
              ),
            ),
          ),
          if (_loi != null)
            Positioned(
              top: 12,
              left: 12,
              right: 12,
              child: Material(
                color: AppColors.warnLight,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Text(_loi!, style: const TextStyle(color: AppColors.warn)),
                ),
              ),
            ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, -2)),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Kéo bản đồ để chỉnh vị trí chính xác (ghim luôn ở giữa màn hình)',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tọa độ: ${viTriHienThi.latitude.toStringAsFixed(6)}, ${viTriHienThi.longitude.toStringAsFixed(6)}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            _dangLayDiaChi ? 'Đang xác định địa chỉ...' : (_diaChiHienTai ?? '-'),
                            style: const TextStyle(color: Colors.grey, fontSize: 13),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _viTriDaChon == null ? null : _xacNhan,
                        icon: const Icon(Icons.check),
                        label: const Text('Xác nhận vị trí này'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
