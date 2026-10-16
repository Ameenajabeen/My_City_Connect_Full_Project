import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/auth_session.dart';
import '../constants/app_constants.dart';

/// Service managing secure storage for session tokens and profiles.
/// Passwords are never stored.
class StorageService {
  final SharedPreferences? _prefs;

  StorageService([this._prefs]);

  Future<SharedPreferences> _getPrefs() async {
    return _prefs ?? await SharedPreferences.getInstance();
  }

  /// Persists session token and worker profile.
  Future<void> saveSession(AuthSession session) async {
    final prefs = await _getPrefs();
    await prefs.setString(AppConstants.keyAuthToken, session.token);
    await prefs.setString(AppConstants.keyWorkerSession, jsonEncode(session.toJson()));
  }

  /// Retrieves stored session if present and unexpired.
  Future<AuthSession?> getSession() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(AppConstants.keyWorkerSession);
    if (jsonStr == null || jsonStr.isEmpty) return null;

    try {
      final map = jsonDecode(jsonStr) as Map<String, dynamic>;
      final session = AuthSession.fromJson(map);

      // Verify expiration
      if (session.isExpired) {
        await clearSession();
        return null;
      }
      return session;
    } catch (_) {
      await clearSession();
      return null;
    }
  }

  /// Retrieves the active bearer token string
  Future<String?> getToken() async {
    final prefs = await _getPrefs();
    return prefs.getString(AppConstants.keyAuthToken);
  }

  /// Clears stored credentials and session data on logout or expiration
  Future<void> clearSession() async {
    final prefs = await _getPrefs();
    await prefs.remove(AppConstants.keyAuthToken);
    await prefs.remove(AppConstants.keyWorkerSession);
  }
}
