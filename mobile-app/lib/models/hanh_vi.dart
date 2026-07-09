class HanhVi {
  final String id;
  final String linhVucId;
  final String tenHanhVi;
  final String? canCuPhapLy;

  HanhVi({
    required this.id,
    required this.linhVucId,
    required this.tenHanhVi,
    this.canCuPhapLy,
  });

  factory HanhVi.fromJson(Map<String, dynamic> json) {
    return HanhVi(
      id: json['id'].toString(),
      linhVucId: json['linh_vuc_id'].toString(),
      tenHanhVi: json['ten_hanh_vi']?.toString() ?? '',
      canCuPhapLy: json['can_cu_phap_ly']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'linh_vuc_id': linhVucId,
        'ten_hanh_vi': tenHanhVi,
        'can_cu_phap_ly': canCuPhapLy,
      };
}
