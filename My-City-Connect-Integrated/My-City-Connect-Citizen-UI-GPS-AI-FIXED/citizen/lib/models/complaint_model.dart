import '../services/api/api_endpoints.dart';

enum ComplaintStatus {
  submitted,
  verification,
  verified,
  assigned,
  workerAccepted,
  inProgress,
  workerCompleted,
  rework,
  resolved,
  rejected,
  closed,
}

enum ComplaintPriority {
  low,
  medium,
  high,
  critical,
}

enum IssueCategory {
  pothole,
  damagedRoad,
  streetlight,
  garbage,
  waterLeakage,
  drainage,
  strayAnimal,
  publicPropertyDamage,
  other,
}

class WorkerInfo {
  final String id;
  final String name;
  final String phone;
  final String department;
  final String status;
  final String? avatarUrl;
  final double? latitude;
  final double? longitude;
  final double? distanceKm;
  final double? rating;

  const WorkerInfo({
    required this.id,
    required this.name,
    required this.phone,
    required this.department,
    required this.status,
    this.avatarUrl,
    this.latitude,
    this.longitude,
    this.distanceKm,
    this.rating,
  });

  factory WorkerInfo.fromJson(Map<String, dynamic> json) {
    final user = json['user'] is Map ? Map<String, dynamic>.from(json['user'] as Map) : const <String, dynamic>{};
    return WorkerInfo(
      id: json['id'] as String? ?? '',
      name: (json['name'] ?? user['name']) as String? ?? '',
      phone: (json['phone'] ?? user['phone']) as String? ?? '',
      department: json['department'] is Map ? (json['department']['name']?.toString() ?? '') : json['department']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      avatarUrl: (json['avatarUrl'] ?? user['avatarUrl']) as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toDouble(),
    );
  }
}

class ComplaintFeedback {
  final String id;
  final int rating;
  final String? comment;
  final DateTime createdAt;

  const ComplaintFeedback({
    required this.id,
    required this.rating,
    this.comment,
    required this.createdAt,
  });

  factory ComplaintFeedback.fromJson(Map<String, dynamic> json) {
    return ComplaintFeedback(
      id: json['id']?.toString() ?? '',
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      comment: json['comment']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class ComplaintModel {
  final String id;
  final String citizenId;
  final String citizenName;
  final IssueCategory category;
  final String description;
  final String imageUrl;
  final double latitude;
  final double longitude;
  final String address;
  final String? ward;
  final ComplaintStatus status;
  final ComplaintPriority priority;
  final String? department;
  final String? workerId;
  final WorkerInfo? worker;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? completionProofUrl;
  final String? completionNotes;
  final ComplaintFeedback? feedback;

  ComplaintModel({
    required this.id,
    required this.citizenId,
    required this.citizenName,
    required this.category,
    required this.description,
    required this.imageUrl,
    required this.latitude,
    required this.longitude,
    required this.address,
    this.ward,
    required this.status,
    required this.priority,
    this.department,
    this.workerId,
    this.worker,
    required this.createdAt,
    required this.updatedAt,
    this.completionProofUrl,
    this.completionNotes,
    this.feedback,
  });

  factory ComplaintModel.fromJson(Map<String, dynamic> json) {
    final feedbackValue = json['feedback'] is Map ? json['feedback'] : (json['feedbacks'] is List && (json['feedbacks'] as List).isNotEmpty ? (json['feedbacks'] as List).first : null);
    return ComplaintModel(
      id: json['id'] as String,
      citizenId: json['citizenId'] as String? ?? '',
      citizenName: json['citizenName'] as String? ?? '',
      category: IssueCategory.values.firstWhere(
        (e) =>
            e.name.toLowerCase() ==
            (json['category'] as String? ?? '').replaceAll('_','').toLowerCase(),
        orElse: () => IssueCategory.other,
      ),
      description: json['description'] as String? ?? '',
      imageUrl: _url(json['imageUrl']?.toString() ?? ''),
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      address: json['address'] as String? ?? '',
      ward: json['ward'] as String?,
      status: _complaintStatusFromJson(
        json['status']?.toString(),
        (json['assignmentStatus'] ?? (json['assignments'] is List && (json['assignments'] as List).isNotEmpty
            ? (json['assignments'] as List).first['status']
            : null))?.toString(),
      ),
      priority: ComplaintPriority.values.firstWhere(
        (e) =>
            e.name.toLowerCase() ==
            (json['priority'] as String? ?? '').toLowerCase(),
        orElse: () => ComplaintPriority.medium,
      ),
      department: json['department'] is Map
          ? (json['department']['name']?.toString())
          : json['department']?.toString(),
      workerId: (json['workerId'] ?? json['assignedWorkerId'])?.toString(),
      worker: (json['worker'] ?? json['assignedWorker']) is Map
          ? WorkerInfo.fromJson(Map<String, dynamic>.from((json['worker'] ?? json['assignedWorker']) as Map))
          : null,
      createdAt: DateTime.parse(
          json['createdAt'] as String? ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(
          json['updatedAt'] as String? ?? DateTime.now().toIso8601String()),
      completionProofUrl: (json['completionPhotoUrl'] ?? json['completionProofUrl'] ?? json['resolutionProofUrl']) == null
          ? null
          : _url((json['completionPhotoUrl'] ?? json['completionProofUrl'] ?? json['resolutionProofUrl']).toString()),
      completionNotes: json['completionNotes']?.toString(),
      feedback: feedbackValue is Map ? ComplaintFeedback.fromJson(Map<String, dynamic>.from(feedbackValue)) : null,
    );
  }

  static ComplaintStatus _complaintStatusFromJson(String? value, String? assignmentStatus) {
    if (assignmentStatus?.toUpperCase() == 'ACCEPTED') return ComplaintStatus.workerAccepted;
    if (value?.toUpperCase() == 'WORKER_ASSIGNED') return ComplaintStatus.assigned;
    return ComplaintStatus.values.firstWhere(
      (status) => status.name.toLowerCase() == (value ?? '').replaceAll('_', '').toLowerCase(),
      orElse: () => ComplaintStatus.submitted,
    );
  }

  static String _url(String value) { if (value.startsWith('http')) return value; return '${ApiEndpoints.baseUrl}${value.startsWith('/') ? '' : '/'}$value'; }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'citizenId': citizenId,
      'citizenName': citizenName,
      'category': category.name,
      'description': description,
      'imageUrl': imageUrl,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'ward': ward,
      'status': status.name,
      'priority': priority.name,
      'department': department,
      'workerId': workerId,
      'worker': worker == null
          ? null
          : {
              'id': worker!.id,
              'name': worker!.name,
              'phone': worker!.phone,
              'department': worker!.department,
              'status': worker!.status,
              'avatarUrl': worker!.avatarUrl,
              'latitude': worker!.latitude,
              'longitude': worker!.longitude,
              'distanceKm': worker!.distanceKm,
              'rating': worker!.rating,
            },
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
