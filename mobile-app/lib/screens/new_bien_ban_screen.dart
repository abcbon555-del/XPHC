import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_theme.dart';
import '../models/doi_tuong.dart';
import '../models/hanh_vi.dart';
import '../state/danh_muc_provider.dart';
import '../state/new_bien_ban_provider.dart';
import 'capture_media_screen.dart';
import 'map_picker_screen.dart';

/// Man hinh Lap Bien Ban Moi - luong nghiep vu chinh cua app.
/// Cac buoc: chon/tao doi tuong -> chon thon/linh vuc/hanh vi -> nhap so bien
/// ban + tien phat -> chon vi tri tren ban do -> chup anh/video -> Luu.
/// Khi bam Luu: LUON ghi vao local DB truoc (offline-first), roi thu sync ngay.
class NewBienBanScreen extends StatefulWidget {
  const NewBienBanScreen({super.key});

  @override
  State<NewBienBanScreen> createState() => _NewBienBanScreenState();
}

class _NewBienBanScreenState extends State<NewBienBanScreen> {
  final _timKiemController = TextEditingController();
  final _soTienPhatController = TextEditingController();
  final _moTaThemController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DanhMucProvider>().taiDanhMuc();
    });
  }

  @override
  void dispose() {
    _timKiemController.dispose();
    _soTienPhatController.dispose();
    _moTaThemController.dispose();
    super.dispose();
  }

  Future<void> _moBanDoChonViTri() async {
    final provider = context.read<NewBienBanProvider>();
    final ketQua = await Navigator.of(context).push<KetQuaChonViTri>(
      MaterialPageRoute(
        builder: (_) => MapPickerScreen(
          latBanDau: provider.viDo,
          lngBanDau: provider.kinhDo,
        ),
      ),
    );
    if (ketQua != null) {
      provider.capNhatViTri(lat: ketQua.lat, lng: ketQua.lng, diaChi: ketQua.diaChi);
    }
  }

  Future<void> _hienThiDialogTaoDoiTuong(NewBienBanProvider provider) async {
    final hoTenController = TextEditingController(text: _timKiemController.text);
    final cccdController = TextEditingController();
    final sdtController = TextEditingController();
    final diaChiController = TextEditingController();

    final ketQua = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tạo đối tượng mới'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: hoTenController,
                decoration: const InputDecoration(labelText: 'Họ tên *'),
              ),
              TextField(
                controller: cccdController,
                decoration: const InputDecoration(labelText: 'Số CCCD'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: sdtController,
                decoration: const InputDecoration(labelText: 'Số điện thoại'),
                keyboardType: TextInputType.phone,
              ),
              TextField(
                controller: diaChiController,
                decoration: const InputDecoration(labelText: 'Địa chỉ'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Tạo mới')),
        ],
      ),
    );

    if (ketQua == true && hoTenController.text.trim().isNotEmpty) {
      final thanhCong = await provider.taoDoiTuongMoi(
        hoTen: hoTenController.text.trim(),
        soCccd: cccdController.text.trim().isEmpty ? null : cccdController.text.trim(),
        soDt: sdtController.text.trim().isEmpty ? null : sdtController.text.trim(),
        diaChi: diaChiController.text.trim().isEmpty ? null : diaChiController.text.trim(),
      );
      if (!thanhCong && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.loi ?? 'Tạo đối tượng thất bại')),
        );
      }
    }
  }

  Future<void> _luu(NewBienBanProvider provider) async {
    provider.capNhatMoTaThem(_moTaThemController.text);
    final soTien = double.tryParse(_soTienPhatController.text.replaceAll(',', '.'));
    provider.capNhatSoTienPhat(soTien);

    final thanhCong = await provider.luuBienBan();
    if (!mounted) return;
    if (thanhCong) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã lưu biên bản, đang chờ đồng bộ (sẽ tự động đồng bộ khi có mạng).')),
      );
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.loi ?? 'Lưu thất bại, vui lòng thử lại.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final danhMuc = context.watch<DanhMucProvider>();

    return ChangeNotifierProvider(
      create: (_) => NewBienBanProvider(),
      child: Consumer<NewBienBanProvider>(
        builder: (context, provider, _) {
          return Scaffold(
            appBar: AppBar(title: const Text('Biên Bản Kiểm Tra Hiện Trạng')),
            body: danhMuc.dangTai
                ? const Center(child: CircularProgressIndicator())
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buocDoiTuong(provider),
                      const Divider(height: 32),
                      _buocThonVaLinhVuc(provider, danhMuc),
                      const Divider(height: 32),
                      _buocThongTinBienBan(),
                      const Divider(height: 32),
                      _buocViTri(provider),
                      const Divider(height: 32),
                      CaptureMediaSection(
                        duongDanFile: provider.duongDanFileLocal,
                        onThemFile: provider.themFile,
                        onXoaFile: provider.xoaFile,
                      ),
                      const SizedBox(height: 24),
                      if (provider.loi != null) ...[
                        Text(provider.loi!, style: const TextStyle(color: AppColors.danger)),
                        const SizedBox(height: 12),
                      ],
                      FilledButton.icon(
                        onPressed: provider.dangLuu ? null : () => _luu(provider),
                        icon: provider.dangLuu
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.save_outlined),
                        label: const Text('Lưu biên bản'),
                        style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
          );
        },
      ),
    );
  }

  Widget _buocDoiTuong(NewBienBanProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('1. Đối tượng vi phạm', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        if (provider.doiTuongDaChon == null) ...[
          TextField(
            controller: _timKiemController,
            decoration: InputDecoration(
              labelText: 'Tìm theo họ tên / CCCD / số điện thoại',
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: const Icon(Icons.search),
                onPressed: () => provider.timKiemDoiTuong(_timKiemController.text),
              ),
            ),
            onSubmitted: (v) => provider.timKiemDoiTuong(v),
          ),
          const SizedBox(height: 8),
          if (provider.dangTimKiem) const LinearProgressIndicator(),
          if (!provider.dangTimKiem && provider.ketQuaTimKiem.isNotEmpty)
            ...provider.ketQuaTimKiem.map((dt) => _theDoiTuong(dt, provider)),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => _hienThiDialogTaoDoiTuong(provider),
            icon: const Icon(Icons.person_add_alt_outlined),
            label: const Text('Không tìm thấy? Tạo đối tượng mới'),
          ),
        ] else
          Card(
            child: ListTile(
              leading: const Icon(Icons.person),
              title: Text(provider.doiTuongDaChon!.hoTen),
              subtitle: Text([
                if (provider.doiTuongDaChon!.soCccd != null) 'CCCD: ${provider.doiTuongDaChon!.soCccd}',
                if (provider.doiTuongDaChon!.soDt != null) 'SĐT: ${provider.doiTuongDaChon!.soDt}',
              ].join(' | ')),
              trailing: IconButton(
                icon: const Icon(Icons.close),
                onPressed: provider.boChonDoiTuong,
              ),
            ),
          ),
        if (provider.doiTuongDaChon != null && provider.doiTuongDaChon!.soLanTaiPham > 0)
          Container(
            margin: const EdgeInsets.only(top: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.dangerLight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.danger.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: AppColors.danger),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Cảnh báo tái phạm: đối tượng này đã vi phạm ${provider.doiTuongDaChon!.soLanTaiPham} lần trước đó.',
                    style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _theDoiTuong(DoiTuong dt, NewBienBanProvider provider) {
    return Card(
      child: ListTile(
        title: Text(dt.hoTen),
        subtitle: Text([
          if (dt.soCccd != null) 'CCCD: ${dt.soCccd}',
          if (dt.soDt != null) 'SĐT: ${dt.soDt}',
        ].join(' | ')),
        trailing: dt.soLanTaiPham > 0
            ? Chip(
                label: Text('Tái phạm x${dt.soLanTaiPham}'),
                backgroundColor: AppColors.dangerLight,
                labelStyle: const TextStyle(color: AppColors.danger, fontSize: 11),
              )
            : null,
        onTap: () => provider.chonDoiTuong(dt),
      ),
    );
  }

  Widget _buocThonVaLinhVuc(NewBienBanProvider provider, DanhMucProvider danhMuc) {
    final hanhViTheoLinhVuc = provider.linhVucDaChon == null
        ? <HanhVi>[]
        : danhMuc.hanhViTheoLinhVuc(provider.linhVucDaChon!.id);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('2. Thôn / Lĩnh vực / Hành vi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: provider.thonDaChon?.id,
          decoration: const InputDecoration(labelText: 'Chọn Thôn *', border: OutlineInputBorder()),
          items: danhMuc.danhSachThon
              .map((t) => DropdownMenuItem(value: t.id, child: Text(t.tenThon)))
              .toList(),
          onChanged: (id) {
            final thon = danhMuc.danhSachThon.firstWhere((t) => t.id == id);
            provider.chonThon(thon);
          },
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: provider.linhVucDaChon?.id,
          decoration: const InputDecoration(labelText: 'Lĩnh vực vi phạm hành chính *', border: OutlineInputBorder()),
          items: danhMuc.danhSachLinhVuc
              .map((lv) => DropdownMenuItem(value: lv.id, child: Text(lv.tenLinhVuc)))
              .toList(),
          onChanged: (id) {
            final lv = danhMuc.danhSachLinhVuc.firstWhere((e) => e.id == id);
            provider.chonLinhVuc(lv);
          },
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: provider.hanhViDaChon?.id,
          decoration: const InputDecoration(labelText: 'Hành vi vi phạm', border: OutlineInputBorder()),
          items: hanhViTheoLinhVuc
              .map((hv) => DropdownMenuItem(value: hv.id, child: Text(hv.tenHanhVi, overflow: TextOverflow.ellipsis)))
              .toList(),
          onChanged: provider.linhVucDaChon == null
              ? null
              : (id) {
                  final hv = hanhViTheoLinhVuc.firstWhere((e) => e.id == id);
                  provider.chonHanhVi(hv);
                },
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _moTaThemController,
          decoration: const InputDecoration(
            labelText: 'Mô tả thêm về hành vi (nếu cần)',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
      ],
    );
  }

  Widget _buocThongTinBienBan() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('3. Thông tin biên bản', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.06),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline, size: 18, color: AppColors.primary),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Số biên bản (BB-KTHT...) sẽ được hệ thống tự động cấp khi đồng bộ lên máy chủ.',
                  style: TextStyle(fontSize: 12.5, color: AppColors.primary),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _soTienPhatController,
          decoration: const InputDecoration(
            labelText: 'Số tiền phạt (VNĐ, tùy chọn)',
            border: OutlineInputBorder(),
          ),
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
        ),
      ],
    );
  }

  Widget _buocViTri(NewBienBanProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('4. Vị trí vi phạm', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        if (provider.kinhDo != null && provider.viDo != null)
          Card(
            child: ListTile(
              leading: const Icon(Icons.location_on),
              title: Text('${provider.viDo!.toStringAsFixed(6)}, ${provider.kinhDo!.toStringAsFixed(6)}'),
              subtitle: Text(provider.diaChiMap ?? ''),
              trailing: IconButton(
                icon: const Icon(Icons.edit_location_alt_outlined),
                onPressed: _moBanDoChonViTri,
              ),
            ),
          )
        else
          OutlinedButton.icon(
            onPressed: _moBanDoChonViTri,
            icon: const Icon(Icons.map_outlined),
            label: const Text('Chọn vị trí vi phạm'),
          ),
      ],
    );
  }
}
