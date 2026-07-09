import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_theme.dart';
import '../state/auth_provider.dart';
import '../state/sync_provider.dart';
import 'login_screen.dart';
import 'new_bien_ban_screen.dart';
import 'quan_ly_thon_screen.dart';
import 'sync_status_screen.dart';

/// Man hinh chinh sau khi dang nhap. Hien thi thong tin nguoi dung, so luong
/// ban ghi cho dong bo, va cac chuc nang chinh: Lap bien ban moi (co kiem tra
/// quyen_nhap_lieu de an/hien - chi la UX phu tro, backend van chan that su),
/// Trang thai dong bo.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final syncProvider = context.read<SyncProvider>();
      syncProvider.khoiDongLangNgheMang();
      syncProvider.taiDanhSach();
    });
  }

  Future<void> _dangXuat() async {
    await context.read<AuthProvider>().dangXuat();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  void _thongBaoKhongCoQuyen() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Bạn không có quyền nhập liệu. Liên hệ quản trị viên để được cấp quyền.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final syncProvider = context.watch<SyncProvider>();
    final soCho = syncProvider.soLuongTheoTrangThai['pending'] ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('XPHC'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Đăng xuất',
            onPressed: _dangXuat,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: syncProvider.taiDanhSach,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const CircleAvatar(radius: 28, child: Icon(Icons.person, size: 28)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            auth.nguoiDung?.hoTen ?? auth.nguoiDung?.tenDangNhap ?? '',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Text('@${auth.nguoiDung?.tenDangNhap ?? ''}',
                              style: const TextStyle(color: Colors.grey)),
                          if (!auth.quyenNhapLieu)
                            const Padding(
                              padding: EdgeInsets.only(top: 4),
                              child: Text(
                                'Không có quyền nhập liệu',
                                style: TextStyle(color: AppColors.danger, fontSize: 12),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _theChucNang(
              icon: Icons.note_add_outlined,
              tieuDe: 'Biên Bản Kiểm Tra Hiện Trạng',
              moTa: 'Ghi nhận vi phạm hành chính tại hiện trường',
              enabled: auth.quyenNhapLieu,
              onTap: auth.quyenNhapLieu
                  ? () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const NewBienBanScreen()),
                      )
                  : _thongBaoKhongCoQuyen,
            ),
            const SizedBox(height: 12),
            _theChucNang(
              icon: Icons.sync,
              tieuDe: 'Trạng thái đồng bộ',
              moTa: soCho > 0 ? 'Còn $soCho biên bản đang chờ đồng bộ' : 'Tất cả đã đồng bộ',
              enabled: true,
              badge: soCho > 0 ? soCho.toString() : null,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SyncStatusScreen()),
              ),
            ),
            if (auth.isAdmin) ...[
              const SizedBox(height: 12),
              _theChucNang(
                icon: Icons.location_city_outlined,
                tieuDe: 'Quản lý Thôn',
                moTa: 'Sửa tên Thôn/địa bàn (chỉ Quản trị viên)',
                enabled: true,
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const QuanLyThonScreen()),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _theChucNang({
    required IconData icon,
    required String tieuDe,
    required String moTa,
    required bool enabled,
    required VoidCallback onTap,
    String? badge,
  }) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: enabled ? AppColors.primaryLight : Colors.grey.shade200,
          child: Icon(icon, color: enabled ? AppColors.primary : Colors.grey),
        ),
        title: Text(tieuDe, style: TextStyle(color: enabled ? AppColors.textPrimary : Colors.grey)),
        subtitle: Text(moTa),
        trailing: badge != null
            ? CircleAvatar(radius: 12, backgroundColor: AppColors.statusYellow, child: Text(badge, style: const TextStyle(fontSize: 11, color: Colors.white)))
            : const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
