import '../../models/auth_session.dart';
import '../../models/worker_department.dart';

/// Base exception for authentication failures
class AuthException implements Exception {
  final String message;
  final String? code;

  const AuthException(this.message, {this.code});

  @override
  String toString() => message;
}

/// Thrown when an authenticated user does not have the required WORKER role
class RoleUnauthorizedException extends AuthException {
  const RoleUnauthorizedException(
    super.message, {
    super.code = 'ROLE_UNAUTHORIZED',
  });
}

/// Thrown when the session token is expired or invalidated
class SessionExpiredException extends AuthException {
  const SessionExpiredException(
    super.message, {
    super.code = 'SESSION_EXPIRED',
  });
}

/// Authentication repository interface contract
abstract class IAuthRepository {
  /// Authenticates with credentials and establishes a worker session.
  /// Validates that the returned user possesses the WORKER role.
  Future<AuthSession> login({
    required String employeeId,
    required String password,
    bool rememberMe = true,
  });

  Future<List<WorkerDepartment>> getDepartments();

  Future<void> registerWorker({
    required String name,
    required String email,
    required String password,
    required String departmentId,
  });

  /// Retrieves the active stored session, verifying expiration.
  Future<AuthSession?> getCurrentSession();

  /// Clears stored session, terminating local and remote sessions.
  Future<void> logout();

  /// Validates whether a token remains active with the backend.
  Future<bool> validateToken(String token);
}
