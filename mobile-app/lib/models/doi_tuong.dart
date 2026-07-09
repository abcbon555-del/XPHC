class DoiTuong {
  final String id;
  final String hoTen;
  final String? soCccd;
  final String? soDt;
  final String? diaChi;
  final int soLanTaiPham;

  DoiTuong({
    required this.id,
    required this.hoTen,
    this.soCccd,
    this.soDt,
    this.diaChi,
    this.soLanTaiPham = 0,
  });

  factory DoiTuong.fromJson(Map<String, dynamic> json) {
    return DoiTuong(
      id: json['id'].toString(),
      hoTen: json['ho_ten']?.toString() ?? '',
      soCccd: json['so_cccd']?.toString(),
      soDt: json['so_dt']?.toString(),
      diaChi: json['dia_chi']?.toString(),
      soLanTaiPham: json['so_lan_tai_pham'] is int
          ? json['so_lan_tai_pham'] as int
          : int.tryParse(json['so_lan_tai_pham']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ho_ten': hoTen,
        'so_cccd': soCccd,
        'so_dt': soDt,
        'dia_chi': diaChi,
        'so_lan_tai_pham': soLanTaiPham,
      };
}
