import 'package:flutter/material.dart';

import '../core/app_theme.dart';
import '../models/ho_so_local.dart';

/// Badge nho hien thi trang thai dong bo (pending / synced / failed) voi mau sac tuong ung.
class TrangThaiBadge extends StatelessWidget {
  final String trangThai;

  const TrangThaiBadge({super.key, required this.trangThai});

  @override
  Widget build(BuildContext context) {
    Color mau;
    String nhan;
    IconData icon;
    switch (trangThai) {
      case SyncStatus.synced:
        mau = AppColors.statusGreen;
        nhan = 'Đã đồng bộ';
        icon = Icons.cloud_done;
        break;
      case SyncStatus.failed:
        mau = AppColors.statusRed;
        nhan = 'Đồng bộ thất bại';
        icon = Icons.cloud_off;
        break;
      case SyncStatus.pending:
      default:
        mau = AppColors.statusYellow;
        nhan = 'Đang chờ đồng bộ';
        icon = Icons.cloud_upload_outlined;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: mau.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: mau.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: mau),
          const SizedBox(width: 4),
          Text(nhan, style: TextStyle(color: mau, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
