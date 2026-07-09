# XPHC Mobile App (Flutter)

Ung dung di dong cho can bo cap xa lap bien ban vi pham hanh chinh / trat tu
xay dung / dat dai ngay tai hien truong, hoat dong **offline-first** va tu
dong dong bo len Backend (FastAPI) khi co mang.

Day la 1 trong 3 thanh phan cua he thong XPHC (Backend FastAPI da xong, Web
Admin dang xay song song). Thu muc nay chi chua phan Mobile App.

## 1. Kien truc tong quan

- **State management**: `provider` (khong dung Riverpod) - don gian, du dung
  cho pham vi app, de nguoi moi doc code.
- **Local DB (offline-first)**: `sqflite` - bang `ho_so_local` luu toan bo
  bien ban dang cho dong bo (`sync_status`: `pending` / `synced` / `failed`),
  kem duong dan file anh/video da chup (JSON list) va `client_uuid` (sinh
  bang package `uuid`) dung lam khoa idempotent voi backend.
- **Nguyen tac cot loi**: khi nguoi dung bam "Luu bien ban", app **LUON LUON
  ghi vao local DB truoc**, bat ke co mang hay khong. Sau do thu goi
  `POST /ho-so/sync` ngay neu dang co mang. Neu that bai (mat mang, loi
  server...), ban ghi giu trang thai `pending` va se duoc thu lai tu dong
  khi `connectivity_plus` phat hien co mang tro lai, hoac khi nguoi dung bam
  "Dong bo ngay" trong man hinh Trang thai dong bo. Du lieu **khong bao gio
  bi mat**, chi bi giu lai cho tan khi sync thanh cong.
- **HTTP client**: `dio`, voi 1 interceptor tu dong:
  - Gan `Authorization: Bearer <access_token>` tu Secure Storage vao moi
    request (tru `/auth/login`, `/auth/refresh`).
  - Khi gap `401`, tu dong goi `POST /auth/refresh` bang `refresh_token`,
    cap nhat token moi, roi tu dong retry lai request goc 1 lan. Neu refresh
    that bai, xoa token va coi nhu phien dang nhap het han (dieu huong ve
    Login).
- **Ban do**: `flutter_map` (OpenStreetMap + Esri World Imagery cho che do
  "ve tinh") + `geolocator` (GPS runtime permission). **Hoan toan mien phi,
  khong can API key/billing** (khac ban dau du dinh dung Google Maps SDK - da
  doi theo yeu cau khong phat sinh chi phi). Vi flutter_map khong ho tro
  marker keo-tha nhu Google Maps, dung pattern "ghim co dinh giua man hinh,
  nguoi dung pan ban do" - xem `map_picker_screen.dart`.
- **Reverse Geocoding**: dung Nominatim (OpenStreetMap) - cung mien phi,
  khong can API key, xem muc 4 ben duoi.
- **Media**: `image_picker` (chup anh / quay video, chon tu thu vien), file
  duoc copy vao thu muc rieng cua app (`path_provider`) de dam bao khong bi
  he dieu hanh don dep nhu file cache tam.

## 2. Cau truc thu muc

```
lib/
  main.dart                      Khoi tao app, dang ky Provider, dieu huong theo trang thai dang nhap
  core/
    api_client.dart              Dio + interceptor tu dong gan/refresh token
    local_db.dart                sqflite schema (bang ho_so_local) + CRUD
    sync_service.dart            Lang nghe connectivity_plus, dieu phoi dong bo batch + upload file
    geocoding_service.dart       Interface GeocodingService + Nominatim impl + Mock fallback
    secure_storage.dart          Wrapper flutter_secure_storage (luu access/refresh token)
  models/                        ho_so_local, doi_tuong, thon, linh_vuc, hanh_vi, nguoi_dung
  services/                      auth_service, ho_so_service, doi_tuong_service, danh_muc_service, location_service
  screens/
    login_screen.dart
    home_screen.dart
    new_bien_ban_screen.dart      Form lap bien ban - man hinh nghiep vu chinh
    map_picker_screen.dart        Chon vi tri tren ban do OSM/Esri (GPS + ghim co dinh, pan de chinh vi tri)
    capture_media_screen.dart     Widget chup anh/quay video + preview + xoa
    sync_status_screen.dart       Liet ke ho so pending/synced/failed
  state/                          AuthProvider, DanhMucProvider, SyncProvider, NewBienBanProvider
  widgets/                        TrangThaiBadge, MediaThumbnail
android/app/src/main/AndroidManifest.xml   Permissions (khong can API key nao)
ios/Runner/Info.plist.snippet              Huong dan cac quyen (Camera, Location, Photo Library) cho iOS
```

