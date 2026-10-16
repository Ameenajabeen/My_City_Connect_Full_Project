import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/api_config.dart';
import '../core/services/storage_service.dart';
import '../models/auth_session.dart';
import '../models/worker_model.dart';
import '../repositories/interfaces/i_auth_repository.dart';
import '../repositories/mock/mock_auth_repository.dart';
import '../repositories/remote/remote_auth_repository.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

class AuthState {
  final AuthStatus status;
  final AuthSession? session;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.session,
    this.errorMessage,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated && session != null;
  Worker? get worker => session?.worker;

  AuthState copyWith({
    AuthStatus? status,
    AuthSession? session,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      session: session ?? this.session,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final IAuthRepository _authRepository;

  AuthNotifier(this._authRepository) : super(const AuthState());

  /// Checks for an active, unexpired stored session.
  Future<void> checkSession() async {
    try {
      final session = await _authRepository.getCurrentSession();
      if (session != null && !session.isExpired && session.worker.role.isWorker) {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          session: session,
          errorMessage: null,
        );
      } else {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          session: null,
          errorMessage: null,
        );
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        session: null,
        errorMessage: null,
      );
    }
  }

  /// Authenticates worker with credentials
  Future<bool> login({
    required String employeeId,
    required String password,
    bool rememberMe = true,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);

    try {
      final session = await _authRepository.login(
        employeeId: employeeId,
        password: password,
        rememberMe: rememberMe,
      );

      // Verify role
      if (!session.worker.role.isWorker) {
        throw const RoleUnauthorizedException(
          'Access denied: Only municipal workers can log into this application.',
        );
      }

      state = state.copyWith(
        status: AuthStatus.authenticated,
        session: session,
        errorMessage: null,
      );
      return true;
    } on RoleUnauthorizedException catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.message,
      );
      return false;
    } on AuthException catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.message,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'An unexpected error occurred. Please try again.',
      );
      return false;
    }
  }

  /// Terminates the active session
  Future<void> logout() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      await _authRepository.logout();
    } finally {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  /// Handlers session expiration
  void handleSessionExpired() {
    _authRepository.logout();
    state = const AuthState(
      status: AuthStatus.unauthenticated,
      errorMessage: 'Your session has expired. Please log in again.',
    );
  }
}

// -------------------------------------------------------------
// Riverpod Providers
// -------------------------------------------------------------

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

final authRepositoryProvider = Provider<IAuthRepository>((ref) {
  final storage = ref.watch(storageServiceProvider);

  if (ApiConfig.useMockData) {
    return MockAuthRepository(
      storageService: storage,
    );
  }

  return RemoteAuthRepository(
    storageService: storage,
    baseUrl: ApiConfig.defaultBaseUrl,
  );
});

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthNotifier(repo);
});

final currentWorkerProvider = Provider<Worker?>((ref) {
  return ref.watch(authStateProvider).worker;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authStateProvider).isAuthenticated;
});
