import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/api_config.dart';
import '../../core/services/storage_service.dart';
import '../../models/auth_session.dart';
import '../../models/worker_model.dart';
import '../../models/worker_department.dart';
import '../interfaces/i_auth_repository.dart';

class RemoteAuthRepository implements IAuthRepository {
  final StorageService _storageService;
  final String baseUrl;

  RemoteAuthRepository({StorageService? storageService, String? baseUrl})
      : _storageService = storageService ?? StorageService(),
        baseUrl = (baseUrl ?? ApiConfig.defaultBaseUrl).replaceFirst(RegExp(r'/$'), '');

  @override
  Future<AuthSession> login({required String employeeId, required String password, bool rememberMe = true}) async {
    final identifier = employeeId.trim();
    if (identifier.isEmpty || password.isEmpty) {
      throw const AuthException('Email or Worker ID and password cannot be empty.');
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({'identifier': identifier, 'password': password}),
      ).timeout(ApiConfig.requestTimeout);

      final body = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body) as Map<String, dynamic>;
      final data = body['data'] is Map ? Map<String, dynamic>.from(body['data'] as Map) : body;
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw AuthException((body['message'] ?? 'Invalid Employee ID or password.').toString());
      }

      final token = (data['accessToken'] ?? data['token'])?.toString();
      if (token == null || token.isEmpty) throw const AuthException('Login succeeded but no access token was returned.');

      final workerJson = data['worker'] ?? (data['user'] is Map ? (data['user'] as Map)['worker'] : null);
      if (workerJson is! Map) throw const AuthException('Login succeeded but worker information was not returned.');

      final worker = Worker.fromJson(Map<String, dynamic>.from(workerJson));
      if (!worker.role.isWorker) throw const RoleUnauthorizedException('Access denied: Only municipal workers can use this application.');

      final session = AuthSession(
        token: token,
        worker: worker,
        expiresAt: DateTime.now().add(rememberMe ? const Duration(days: 7) : const Duration(hours: 8)),
        rememberMe: rememberMe,
      );
      await _storageService.saveSession(session);
      return session;
    } on AuthException {
      rethrow;
    } catch (e) {
      throw AuthException('Unable to connect to the common backend: $e');
    }
  }

  @override
  Future<List<WorkerDepartment>> getDepartments() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/departments'),
        headers: {'Accept': 'application/json'},
      ).timeout(ApiConfig.requestTimeout);
      final body = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw AuthException(_responseMessage(body, 'Unable to load departments.'));
      }
      final data = body is Map && body['data'] is List ? body['data'] : body;
      if (data is! List) throw const AuthException('Invalid department list from server.');
      return data
          .map((item) => WorkerDepartment.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    } on AuthException {
      rethrow;
    } catch (e) {
      throw AuthException('Unable to connect to the common backend: $e');
    }
  }

  @override
  Future<void> registerWorker({
    required String name,
    required String email,
    required String password,
    required String departmentId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register/worker'),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({
          'name': name.trim(),
          'email': email.trim(),
          'password': password,
          'departmentId': departmentId,
        }),
      ).timeout(ApiConfig.requestTimeout);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final body = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
        throw AuthException(_responseMessage(body, 'Worker registration failed.'));
      }
    } on AuthException {
      rethrow;
    } catch (e) {
      throw AuthException('Unable to connect to the common backend: $e');
    }
  }

  String _responseMessage(dynamic body, String fallback) {
    if (body is Map && body['message'] != null) {
      final message = body['message'];
      if (message is List) return message.join(', ');
      return message.toString();
    }
    return fallback;
  }

  @override
  Future<AuthSession?> getCurrentSession() async {
    final session = await _storageService.getSession();
    if (session == null || session.isExpired) {
      await _storageService.clearSession();
      return null;
    }
    return session;
  }

  @override
  Future<bool> validateToken(String token) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/auth/me'), headers: {'Authorization': 'Bearer $token'}).timeout(ApiConfig.requestTimeout);
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<void> logout() async {
    final token = await _storageService.getToken();
    if (token != null && token.isNotEmpty) {
      try {
        await http.post(Uri.parse('$baseUrl/auth/logout'), headers: {'Authorization': 'Bearer $token'}).timeout(ApiConfig.requestTimeout);
      } catch (_) {}
    }
    await _storageService.clearSession();
  }
}
