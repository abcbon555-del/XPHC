import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_theme.dart';
import '../state/auth_provider.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tenDangNhapController = TextEditingController();
  final _matKhauController = TextEditingController();
  bool _anMatKhau = true;

  @override
  void dispose() {
    _tenDangNhapController.dispose();
    _matKhauController.dispose();
    super.dispose();
  }

  Future<void> _xuLyDangNhap() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final thanhCong = await auth.dangNhap(
      _tenDangNhapController.text.trim(),
      _matKhauController.text,
    );
    if (thanhCong && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(Icons.shield_outlined, size: 72, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(height: 12),
                  const Text(
                    'XPHC',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                  ),
                  const Text(
                    'Quản lý xử lý vi phạm hành chính',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  const SizedBox(height: 32),
                  TextFormField(
                    controller: _tenDangNhapController,
                    decoration: const InputDecoration(
                      labelText: 'Tên đăng nhập',
                      prefixIcon: Icon(Icons.person_outline),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Vui lòng nhập tên đăng nhập' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _matKhauController,
                    obscureText: _anMatKhau,
                    decoration: InputDecoration(
                      labelText: 'Mật khẩu',
                      prefixIcon: const Icon(Icons.lock_outline),
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: Icon(_anMatKhau ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _anMatKhau = !_anMatKhau),
                      ),
                    ),
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'Vui lòng nhập mật khẩu' : null,
                    onFieldSubmitted: (_) => _xuLyDangNhap(),
                  ),
                  const SizedBox(height: 24),
                  if (auth.loiDangNhap != null) ...[
                    Text(
                      auth.loiDangNhap!,
                      style: const TextStyle(color: AppColors.danger),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                  ],
                  FilledButton(
                    onPressed: auth.dangXuLy ? null : _xuLyDangNhap,
                    style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: auth.dangXuLy
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Đăng nhập'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
