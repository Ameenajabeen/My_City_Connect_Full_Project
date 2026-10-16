import 'user_role.dart';

/// Worker profile model for authenticated municipal workers
class Worker {
  final String id;
  final String employeeId;
  final String name;
  final String email;
  final String phone;
  final String department;
  final String assignedZone;
  final String? preferredLocation;
  final UserRole role;
  final bool isAvailable;
  final double? currentLatitude;
  final double? currentLongitude;
  final double rating;
  final int completedTasksCount;
  final String? profilePhotoUrl;

  const Worker({
    required this.id,
    required this.employeeId,
    required this.name,
    required this.email,
    required this.phone,
    required this.department,
    required this.assignedZone,
    this.preferredLocation,
    this.role = UserRole.worker,
    this.isAvailable = true,
    this.currentLatitude,
    this.currentLongitude,
    this.rating = 4.8,
    this.completedTasksCount = 42,
    this.profilePhotoUrl,
  });

  Worker copyWith({
    String? id,
    String? employeeId,
    String? name,
    String? email,
    String? phone,
    String? department,
    String? assignedZone,
    String? preferredLocation,
    UserRole? role,
    bool? isAvailable,
    double? currentLatitude,
    double? currentLongitude,
    double? rating,
    int? completedTasksCount,
    String? profilePhotoUrl,
  }) {
    return Worker(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      department: department ?? this.department,
      assignedZone: assignedZone ?? this.assignedZone,
      preferredLocation: preferredLocation ?? this.preferredLocation,
      role: role ?? this.role,
      isAvailable: isAvailable ?? this.isAvailable,
      currentLatitude: currentLatitude ?? this.currentLatitude,
      currentLongitude: currentLongitude ?? this.currentLongitude,
      rating: rating ?? this.rating,
      completedTasksCount: completedTasksCount ?? this.completedTasksCount,
      profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employeeId': employeeId,
      'name': name,
      'email': email,
      'phone': phone,
      'department': department,
      'assignedZone': assignedZone,
      'preferredLocation': preferredLocation,
      'role': role.toRoleString(),
      'isAvailable': isAvailable,
      'currentLatitude': currentLatitude,
      'currentLongitude': currentLongitude,
      'rating': rating,
      'completedTasksCount': completedTasksCount,
      'profilePhotoUrl': profilePhotoUrl,
    };
  }

  factory Worker.fromJson(Map<String, dynamic> json) {
    return Worker(
      id: json['id'] as String,
      employeeId: json['employeeId'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String,
      department: json['department'] as String,
      assignedZone: json['assignedZone'] as String,
      preferredLocation: json['preferredLocation'] as String?,
      role: UserRole.fromString(json['role'] as String? ?? 'WORKER'),
      isAvailable: json['isAvailable'] as bool? ?? true,
      currentLatitude: (json['currentLatitude'] as num?)?.toDouble(),
      currentLongitude: (json['currentLongitude'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toDouble() ?? 4.8,
      completedTasksCount: json['completedTasksCount'] as int? ?? 0,
      profilePhotoUrl: json['profilePhotoUrl'] as String?,
    );
  }
}
