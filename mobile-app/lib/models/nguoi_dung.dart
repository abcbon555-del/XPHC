/// Model thong tin nguoi dung dang nhap (tra ve tu GET /auth/me)
class NguoiDung {
  final String id;
  final String tenDangNhap;
  final String? hoTen;
  final bool quyenNhapLieu;
  final bool quyenUploadTaiLieu;
  final String phamViXem; // "gioi_han" | "toan_bo"
  final bool quyenXuatBaoCao;
  final bool isAdmin;
  final String? thonPhuTrachId;

  NguoiDung({
    required this.id,
    required this.tenDangNhap,
    this.hoTen,
    required this.quyenNhapLieu,
    required this.quyenUploadTaiLieu,
    required this.phamViXem,
    required this.quyenXuatBaoCao,
    required this.isAdmin,
    this.thonPhuTrachId,
  });

  factory NguoiDung.fromJson(Map<String, dynamic> json) {
    return NguoiDung(
      id: json['id']?.toString() ?? '',
      tenDangNhap: json['ten_dang_nhap']?.toString() ?? '',
      hoTen: json['ho_ten']?.toString(),
      quyenNhapLieu: json['quyen_nhap_lieu'] == true,
      quyenUploadTaiLieu: json['quyen_upload_tai_lieu'] == true,
      phamViXem: json['pham_vi_xem']?.toString() ?? 'gioi_han',
      quyenXuatBaoCao: json['quyen_xuat_bao_cao'] == true,
      isAdmin: json['is_admin'] == true,
      thonPhuTrachId: json['thon_phu_trach_id']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ten_dang_nhap': tenDangNhap,
        'ho_ten': hoTen,
        'quyen_nhap_lieu': quyenNhapLieu,
        'quyen_upload_tai_lieu': quyenUploadTaiLieu,
        'pham_vi_xem': phamViXem,
        'quyen_xuat_bao_cao': quyenXuatBaoCao,
        'is_admin': isAdmin,
        'thon_phu_trach_id': thonPhuTrachId,
      };
}
