import 'dart:io';

import 'package:flutter/material.dart';

/// Thumbnail preview cho 1 file anh/video da chup, co nut xoa.
/// Voi video, do khong the render frame preview don gian ma khong them
/// package rieng, hien thi 1 icon video + ten file thay cho thumbnail that.
class MediaThumbnail extends StatelessWidget {
  final String duongDan;
  final VoidCallback onXoa;

  const MediaThumbnail({
    super.key,
    required this.duongDan,
    required this.onXoa,
  });

  bool get _laVideo {
    final duoi = duongDan.toLowerCase();
    return duoi.endsWith('.mp4') || duoi.endsWith('.mov') || duoi.endsWith('.avi');
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: 90,
          height: 90,
          margin: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: Colors.grey.shade200,
          ),
          clipBehavior: Clip.antiAlias,
          child: _laVideo
              ? Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.videocam, size: 32, color: Colors.black54),
                    SizedBox(height: 4),
                    Text('Video', style: TextStyle(fontSize: 10)), // "Video" giu nguyen - tu quoc te thong dung
                  ],
                )
              : Image.file(
                  File(duongDan),
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const Icon(
                    Icons.broken_image,
                    color: Colors.black38,
                  ),
                ),
        ),
        Positioned(
          top: 0,
          right: 0,
          child: GestureDetector(
            onTap: onXoa,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(2),
              child: const Icon(Icons.close, size: 16, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
