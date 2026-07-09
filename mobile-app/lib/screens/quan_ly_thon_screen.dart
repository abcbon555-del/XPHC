import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../services/danh_muc_service.dart';
import '../state/danh_muc_provider.dart';

/// Man hinh Quan ly Thon - CHI danh cho tai khoan Admin (kiem tra o
/// home_screen.dart truoc khi dieu huong toi day). Cho phep sua ten Thon.
/// Viec them moi / ngung hoat dong Thon van thuc hien tren Web Admin.
class QuanLyThonScreen extends StatefulWidget {
  const QuanLyThonScreen({super.key});

  @override
  State<QuanLyThonScreen> createState() => _QuanLyThonScreenState();
}

class _QuanLyThonScreenState extends State<QuanLyThonScreen> {
  final DanhMucService _service = DanhMucService();
  bool _dangLuu = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DanhMucProvider>().taiDanhMuc(lamMoi: true);
    });
  }

  Future<void> _hienThiDialogSuaTen(String id, String tenHienTai) async {
    final controller = TextEditingController(text: tenHienTai);
    final tenMoi = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sửa tên Thôn'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Tên Thôn', border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Lưu'),
          ),
        ],
      ),
    );

    if (tenMoi == null || tenMoi.isEmpty || tenMoi == tenHienTai) return;

    setState(() => _dangLuu = true);
    try {
      await _service.suaTenThon(id: id, tenThonMoi: tenMoi);
      if (!mounted) return;
      await context.read<DanhMucProvider>().taiDanhMuc(lamMoi: true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã cập nhật tên Thôn.')),
      );
    } catch (e) {
      if (!mounted) return;
      final thongBao = e is ApiException ? e.message : 'Cập nhật thất bại, vui lòng thử lại.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(thongBao)));
    } finally {
      if (mounted) setState(() => _dangLuu = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final danhMuc = context.watch<DanhMucProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Quản lý Thôn')),
      body: danhMuc.dangTai
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => context.read<DanhMucProvider>().taiDanhMuc(lamMoi: true),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: danhMuc.danhSachThon.length,
                itemBuilder: (context, index) {
                  final thon = danhMuc.danhSachThon[index];
                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.location_city_outlined),
                      title: Text(thon.tenThon),
                      subtitle: Text('Mã: ${thon.maThon ?? '-'} · ${thon.trangThai == 'hoat_dong' ? 'Đang hoạt động' : 'Ngừng hoạt động'}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.edit_outlined),
                        tooltip: 'Sửa tên Thôn',
                        onPressed: _dangLuu ? null : () => _hienThiDialogSuaTen(thon.id, thon.tenThon),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
