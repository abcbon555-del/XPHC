class LinhVuc {
  final String id;
  final String tenLinhVuc;
  final int? thuTuHienThi;

  LinhVuc({
    required this.id,
    required this.tenLinhVuc,
    this.thuTuHienThi,
  });

  factory LinhVuc.fromJson(Map<String, dynamic> json) {
    return LinhVuc(
      id: json['id'].toString(),
      tenLinhVuc: json['ten_linh_vuc']?.toString() ?? '',
      thuTuHienThi: json['thu_tu_hien_thi'] is int
          ? json['thu_tu_hien_thi'] as int
          : int.tryParse(json['thu_tu_hien_thi']?.toString() ?? ''),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ten_linh_vuc': tenLinhVuc,
        'thu_tu_hien_thi': thuTuHienThi,
      };
}
