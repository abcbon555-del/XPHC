import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../models/ho_so_local.dart';

/// Quan ly SQLite local DB cho toan bo app (offline-first).
/// Bang chinh: ho_so_local - phan anh cau truc ho so vi pham + trang thai dong bo.
class LocalDb {
  LocalDb._();
  static final LocalDb instance = LocalDb._();

  static const String tableHoSo = 'ho_so_local';
  static const int _dbVersion = 1;

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDb();
    return _db!;
  }

  Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, 'xphc_mobile.db');
    return openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE $tableHoSo (
            client_uuid TEXT PRIMARY KEY,
            server_id TEXT,
            so_bien_ban TEXT,
            doi_tuong_id TEXT NOT NULL,
            doi_tuong_ho_ten TEXT,
            thon_id TEXT NOT NULL,
            thon_ten TEXT,
            linh_vuc_id TEXT NOT NULL,
            linh_vuc_ten TEXT,
            hanh_vi_id TEXT,
            hanh_vi_mo_ta_them TEXT,
            kinh_do REAL NOT NULL,
            vi_do REAL NOT NULL,
            dia_chi_map TEXT,
            so_tien_phat REAL,
            ngay_lap TEXT NOT NULL,
            sync_status TEXT NOT NULL DEFAULT 'pending',
            so_lan_thu_sync INTEGER NOT NULL DEFAULT 0,
            duong_dan_file_local TEXT,
            duong_dan_file_da_upload TEXT,
            ghi_chu_loi TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )
        ''');
        await db.execute(
          'CREATE INDEX idx_ho_so_sync_status ON $tableHoSo (sync_status)',
        );
      },
    );
  }

  Future<void> upsertHoSo(HoSoLocal hoSo) async {
    final db = await database;
    await db.insert(
      tableHoSo,
      hoSo.toDbMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<HoSoLocal>> layTatCa() async {
    final db = await database;
    final rows = await db.query(tableHoSo, orderBy: 'created_at DESC');
    return rows.map((r) => HoSoLocal.fromDbMap(r)).toList();
  }

  Future<List<HoSoLocal>> layTheoTrangThai(String syncStatus) async {
    final db = await database;
    final rows = await db.query(
      tableHoSo,
      where: 'sync_status = ?',
      whereArgs: [syncStatus],
      orderBy: 'created_at ASC',
    );
    return rows.map((r) => HoSoLocal.fromDbMap(r)).toList();
  }

  Future<HoSoLocal?> layTheoClientUuid(String clientUuid) async {
    final db = await database;
    final rows = await db.query(
      tableHoSo,
      where: 'client_uuid = ?',
      whereArgs: [clientUuid],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return HoSoLocal.fromDbMap(rows.first);
  }

  Future<void> capNhatTrangThaiSync(
    String clientUuid, {
    required String syncStatus,
    String? serverId,
    String? soBienBan,
    int? soLanThuSync,
    List<String>? duongDanFileDaUpload,
    String? ghiChuLoi,
  }) async {
    final existing = await layTheoClientUuid(clientUuid);
    if (existing == null) return;
    final updated = existing.copyWith(
      syncStatus: syncStatus,
      serverId: serverId,
      soBienBan: soBienBan,
      soLanThuSync: soLanThuSync,
      duongDanFileDaUpload: duongDanFileDaUpload,
      ghiChuLoi: ghiChuLoi,
    );
    await upsertHoSo(updated);
  }

  Future<void> xoaHoSo(String clientUuid) async {
    final db = await database;
    await db.delete(tableHoSo, where: 'client_uuid = ?', whereArgs: [clientUuid]);
  }

  Future<Map<String, int>> demTheoTrangThai() async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT sync_status, COUNT(*) as so_luong FROM $tableHoSo GROUP BY sync_status',
    );
    final map = <String, int>{
      SyncStatus.pending: 0,
      SyncStatus.synced: 0,
      SyncStatus.failed: 0,
    };
    for (final row in result) {
      final status = row['sync_status']?.toString() ?? '';
      final count = row['so_luong'] is int
          ? row['so_luong'] as int
          : int.tryParse(row['so_luong'].toString()) ?? 0;
      map[status] = count;
    }
    return map;
  }
}
