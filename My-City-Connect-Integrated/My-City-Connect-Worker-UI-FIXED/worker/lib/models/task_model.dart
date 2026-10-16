import '../core/config/api_config.dart';

enum TaskStatus {
  assigned,
  accepted,
  onTheWay,
  arrived,
  inRoute,
  inProgress,
  resolved,
  verification,
  completed,
  rejected,
}

class TaskModel {
  final String id;
  final String? assignmentId;
  final String title;
  final String description;
  final String category;
  final String department;
  final String address;
  final double latitude;
  final double longitude;
  final String priority;
  final double distance;
  final TaskStatus status;
  final String? citizenImage;
  final String? workerId;
  final DateTime? assignedAt;
  final DateTime? acceptedAt;
  final DateTime? arrivedAt;
  final DateTime? resolvedAt;
  final DateTime? completedAt;
  final int? citizenRating;
  final String? citizenFeedback;
  final DateTime? feedbackSubmittedAt;

  const TaskModel({
    required this.id,
    this.assignmentId,
    required this.title,
    required this.description,
    required this.category,
    required this.department,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.priority,
    required this.distance,
    required this.status,
    this.citizenImage,
    this.workerId,
    this.assignedAt,
    this.acceptedAt,
    this.arrivedAt,
    this.resolvedAt,
    this.completedAt,
    this.citizenRating,
    this.citizenFeedback,
    this.feedbackSubmittedAt,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    final feedbackValue = json['feedback'] ??
      (json['feedbacks'] is List && (json['feedbacks'] as List).isNotEmpty
        ? (json['feedbacks'] as List).first
        : null);
    final feedback = feedbackValue is Map
      ? Map<String, dynamic>.from(feedbackValue)
      : null;

    return TaskModel(
      id: (json['id'] ?? json['complaintId']).toString(),
      assignmentId: json['assignmentId']?.toString(),
      title: (json['title'] ?? 'Civic Complaint').toString(),
      description: (json['description'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      department: (json['department'] ?? '').toString(),
      address: (json['address'] ?? '').toString(),
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      priority: (json['priority'] ?? 'MEDIUM').toString().toLowerCase(),
      distance: (json['distance'] as num?)?.toDouble() ?? 0,
      status: _statusFromApi(json['status']?.toString()),
      citizenImage: _url(json['citizenImageUrl']?.toString()),
      workerId: json['workerId'] as String?,
      assignedAt: _date(json['assignedAt']),
      acceptedAt: _date(json['acceptedAt']),
      arrivedAt: _date(json['arrivedAt']),
      resolvedAt: _date(json['resolvedAt']),
      completedAt: _date(json['completedAt']),
      citizenRating: (feedback?['rating'] as num?)?.toInt(),
      citizenFeedback: feedback?['comment']?.toString(),
      feedbackSubmittedAt: _date(feedback?['createdAt']),
    );
  }

  static DateTime? _date(dynamic value) =>
      value == null ? null : DateTime.tryParse(value.toString());
  static String? _url(String? value) {
    if (value == null || value.isEmpty) return value;
    if (value.startsWith('http')) return value;
    return '${ApiConfig.defaultBaseUrl}${value.startsWith('/') ? '' : '/'}$value';
  }

  static TaskStatus _statusFromApi(String? value) {
    switch (value?.toUpperCase()) {
      case 'ACCEPTED':
        return TaskStatus.accepted;
      case 'ON_THE_WAY':
        return TaskStatus.onTheWay;
      case 'ARRIVED':
        return TaskStatus.arrived;
      case 'IN_ROUTE':
        return TaskStatus.inRoute;
      case 'IN_PROGRESS':
        return TaskStatus.inProgress;
      case 'WORKER_COMPLETED':
      case 'RESOLVED':
        return TaskStatus.resolved;
      case 'VERIFICATION':
        return TaskStatus.verification;
      case 'COMPLETED':
        return TaskStatus.completed;
      case 'REJECTED':
        return TaskStatus.rejected;
      default:
        return TaskStatus.assigned;
    }
  }

  TaskModel copyWith({TaskStatus? status, double? distance}) {
    return TaskModel(
      id: id,
      assignmentId: assignmentId,
      title: title,
      description: description,
      category: category,
      department: department,
      address: address,
      latitude: latitude,
      longitude: longitude,
      priority: priority,
      distance: distance ?? this.distance,
      status: status ?? this.status,
      citizenImage: citizenImage,
      workerId: workerId,
      assignedAt: assignedAt,
      acceptedAt: acceptedAt,
      arrivedAt: arrivedAt,
      resolvedAt: resolvedAt,
      completedAt: completedAt,
      citizenRating: citizenRating,
      citizenFeedback: citizenFeedback,
      feedbackSubmittedAt: feedbackSubmittedAt,
    );
  }
}
