import '../../core/services/storage_service.dart';
import '../../models/auth_session.dart';
import '../../models/worker_department.dart';
import '../interfaces/i_auth_repository.dart';

/// Mock authentication repository for local development and testing
class MockAuthRepository implements IAuthRepository {
  final StorageService _storageService;

  MockAuthRepository({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  @override
  Future<AuthSession> login({
    required String employeeId,
    required String password,
    bool rememberMe = true,
  }) async {
    throw const AuthException('Worker authentication requires the live backend.');
  }

  @override
  Future<List<WorkerDepartment>> getDepartments() async => const [];

  @override
  Future<void> registerWorker({
    required String name,
    required String email,
    required String password,
    required String departmentId,
  }) async {
    throw const AuthException('Worker registration requires the live backend.');
  }

  @override
  Future<AuthSession?> getCurrentSession() async {
    final session = await _storageService.getSession();
    if (session == null) return null;

    // Verify token validity
    if (session.isExpired) {
      await logout();
      return null;
    }

    return session;
  }

  @override
  Future<void> logout() async {
    await _storageService.clearSession();
  }

  @override
  Future<bool> validateToken(String token) async {
    return token.startsWith('mcc_mock_jwt_token_');
  }
}
