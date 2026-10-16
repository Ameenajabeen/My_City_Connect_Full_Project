/// User roles in MY CITY CONNECT ecosystem
enum UserRole {
  citizen,
  worker,
  officer,
  admin;

  static UserRole fromString(String role) {
    switch (role.toUpperCase().trim()) {
      case 'WORKER':
        return UserRole.worker;
      case 'OFFICER':
        return UserRole.officer;
      case 'CITIZEN':
        return UserRole.citizen;
      case 'ADMIN':
        return UserRole.admin;
      default:
        throw ArgumentError('Unknown user role: ');
    }
  }

  String toRoleString() {
    switch (this) {
      case UserRole.worker:
        return 'WORKER';
      case UserRole.officer:
        return 'OFFICER';
      case UserRole.citizen:
        return 'CITIZEN';
      case UserRole.admin:
        return 'ADMIN';
    }
  }

  bool get isWorker => this == UserRole.worker;
}
