class Thon {
  final String id;
  final String tenThon;
  final String? maThon;
  final String? trangThai;

  Thon({
    required this.id,
    required this.tenThon,
    this.maThon,
    this.trangThai,
  });

  factory Thon.fromJson(Map<String, dynamic> json) {
    return Thon(
      id: json['id'].toString(),
      tenThon: json['ten_thon']?.toString() ?? '',
      maThon: json['ma_thon']?.toString(),
      trangThai: json['trang_thai']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ten_thon': tenThon,
        'ma_thon': maThon,
        'trang_thai': trangThai,
      };
}
