import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

import '../widgets/media_thumbnail.dart';

/// Widget chup anh/quay video hien truong va quan ly danh sach file da chon.
/// Dung image_picker (don gian, ho tro ca anh va video, khong can quan ly
/// camera preview tuy bien).
///
/// File sau khi chup se duoc COPY vao thu muc luu tru rieng cua app
/// (path_provider) de dam bao ton tai lau dai (anh tam trong cache co the
/// bi he dieu hanh don dep bat cu luc nao).
class CaptureMediaSection extends StatefulWidget {
  final List<String> duongDanFile;
  final void Function(String duongDan) onThemFile;
  final void Function(String duongDan) onXoaFile;

  const CaptureMediaSection({
    super.key,
    required this.duongDanFile,
    required this.onThemFile,
    required this.onXoaFile,
  });

  @override
  State<CaptureMediaSection> createState() => _CaptureMediaSectionState();
}

class _CaptureMediaSectionState extends State<CaptureMediaSection> {
  final ImagePicker _picker = ImagePicker();
  bool _dangXuLy = false;

  Future<String> _luuVaoThuMucApp(XFile file) async {
    final thuMuc = await getApplicationDocumentsDirectory();
    final thuMucAnh = Directory(p.join(thuMuc.path, 'xphc_media'));
    if (!await thuMucAnh.exists()) {
      await thuMucAnh.create(recursive: true);
    }
    final tenFile = '${DateTime.now().millisecondsSinceEpoch}_${p.basename(file.path)}';
    final duongDanMoi = p.join(thuMucAnh.path, tenFile);
    await File(file.path).copy(duongDanMoi);
    return duongDanMoi;
  }

  Future<void> _chupAnh() async {
    setState(() => _dangXuLy = true);
    try {
      final file = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
      if (file != null) {
        final duongDan = await _luuVaoThuMucApp(file);
        widget.onThemFile(duongDan);
      }
    } catch (e) {
      _hienThiLoi('Không thể chụp ảnh: $e');
    } finally {
      if (mounted) setState(() => _dangXuLy = false);
    }
  }

  Future<void> _quayVideo() async {
    setState(() => _dangXuLy = true);
    try {
      final file = await _picker.pickVideo(
        source: ImageSource.camera,
        maxDuration: const Duration(minutes: 3),
      );
      if (file != null) {
        final duongDan = await _luuVaoThuMucApp(file);
        widget.onThemFile(duongDan);
      }
    } catch (e) {
      _hienThiLoi('Không thể quay video: $e');
    } finally {
      if (mounted) setState(() => _dangXuLy = false);
    }
  }

  Future<void> _chonTuThuVien() async {
    setState(() => _dangXuLy = true);
    try {
      final files = await _picker.pickMultiImage(imageQuality: 85);
      for (final file in files) {
        final duongDan = await _luuVaoThuMucApp(file);
        widget.onThemFile(duongDan);
      }
    } catch (e) {
      _hienThiLoi('Không thể chọn ảnh: $e');
    } finally {
      if (mounted) setState(() => _dangXuLy = false);
    }
  }

  void _hienThiLoi(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Ảnh hiện trạng kiểm tra', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Row(
          children: [
            OutlinedButton.icon(
              onPressed: _dangXuLy ? null : _chupAnh,
              icon: const Icon(Icons.camera_alt_outlined),
              label: const Text('Chụp ảnh'),
            ),
            const SizedBox(width: 8),
            OutlinedButton.icon(
              onPressed: _dangXuLy ? null : _quayVideo,
              icon: const Icon(Icons.videocam_outlined),
              label: const Text('Quay video'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        TextButton.icon(
          onPressed: _dangXuLy ? null : _chonTuThuVien,
          icon: const Icon(Icons.photo_library_outlined),
          label: const Text('Chọn từ thư viện'),
        ),
        if (_dangXuLy) const LinearProgressIndicator(),
        const SizedBox(height: 8),
        if (widget.duongDanFile.isNotEmpty)
          Wrap(
            children: widget.duongDanFile
                .map((duongDan) => MediaThumbnail(
                      duongDan: duongDan,
                      onXoa: () => widget.onXoaFile(duongDan),
                    ))
                .toList(),
          )
        else
          const Text('Chưa có ảnh/video nào được thêm.', style: TextStyle(color: Colors.grey)),
      ],
    );
  }
}