## 3. Cach chay (setup tu dau)

Moi truong scaffold nay **chua chay `flutter create .`** va **chua co Flutter
SDK duoc cai san**, vi vay thu muc `android/` va `ios/` hien **chua day du**
(thieu gradle wrapper, Podfile, res/, assets icon, v.v.). Cac buoc de chay
that:

1. Cai Flutter SDK (>= 3.22, Dart >= 3.3): https://docs.flutter.dev/get-started/install
2. Trong thu muc `mobile-app/`, chay:
   ```bash
   flutter create . --org com.xphc --project-name xphc_mobile
   ```
   Lenh nay se **bo sung** cac file/thu muc native con thieu (android/, ios/,
   gradle wrapper...) ma **khong ghi de** cac file `lib/`, `pubspec.yaml` da
   co san trong thu muc nay (Flutter chi tao file neu chua ton tai).
   - Neu `flutter create .` bao AndroidManifest.xml da ton tai, doi chieu
     noi dung voi file da viet san trong repo (chi la permissions, khong con
     meta-data API key nao ca).
3. Cai dependencies:
   ```bash
   flutter pub get
   ```
4. Them cac quyen (Camera, Location, Photo Library) vao `ios/Runner/Info.plist`
   theo noi dung trong `ios/Runner/Info.plist.snippet`. **Khong can API key
   hay cau hinh SDK nao khac** — ban do (flutter_map) va reverse geocoding
   (Nominatim) deu la dich vu mien phi, khong can dang ky/billing.
5. Chay app, tro toi backend that:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
   ```
   - `10.0.2.2` la dia chi loopback dac biet cua Android Emulator tro ve
     `localhost` cua may host chay backend. Neu chay tren thiet bi that,
     thay bang IP LAN thuc te cua may chay backend (vi du `192.168.1.10`).

## 4. Ve GeocodingService (quan trong)

`lib/core/geocoding_service.dart` dinh nghia:
- `abstract class GeocodingService` - interface chung, 1 method
  `reverseGeocode({lat, lng}) -> Future<String>`.
- `NominatimGeocodingService` - goi Nominatim (OpenStreetMap Reverse Geocoding
  API, `https://nominatim.openstreetmap.org/reverse`), **hoan toan mien phi,
  khong can API key**. Luu y usage policy cua Nominatim: toi da ~1 request/
  giay va bat buoc gui header `User-Agent` dinh danh app (da cau hinh san) -
  voi quy mo 1 xa (vai chuc bien ban/ngay) thi thoai mai du dung; neu can quy
  mo lon hon, can tu host lai Nominatim hoac chuyen sang dich vu tra phi.
- `MockGeocodingService` - fallback, tra ve chuoi `"lat.toFixed(6), lng.toFixed(6)"`.
- `NominatimGeocodingService` **tu dong fallback ve Mock** khi goi API loi
  (mat mang, vuot rate limit, Nominatim tam thoi qua tai...). Nghia la
  `reverseGeocode()` **khong bao gio throw** - luon tra ve 1 chuoi dia chi
  (that hoac toa do), giup form Lap bien ban khong bao gio bi ket vi loi
  geocoding.
- Factory `taoGeocodingService()` mac dinh tra ve `NominatimGeocodingService`.

## 5. Luong Offline Sync chi tiet

1. Nguoi dung dien form Lap bien ban -> bam "Luu bien ban".
2. `NewBienBanProvider.luuBienBan()` goi `HoSoService.taoBienBanMoi()`, ghi
   1 dong vao bang `ho_so_local` (sqflite) voi `sync_status = 'pending'`,
   `client_uuid` moi (uuid v4).
3. Ngay sau do, `SyncService.dongBoNgay()` duoc goi (khong cho ket qua, chay
   nen) - neu dang co mang:
   a. Lay tat ca ban ghi `pending` (+ `failed` chua vuot qua 5 lan thu) tu
      local DB.
   b. Goi `POST /ho-so/sync` voi list payload (co `client_uuid`, `ngay_lap`).
      Backend dung `client_uuid` de bo qua ban ghi da ton tai (idempotent) -
      an toan khi goi lai nhieu lan.
   c. Voi moi ban ghi thanh cong (co server id), goi lan luot
      `POST /ho-so/{id}/files?danh_muc=bien_ban_va_anh` cho tung file anh/
      video local con lai (bo qua file da danh dau upload thanh cong truoc do).
   d. Neu ca ho so + toan bo file da upload xong: danh dau `synced`.
      Neu ho so len duoc nhung con file loi: giu `pending`, luu lai danh sach
      file da upload de lan sau khong upload trung.
      Neu goi that bai hoan toan: tang `so_lan_thu_sync`, chuyen `failed` sau
      5 lan (van co the retry thu cong tu man hinh Trang thai dong bo).
