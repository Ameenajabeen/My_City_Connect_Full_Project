import '../services/api/api_client.dart';
import '../services/api/api_endpoints.dart';

class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String preferredLanguage;
  const UserModel({required this.id, required this.name, required this.email, required this.phone, required this.role, this.preferredLanguage = 'en'});
  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['id']?.toString() ?? '', name: json['name']?.toString() ?? '', email: json['email']?.toString() ?? '',
    phone: json['phone']?.toString() ?? '', role: json['role']?.toString() ?? 'CITIZEN', preferredLanguage: json['preferredLanguage']?.toString() ?? 'en',
  );
}

abstract class AuthRepository {
  Future<UserModel> login({required String email, required String password});
  Future<UserModel> register({required String name, required String email, required String phone, required String password, required String preferredLanguage});
  Future<void> logout();
  Future<UserModel?> getCurrentUser();
}

class RealAuthRepository implements AuthRepository {
  final ApiClient apiClient;
  RealAuthRepository(this.apiClient);

  Map<String, dynamic> _data(dynamic body) => Map<String, dynamic>.from(apiClient.unwrap(body) as Map);

  @override
  Future<UserModel> login({required String email, required String password}) async {
    final response = await apiClient.post(ApiEndpoints.login, data: {'email': email, 'password': password});
    final data = _data(response.data);
    await apiClient.saveToken(data['accessToken']?.toString() ?? data['token'].toString());
    if (data['refreshToken'] != null) await apiClient.saveRefreshToken(data['refreshToken'].toString());
    return UserModel.fromJson(Map<String, dynamic>.from(data['user'] as Map));
  }

  @override
  Future<UserModel> register({required String name, required String email, required String phone, required String password, required String preferredLanguage}) async {
    final response = await apiClient.post(ApiEndpoints.register, data: {'name': name, 'email': email, 'phone': phone, 'password': password, 'preferredLanguage': preferredLanguage, 'role': 'CITIZEN'});
    final data = _data(response.data);
    await apiClient.saveToken(data['accessToken']?.toString() ?? data['token'].toString());
    if (data['refreshToken'] != null) await apiClient.saveRefreshToken(data['refreshToken'].toString());
    return UserModel.fromJson(Map<String, dynamic>.from(data['user'] as Map));
  }

  @override
  Future<void> logout() async { try { await apiClient.post(ApiEndpoints.logout); } finally { await apiClient.clearToken(); } }

  @override
  Future<UserModel?> getCurrentUser() async {
    try {
      final response = await apiClient.get(ApiEndpoints.currentUser);
      return UserModel.fromJson(Map<String, dynamic>.from(apiClient.unwrap(response.data) as Map));
    } catch (_) { return null; }
  }
}

class MockAuthRepository implements AuthRepository {
  UserModel? _currentUser;
  @override Future<UserModel> login({required String email, required String password}) async => _currentUser = UserModel(id: 'mock', name: email.split('@').first, email: email, phone: '', role: 'CITIZEN');
  @override Future<UserModel> register({required String name, required String email, required String phone, required String password, required String preferredLanguage}) async => _currentUser = UserModel(id: 'mock', name: name, email: email, phone: phone, role: 'CITIZEN', preferredLanguage: preferredLanguage);
  @override Future<void> logout() async => _currentUser = null;
  @override Future<UserModel?> getCurrentUser() async => _currentUser;
}
