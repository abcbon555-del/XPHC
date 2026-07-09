import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../core/app_theme.dart';
import '../models/ho_so_local.dart';
import '../state/sync_provider.dart';
import '../widgets/trang_thai_badge.dart';

/// Man hinh "Trang thai dong bo" - liet ke tat ca ban ghi ho so local
/// (pending / synced / failed) de can bo biet con gi chua len server.
class SyncStatusScreen extends StatefulWidget {
  const SyncStatusScreen({super.key});

  @override
  State<SyncStatusScreen> createState() => _SyncStatusScreenState();
}

class _SyncStatusScreenState extends State<SyncStatusScreen> {
  final DateFormat _dinhDangNgay = DateFormat('dd/MM/yyyy HH:mm');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SyncProvider>().taiDanhSach();
    });
  }

  @override
  Widget build(BuildContext context) {
    final syncProvider = context.watch<SyncProvider>();
    final soLuong = syncProvider.soLuongTheoTrangThai;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Trạng thái đồng bộ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Đồng bộ ngay',
            onPressed: syncProvider.dangTai
                ? null
                : () async {
                    await syncProvider.dongBoNgay();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đã thử đồng bộ xong.')),
                      );
                    }
                  },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: syncProvider.taiDanhSach,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _theSoLuong('Chờ đồng bộ', soLuong[SyncStatus.pending] ?? 0, AppColors.statusYellow),
                  const SizedBox(width: 8),
                  _theSoLuong('Đã đồng bộ', soLuong[SyncStatus.synced] ?? 0, AppColors.statusGreen),
                  const SizedBox(width: 8),
                  _theSoLuong('Thất bại', soLuong[SyncStatus.failed] ?? 0, AppColors.statusRed),
                ],
              ),
            ),
            if (syncProvider.dangTai) const LinearProgressIndicator(),
            Expanded(
              child: syncProvider.danhSach.isEmpty
                  ? const Center(child: Text('Chưa có biên bản nào được lập.'))
                  : ListView.builder(
                      itemCount: syncProvider.danhSach.length,
                      itemBuilder: (context, index) {
                        final hoSo = syncProvider.danhSach[index];
                        return _theHoSo(hoSo);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _theSoLuong(String nhan, int soLuong, Color mau) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: mau.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text('$soLuong', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: mau)),
            Text(nhan, style: TextStyle(fontSize: 11, color: mau)),
          ],
        ),
      ),
    );
  }

  Widget _theHoSo(HoSoLocal hoSo) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        title: Text(
          hoSo.soBienBan != null && hoSo.soBienBan!.isNotEmpty
              ? 'Biên bản số: ${hoSo.soBienBan}'
              : 'Biên bản: chờ cấp số (chờ đồng bộ)',
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (hoSo.doiTuongHoTen != null) Text('Đối tượng: ${hoSo.doiTuongHoTen}'),
            if (hoSo.thonTen != null) Text('Thôn: ${hoSo.thonTen}'),
            Text('Ngày lập: ${_dinhDangNgay.format(hoSo.ngayLap)}'),
            Text('Số file đính kèm: ${hoSo.duongDanFileLocal.length} '
                '(đã tải lên: ${hoSo.duongDanFileDaUpload.length})'),
            if (hoSo.ghiChuLoi != null)
              Text(hoSo.ghiChuLoi!, style: const TextStyle(color: AppColors.danger, fontSize: 12)),
          ],
        ),
        isThreeLine: true,
        trailing: TrangThaiBadge(trangThai: hoSo.syncStatus),
      ),
    );
  }
}