4. `connectivity_plus` duoc lang nghe tu luc mo `HomeScreen`
   (`SyncProvider.khoiDongLangNgheMang()`) - moi khi thiet bi co mang tro
   lai, `SyncService.dongBoNgay()` tu dong duoc kich hoat lai.
5. Man hinh **Trang thai dong bo** (`sync_status_screen.dart`) liet ke toan
   bo ban ghi local kem badge mau (cam = cho dong bo, xanh = da dong bo, do =
   that bai), va nut "Dong bo ngay" o AppBar de kich hoat thu cong.

## 6. Phan quyen (UX phu tro, khong thay the backend)

Sau khi dang nhap, app goi `GET /auth/me` va luu vao `AuthProvider`. Neu
`quyen_nhap_lieu = false`:
- Nut "Lap bien ban moi" tren Home van hien nhung bam vao se hien thong bao
  "Ban khong co quyen nhap lieu..." thay vi mo form.
- **Luu y quan trong**: day chi la UX phu tro. Viec chan quyen thuc su nam o
  backend (API tra ve `403 {"detail": "..."}` neu thieu quyen). App khong tu
  y bo qua loi 403 tu server - `ApiException.isForbidden` duoc dung de hien
  thi thong bao loi tu server khi co.

## 7. Cac gia dinh / TODO khi tich hop that

- **Ban do & Geocoding**: khong can API key/billing nao (flutter_map +
  OpenStreetMap/Esri + Nominatim). Neu sau nay can trai nghiem tot hon (chi
  duong, ban do offline-cache tot hon...) co the doi sang Google Maps SDK -
  code da tach interface `GeocodingService` va widget ban do rieng nen doi
  khong anh huong phan con lai cua app.
- **`API_BASE_URL`**: mac dinh tro `http://10.0.2.2:8000/api/v1` (danh cho
  Android Emulator). Doi lai IP that khi test tren thiet bi that hoac deploy.
- **Response cua `POST /ho-so/sync`**: code gia dinh backend tra ve 1 `List`
  cac object co `client_uuid` va `id` tuong ung voi tung ban ghi da xu ly
  (de client biet server_id ma map vao tung ho so). Neu format response thuc
  te cua backend khac (vi du chi tra ve `{"da_xu_ly": 5}` khong kem chi
  tiet), can sua lai ham `HoSoService.syncBatch()` (trong
  `lib/services/ho_so_service.dart`) va `SyncService._dongBoFileChoHoSo()`
  (trong `lib/core/sync_service.dart`) cho khop - hien tai code co fallback
  "coi ca batch la thanh cong" nhung se KHONG co server_id de upload file
  trong truong hop do, ho so se bi giu `pending` mai (co ghi chu ro trong
  `ghi_chu_loi`) cho toi khi sua lai mapping nay.
- **Icon/asset app, splash screen**: chua tao, se duoc sinh mac dinh boi
  `flutter create .`. Co the thay the sau bang package `flutter_launcher_icons`.
- **`android/`, `ios/` native scaffolding**: chi co `AndroidManifest.xml` va
  file `Info.plist.snippet` tham khao, chua co gradle wrapper / Podfile /
  xcodeproj day du - bat buoc chay `flutter create .` truoc khi build that
  (xem muc 3).
- Khong co test tu dong (theo yeu cau ban dau, khong can viet test).

## 8. Danh sach package chinh (xem `pubspec.yaml`)

| Package | Muc dich |
|---|---|
| provider | State management |
| dio | HTTP client + interceptor refresh token |
| connectivity_plus | Phat hien mang de trigger sync |
| sqflite | Local DB offline-first |
| flutter_secure_storage | Luu access/refresh token an toan |
| flutter_map + latlong2 | Ban do chon vi tri (OpenStreetMap/Esri, mien phi) |
| geolocator | Lay GPS + xin quyen runtime |
| image_picker | Chup anh/quay video/chon tu thu vien |
| uuid | Sinh client_uuid cho ho so local |
| path_provider | Thu muc luu file anh/video cua app |
| intl | Dinh dang ngay gio hien thi |
