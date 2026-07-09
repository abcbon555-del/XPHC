import 'dart:io';

import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

import '../core/api_client.dart';
import '../core/local_db.dart';
import '../models/ho_so_local.dart';

/// Danh muc file dung tren Mobile (2 danh muc con lai la viec cua Web Admin).
const String danhMucBienBanVaAnh = 'bien_ban_va_anh';

/// Service xu ly nghiep vu Ho So Vi Pham:
/// - Tao ban ghi local (offline-first: LUON ghi local truoc).
/// - Goi API tao/sync ho so va upload file dinh kem.
class HoSoService {
  HoSoService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient.instance;

  final ApiClient _api;
  final Uuid _uuid = const Uuid();

  /// Tao 1 ban ghi ho so moi va LUU VAO LOCAL DB TRUOC TIEN (bat buoc theo
  /// thiet ke offline-first - khong phan biet co mang hay khong, tranh 2 code path).
  /// Tra ve ban ghi HoSoLocal vua tao (sync_status = pending).
  Future<HoSoLocal> taoBienBanMoi({
    required String doiTuongId,
    String? doiTuongHoTen,
    required String thonId,
    String? thonTen,
    required String linhVucId,
    String? linhVucTen,
    String? hanhViId,
    String? hanhViMoTaThem,
    required double kinhDo,
    required double viDo,
    String? diaChiMap,
    double? soTienPhat,
    List<String>? duongDanFileLocal,
  }) async {
    final hoSo = HoSoLocal(
      clientUuid: _uuid.v4(),
      doiTuongId: doiTuongId,
      doiTuongHoTen: doiTuongHoTen,
      thonId: thonId,
      thonTen: thonTen,
      linhVucId: linhVucId,
      linhVucTen: linhVucTen,
      hanhViId: hanhViId,
      hanhViMoTaThem: hanhViMoTaThem,
      kinhDo: kinhDo,
      viDo: viDo,
      diaChiMap: diaChiMap,
      soTienPhat: soTienPhat,
      ngayLap: DateTime.now(),
      syncStatus: SyncStatus.pending,
      duongDanFileLocal: duongDanFileLocal,
    );
    await LocalDb.instance.upsertHoSo(hoSo);
    return hoSo;
  }

  /// Goi POST /ho-so/sync voi 1 batch cac ban ghi pending.
  /// Backend dung client_uuid lam khoa idempotent - goi lai nhieu lan an toan.
  /// Tra ve danh sach client_uuid da sync thanh cong kem server id (neu co).
  Future<List<Map<String, String>>> syncBatch(List<HoSoLocal> danhSach) async {
    if (danhSach.isEmpty) return [];
    try {
      final payload = danhSach.map((h) => h.toSyncPayload()).toList();
      final response = await _api.dio.post('/ho-so/sync', data: payload);
      final data = response.data;

      // Ky vong server tra ve list ket qua tuong ung, nhung de phong truong
      // hop server chi tra ve 200 OK don gian, ta coi toan bo batch la thanh cong.
      if (data is List) {
        return data.map<Map<String, String>>((item) {
          if (item is Map) {
            return {
              'client_uuid': item['client_uuid']?.toString() ?? '',
              'id': item['id']?.toString() ?? '',
              'so_bien_ban': item['so_bien_ban']?.toString() ?? '',
            };
          }
          return {'client_uuid': '', 'id': '', 'so_bien_ban': ''};
        }).toList();
      }

      // Fallback: coi tat ca trong batch la thanh cong, khong co server id ro rang.
      return danhSach
          .map((h) => {'client_uuid': h.clientUuid, 'id': ''})
          .toList();
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }

  /// Upload 1 file dinh kem cho ho so da co server id, danh muc bien_ban_va_anh.
  Future<void> uploadFile({
    required String hoSoServerId,
    required String duongDanFile,
  }) async {
    final file = File(duongDanFile);
    if (!await file.exists()) {
      throw ApiException('Tệp không tồn tại trên thiết bị: $duongDanFile');
    }
    try {
      final fileName = duongDanFile.split(Platform.pathSeparator).last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(duongDanFile, filename: fileName),
      });
      await _api.dio.post(
        '/ho-so/$hoSoServerId/files',
        queryParameters: {'danh_muc': danhMucBienBanVaAnh},
        data: formData,
      );
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }

  Future<Map<String, dynamic>> layChiTiet(String hoSoId) async {
    try {
      final response = await _api.dio.get('/ho-so/$hoSoId');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw ApiClient.parseError(e);
    }
  }
}
