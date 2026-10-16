import 'worker_model.dart';

/// Active authenticated session container. Strictly excludes passwords.
class AuthSession {
  final String token;
  final Worker worker;
  final DateTime expiresAt;
  final bool rememberMe;

  const AuthSession({
    required this.token,
    required this.worker,
    required this.expiresAt,
    this.rememberMe = true,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'worker': worker.toJson(),
      'expiresAt': expiresAt.toIso8601String(),
      'rememberMe': rememberMe,
    };
  }

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      token: json['token'] as String,
      worker: Worker.fromJson(json['worker'] as Map<String, dynamic>),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      rememberMe: json['rememberMe'] as bool? ?? true,
    );
  }
}
