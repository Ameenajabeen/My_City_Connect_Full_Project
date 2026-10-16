import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final appLanguageProvider = NotifierProvider<AppLanguageNotifier, Locale>(AppLanguageNotifier.new);
class AppLanguageNotifier extends Notifier<Locale> {
  static const _key = 'app_language';
  @override Locale build() { _load(); return const Locale('en'); }
  Future<void> _load() async { final p = await SharedPreferences.getInstance(); final c = p.getString(_key); if (c != null && ['en','ta','hi'].contains(c)) state = Locale(c); }
  Future<void> setLanguage(String code) async { if (!['en','ta','hi'].contains(code)) return; state = Locale(code); final p = await SharedPreferences.getInstance(); await p.setString(_key, code); }
}
