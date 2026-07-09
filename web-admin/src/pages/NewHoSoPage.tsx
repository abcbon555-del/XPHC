import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, CheckCircle2, ImagePlus, X } from "lucide-react";
import { searchDoiTuong, createDoiTuong } from "../api/doiTuong";
import { listLinhVuc, listHanhVi } from "../api/danhMuc";
import { listThon } from "../api/thon";
import { createHoSo, uploadHoSoFile } from "../api/hoSo";
import type { DoiTuongViPham } from "../types";
import { Layout } from "../components/Layout";
import { LocationPicker, reverseGeocode } from "../components/LocationPicker";
import { FileCategoryUpload } from "../components/FileCategoryUpload";
import { extractErrorMessage } from "../utils/errors";

const HANH_VI_KHAC = "__khac__";

export function NewHoSoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Buoc 1: Doi tuong vi pham
  const [tuKhoa, setTuKhoa] = useState("");
  const [doiTuongDaChon, setDoiTuongDaChon] = useState<DoiTuongViPham | null>(null);
  const [hienFormTaoMoi, setHienFormTaoMoi] = useState(false);
  const [doiTuongMoi, setDoiTuongMoi] = useState({ ho_ten: "", so_cccd: "", so_dt: "", dia_chi: "" });

  // Buoc 2: Thon / Linh vuc / Hanh vi
  const [thonId, setThonId] = useState("");
  const [linhVucId, setLinhVucId] = useState("");
  const [hanhViId, setHanhViId] = useState("");
  const [moTaThem, setMoTaThem] = useState("");

  // Buoc 3: Thong tin bien ban
  const [soTienPhat, setSoTienPhat] = useState("");

  // Buoc 4: Vi tri
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [diaChiMap, setDiaChiMap] = useState("");
  const [dangDoDiaChi, setDangDoDiaChi] = useState(false);

  // Buoc 5: Anh hien trang vi pham (chon truoc, tu dong tai len sau khi lap bien ban thanh cong)
  const [anhFiles, setAnhFiles] = useState<File[]>([]);
  const [dangTaiAnh, setDangTaiAnh] = useState(false);
  const [loiTaiAnh, setLoiTaiAnh] = useState<string | null>(null);

  // Sau khi tao thanh cong
  const [hoSoDaTaoId, setHoSoDaTaoId] = useState<string | null>(null);
  const [soBienBanTao, setSoBienBanTao] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const anhPreviews = useMemo(() => anhFiles.map((f) => URL.createObjectURL(f)), [anhFiles]);
  useEffect(() => {
    return () => anhPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [anhPreviews]);

  function handleChonAnh(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setAnhFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function xoaAnh(index: number) {
    setAnhFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const { data: ketQuaTimKiem = [], refetch: timKiemLai } = useQuery({
    queryKey: ["doi-tuong-search", tuKhoa],
    queryFn: () => searchDoiTuong(tuKhoa || undefined),
    enabled: false,
  });

  const { data: thonList = [] } = useQuery({ queryKey: ["thon"], queryFn: listThon });
  const { data: linhVucList = [] } = useQuery({ queryKey: ["linh-vuc"], queryFn: listLinhVuc });
  const { data: hanhViList = [] } = useQuery({ queryKey: ["hanh-vi"], queryFn: listHanhVi });

  const hanhViTheoLinhVuc = useMemo(
    () => hanhViList.filter((h) => h.linh_vuc_id === linhVucId),
    [hanhViList, linhVucId]
  );

  const createDoiTuongMutation = useMutation({
    mutationFn: () =>
      createDoiTuong({
        ho_ten: doiTuongMoi.ho_ten,
        so_cccd: doiTuongMoi.so_cccd || undefined,
        so_dt: doiTuongMoi.so_dt || undefined,
        dia_chi: doiTuongMoi.dia_chi || undefined,
      }),
    onSuccess: (dt) => {
      setDoiTuongDaChon(dt);
      setHienFormTaoMoi(false);
    },
  });

  const createHoSoMutation = useMutation({
    mutationFn: () => {
      if (!doiTuongDaChon) throw new Error("Chưa chọn đối tượng vi phạm");
      if (!thonId || !linhVucId || !hanhViId) throw new Error("Vui lòng chọn đầy đủ Thôn, Lĩnh vực và Hành vi vi phạm");
      if (hanhViId === HANH_VI_KHAC && !moTaThem.trim()) {
        throw new Error("Vui lòng tự ghi rõ hành vi vi phạm khi chọn \"Khác\"");
      }
      if (lat == null || lng == null) throw new Error("Vui lòng chọn vị trí vi phạm trên bản đồ");
      return createHoSo({
        doi_tuong_id: doiTuongDaChon.id,
        thon_id: thonId,
        linh_vuc_id: linhVucId,
        hanh_vi_id: hanhViId === HANH_VI_KHAC ? undefined : hanhViId,
        hanh_vi_mo_ta_them: moTaThem || undefined,
        kinh_do: lng,
        vi_do: lat,
        dia_chi_map: diaChiMap || undefined,
        so_tien_phat: soTienPhat ? Number(soTienPhat) : 0,
      });
    },
    onSuccess: async (hoSo) => {
      setError(null);
      setHoSoDaTaoId(hoSo.id);
      setSoBienBanTao(hoSo.so_bien_ban);
      queryClient.invalidateQueries({ queryKey: ["ho-so-list"] });
      queryClient.invalidateQueries({ queryKey: ["ho-so"] });

      if (anhFiles.length > 0) {
        setDangTaiAnh(true);
        setLoiTaiAnh(null);
        try {
          for (const file of anhFiles) {
            await uploadHoSoFile(hoSo.id, "bien_ban_va_anh", file);
          }
          setAnhFiles([]);
          queryClient.invalidateQueries({ queryKey: ["ho-so-files", hoSo.id] });
        } catch (e) {
          setLoiTaiAnh(extractErrorMessage(e));
        } finally {
          setDangTaiAnh(false);
        }
      }
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : extractErrorMessage(e));
    },
  });

  async function handleChonViTri(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
    setDangDoDiaChi(true);
    const diaChi = await reverseGeocode(newLat, newLng);
    setDiaChiMap(diaChi);
    setDangDoDiaChi(false);
  }

  function resetForm() {
    setTuKhoa("");
    setDoiTuongDaChon(null);
    setHienFormTaoMoi(false);
    setDoiTuongMoi({ ho_ten: "", so_cccd: "", so_dt: "", dia_chi: "" });
    setThonId("");
    setLinhVucId("");
    setHanhViId("");
    setMoTaThem("");
    setSoTienPhat("");
    setLat(null);
    setLng(null);
    setDiaChiMap("");
    setAnhFiles([]);
    setLoiTaiAnh(null);
    setHoSoDaTaoId(null);
    setSoBienBanTao(null);
    setError(null);
  }

  // Sau khi da tao ho so: hien thi khu vuc tai anh len ngay tai day
  if (hoSoDaTaoId) {
    return (
      <Layout>
        <div className="page-header">
          <h1 className="page-title">Biên Bản Kiểm Tra Hiện Trạng</h1>
        </div>
        <div className="card card-pad" style={{ maxWidth: 480, marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
          <CheckCircle2 size={28} color="var(--color-success)" />
          <div>
            <div style={{ fontWeight: 700 }}>Đã lập biên bản: {soBienBanTao}</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {dangTaiAnh ? "Đang tải ảnh hiện trạng lên..." : "Hồ sơ đã được tạo. Có thể tải thêm ảnh hiện trạng bên dưới."}
            </div>
          </div>
        </div>

        {loiTaiAnh && (
          <div className="error-banner" style={{ maxWidth: 480, marginBottom: 20 }}>
            Một số ảnh chưa tải lên được: {loiTaiAnh}. Bạn có thể tải lại bên dưới.
          </div>
        )}

        <div style={{ maxWidth: 480, marginBottom: 20 }}>
          <FileCategoryUpload
            hoSoId={hoSoDaTaoId}
            danhMuc="bien_ban_va_anh"
            title="Ảnh hiện trạng kiểm tra"
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate(`/ho-so/${hoSoDaTaoId}`)}>
            Xem hồ sơ đầy đủ
          </button>
          <button className="btn btn-secondary" onClick={resetForm}>
            Lập biên bản khác
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Biên Bản Kiểm Tra Hiện Trạng</h1>
        <p className="page-subtitle">Ghi nhận hiện trạng kiểm tra vi phạm hành chính, nêu rõ hành vi vi phạm và đính kèm ảnh hiện trạng.</p>
      </div>

      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Buoc 1: Doi tuong */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>1. Đối tượng vi phạm</h3>
          {doiTuongDaChon ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{doiTuongDaChon.ho_ten}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  {[doiTuongDaChon.so_cccd && `CCCD: ${doiTuongDaChon.so_cccd}`, doiTuongDaChon.so_dt && `SĐT: ${doiTuongDaChon.so_dt}`]
                    .filter(Boolean)
                    .join(" | ")}
                </div>
                {doiTuongDaChon.so_lan_tai_pham > 0 && (
                  <span className="badge badge-red" style={{ marginTop: 6 }}>
                    Tái phạm x{doiTuongDaChon.so_lan_tai_pham}
                  </span>
                )}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setDoiTuongDaChon(null)}>
                Đổi
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="Tìm theo họ tên / CCCD / số điện thoại"
                  value={tuKhoa}
                  onChange={(e) => setTuKhoa(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && timKiemLai()}
                />
                <button type="button" className="btn btn-secondary" onClick={() => timKiemLai()}>
                  <Search size={15} />
                </button>
              </div>

              {ketQuaTimKiem.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {ketQuaTimKiem.map((dt) => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDoiTuongDaChon(dt)}
                      className="card"
                      style={{ padding: 10, textAlign: "left", cursor: "pointer", border: "1px solid var(--color-border)" }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{dt.ho_ten}</div>
                      <div className="text-muted" style={{ fontSize: 12.5 }}>
                        {[dt.so_cccd && `CCCD: ${dt.so_cccd}`, dt.so_dt && `SĐT: ${dt.so_dt}`].filter(Boolean).join(" | ")}
                        {dt.so_lan_tai_pham > 0 && ` — Tái phạm x${dt.so_lan_tai_pham}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => setHienFormTaoMoi((v) => !v)}
              >
                <UserPlus size={14} /> Không tìm thấy? Tạo đối tượng mới
              </button>

              {hienFormTaoMoi && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="field">
                    <label className="label">Họ tên *</label>
                    <input
                      className="input"
                      value={doiTuongMoi.ho_ten}
                      onChange={(e) => setDoiTuongMoi({ ...doiTuongMoi, ho_ten: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="label">Số CCCD</label>
                    <input
                      className="input"
                      value={doiTuongMoi.so_cccd}
                      onChange={(e) => setDoiTuongMoi({ ...doiTuongMoi, so_cccd: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="label">Số điện thoại</label>
                    <input
                      className="input"
                      value={doiTuongMoi.so_dt}
                      onChange={(e) => setDoiTuongMoi({ ...doiTuongMoi, so_dt: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="label">Địa chỉ</label>
                    <input
                      className="input"
                      value={doiTuongMoi.dia_chi}
                      onChange={(e) => setDoiTuongMoi({ ...doiTuongMoi, dia_chi: e.target.value })}
                    />
                  </div>
                  {createDoiTuongMutation.isError && (
                    <div className="error-banner" style={{ fontSize: 12.5 }}>
                      {extractErrorMessage(createDoiTuongMutation.error)}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!doiTuongMoi.ho_ten.trim() || createDoiTuongMutation.isPending}
                    onClick={() => createDoiTuongMutation.mutate()}
                  >
                    {createDoiTuongMutation.isPending ? "Đang tạo..." : "Tạo mới"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Buoc 2: Thon / Linh vuc / Hanh vi - noi ro vi pham gi */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>2. Thôn và hành vi vi phạm</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field">
              <label className="label">Thôn *</label>
              <select className="input" value={thonId} onChange={(e) => setThonId(e.target.value)}>
                <option value="">-- Chọn Thôn --</option>
                {thonList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.ten_thon}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Lĩnh vực vi phạm hành chính *</label>
              <select
                className="input"
                value={linhVucId}
                onChange={(e) => {
                  setLinhVucId(e.target.value);
                  setHanhViId("");
                }}
              >
                <option value="">-- Chọn Lĩnh vực --</option>
                {linhVucList.map((lv) => (
                  <option key={lv.id} value={lv.id}>
                    {lv.ten_linh_vuc}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Hành vi vi phạm *</label>
              <select
                className="input"
                value={hanhViId}
                onChange={(e) => setHanhViId(e.target.value)}
                disabled={!linhVucId}
              >
                <option value="">-- Chọn Hành vi --</option>
                {hanhViTheoLinhVuc.map((hv) => (
                  <option key={hv.id} value={hv.id}>
                    {hv.ten_hanh_vi}
                  </option>
                ))}
                <option value={HANH_VI_KHAC}>Khác (tự ghi thông tin bên dưới)</option>
              </select>
            </div>
            <div className="field">
              <label className="label">
                Mô tả rõ hành vi vi phạm {hanhViId === HANH_VI_KHAC ? "*" : "(bắt buộc nói rõ vi phạm gì)"}
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Ví dụ: Xây dựng nhà cấp 4 diện tích 40m2 trên đất nông nghiệp, không có giấy phép xây dựng..."
                value={moTaThem}
                onChange={(e) => setMoTaThem(e.target.value)}
                required={hanhViId === HANH_VI_KHAC}
              />
            </div>
          </div>
        </div>

        {/* Buoc 3: Thong tin bien ban */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>3. Thông tin biên bản</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="text-muted" style={{ fontSize: 12.5 }}>
              Số biên bản sẽ được hệ thống tự động cấp theo dạng <strong>BB-KTHT 001/{new Date().getFullYear()}</strong>, tăng dần theo thứ tự lập biên bản trong năm.
            </div>
            <div className="field">
              <label className="label">Số tiền phạt (VNĐ, tùy chọn)</label>
              <input
                className="input"
                type="number"
                min={0}
                value={soTienPhat}
                onChange={(e) => setSoTienPhat(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Buoc 4: Vi tri */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>4. Vị trí vi phạm</h3>
          <LocationPicker lat={lat} lng={lng} onChange={handleChonViTri} />
          <div className="text-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            Bấm vào bản đồ hoặc kéo ghim để chọn đúng vị trí thửa đất vi phạm.
          </div>
          <div style={{ marginTop: 10 }} className="field">
            <label className="label">Địa chỉ (theo bản đồ)</label>
            <input
              className="input"
              value={dangDoDiaChi ? "Đang xác định địa chỉ..." : diaChiMap}
              onChange={(e) => setDiaChiMap(e.target.value)}
              placeholder="Tự động điền sau khi chọn vị trí, có thể sửa lại"
            />
          </div>
        </div>

        {/* Buoc 5: Anh hien trang vi pham */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>5. Ảnh hiện trạng vi phạm</h3>
          <div className="text-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
            Chọn ảnh chụp hiện trạng vi phạm (có thể chọn nhiều ảnh). Ảnh sẽ được tự động tải lên ngay sau khi lập biên bản thành công.
          </div>

          {anhFiles.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 8, marginBottom: 12 }}>
              {anhFiles.map((file, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={anhPreviews[i]}
                    alt={file.name}
                    style={{ width: "100%", height: 72, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                  />
                  <button
                    type="button"
                    onClick={() => xoaAnh(i)}
                    title="Xóa ảnh"
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "var(--color-danger)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", justifyContent: "flex-start", width: "fit-content" }}>
            <ImagePlus size={14} />
            {anhFiles.length > 0 ? "Thêm ảnh khác" : "Chọn ảnh"}
            <input type="file" accept="image/*" capture="environment" multiple style={{ display: "none" }} onChange={handleChonAnh} />
          </label>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <button
          className="btn btn-primary"
          disabled={createHoSoMutation.isPending}
          onClick={() => createHoSoMutation.mutate()}
        >
          {createHoSoMutation.isPending ? "Đang lập biên bản..." : "Lập biên bản"}
        </button>
      </div>
    </Layout>
  );
}
