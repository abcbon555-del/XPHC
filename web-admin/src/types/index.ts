export type PhamViXem = "gioi_han" | "toan_bo";
export type TrangThaiDonVi = "hoat_dong" | "ngung_hoat_dong";
export type TrangThaiHoSo = "moi_phat_hien" | "da_ra_quyet_dinh" | "da_giai_quyet_dut_diem";
export type DanhMucFile = "bien_ban_va_anh" | "quyet_dinh_xu_phat" | "bien_lai_khac_phuc";

export interface Thon {
  id: string;
  ten_thon: string;
  ma_thon: string;
  trang_thai: TrangThaiDonVi;
  ghi_chu?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NguoiDung {
  id: string;
  ten_dang_nhap: string;
  ho_ten: string;
  chuc_vu?: string | null;
  so_dt?: string | null;
  email?: string | null;
  is_admin: boolean;
  is_active: boolean;
  quyen_nhap_lieu: boolean;
  quyen_upload_tai_lieu: boolean;
  pham_vi_xem: PhamViXem;
  quyen_xuat_bao_cao: boolean;
  chi_lap_bien_ban?: boolean;
  thon_phu_trach_id?: string | null;
  anh_dai_dien?: string | null;
  created_at: string;
}

export interface PublicConfig {
  ten_don_vi: string;
  ten_dia_phuong: string;
  ten_co_quan_chu_quan: string;
  mo_ta_don_vi: string;
  ban_do_vi_do_mac_dinh: number;
  ban_do_kinh_do_mac_dinh: number;
  ban_do_zoom_mac_dinh: number;
  logo_url?: string | null;
}

export interface DoiTuongViPham {
  id: string;
  ho_ten: string;
  so_cccd?: string | null;
  so_dt?: string | null;
  dia_chi?: string | null;
  so_lan_tai_pham: number;
  created_at: string;
}

export interface LinhVucViPham {
  id: string;
  ten_linh_vuc: string;
  thu_tu_hien_thi: number;
  trang_thai: TrangThaiDonVi;
}

export interface HanhViViPham {
  id: string;
  linh_vuc_id: string;
  ten_hanh_vi: string;
  can_cu_phap_ly?: string | null;
  trang_thai: TrangThaiDonVi;
}

export interface HoSoViPham {
  id: string;
  so_bien_ban: string;
  client_uuid?: string | null;
  doi_tuong_id: string;
  thon_id: string;
  linh_vuc_id: string;
  hanh_vi_id?: string | null;
  hanh_vi_mo_ta_them?: string | null;
  ngay_lap: string;
  kinh_do: number;
  vi_do: number;
  dia_chi_map?: string | null;
  trang_thai_xu_ly: TrangThaiHoSo;
  so_tien_phat: number;
  nguoi_lap_id: string;
  nguoi_lap_ho_ten: string;
  created_at: string;
  updated_at: string;
}

export interface HoSoFile {
  id: string;
  ho_so_id: string;
  danh_muc: DanhMucFile;
  ten_file_goc: string;
  duong_dan: string;
  loai_file?: string | null;
  uploaded_at: string;
}

export interface AuditLogEntry {
  id: number;
  thoi_gian: string;
  tai_khoan_id?: string | null;
  hanh_dong: string;
  doi_tuong_tac_dong?: string | null;
  noi_dung_chi_tiet?: Record<string, unknown> | null;
}
