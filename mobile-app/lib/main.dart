import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'state/auth_provider.dart';
import 'state/danh_muc_provider.dart';
import 'state/sync_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const XphcApp());
}

class XphcApp extends StatelessWidget {
  const XphcApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DanhMucProvider()),
        ChangeNotifierProvider(create: (_) => SyncProvider()),
      ],
      child: MaterialApp(
        title: 'XPHC',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const _KhoiDongApp(),
      ),
    );
  }
}

/// Widget khoi dong: kiem tra trang thai dang nhap (token trong secure
/// storage) truoc khi dieu huong toi Login hoac Home.
class _KhoiDongApp extends StatefulWidget {
  const _KhoiDongApp();

  @override
  State<_KhoiDongApp> createState() => _KhoiDongAppState();
}

class _KhoiDongAppState extends State<_KhoiDongApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().khoiTao();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    switch (auth.trangThai) {
      case TrangThaiAuth.dangKiemTra:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case TrangThaiAuth.chuaDangNhap:
        return const LoginScreen();
      case TrangThaiAuth.daDangNhap:
        return const HomeScreen();
    }
  }
}
