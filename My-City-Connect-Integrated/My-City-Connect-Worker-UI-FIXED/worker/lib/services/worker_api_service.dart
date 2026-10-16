import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../core/config/api_config.dart';
import '../core/services/storage_service.dart';
import '../models/task_model.dart';
import '../models/worker_model.dart';

class WorkerApiException implements Exception {
  final String message;
  const WorkerApiException(this.message);

  @override
  String toString() => message;
}

class WorkerApiService {
  final StorageService storage;
  final String baseUrl;

  WorkerApiService({StorageService? storage, String? baseUrl})
      : storage = storage ?? StorageService(),
        baseUrl = (baseUrl ?? ApiConfig.defaultBaseUrl).replaceFirst(
          RegExp(r'/$'),
          '',
        );

  Future<Map<String, String>> _headers() async {
    final token = await storage.getToken();
    if (token == null || token.isEmpty) {
      throw const WorkerApiException(
        'Your session has expired. Please sign in again.',
      );
    }
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  dynamic _unwrap(dynamic body) =>
      body is Map<String, dynamic> && body.containsKey('data')
          ? body['data']
          : body;

  Future<List<TaskModel>> getWorkerTasks(String workerId) async {
    final r = await http
        .get(
          Uri.parse('$baseUrl/workers/me/tasks'),
          headers: await _headers(),
        )
        .timeout(ApiConfig.requestTimeout);
    _ensureSuccess(r);
    final d = _unwrap(jsonDecode(r.body));
    if (d is! List) {
      throw const WorkerApiException('Invalid task response from server.');
    }
    return d
        .map((e) => TaskModel.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<TaskModel> updateTaskStatus(
    String taskId,
    String workerId,
    TaskStatus status,
  ) async {
    final tasks = await getWorkerTasks(workerId);
    final match = tasks.where((t) => t.id == taskId || t.assignmentId == taskId).toList();
    if (match.isEmpty) {
      throw const WorkerApiException('Task not found.');
    }
    final assignmentId = match.first.assignmentId ?? taskId;
    final apiStatus = status.apiValue;
    final path = apiStatus == 'ACCEPTED'
        ? '/assignments/$assignmentId/accept'
        : '/assignments/$assignmentId/status';
    final body = apiStatus == 'ACCEPTED' ? null : {'status': apiStatus};
    final r = await http
        .patch(
          Uri.parse('$baseUrl$path'),
          headers: await _headers(),
          body: body == null ? null : jsonEncode(body),
        )
        .timeout(ApiConfig.requestTimeout);
    _ensureSuccess(r);
    final refreshed = await getWorkerTasks(workerId);
    return refreshed.firstWhere(
      (t) => t.id == taskId || t.assignmentId == assignmentId,
    );
  }

  Future<Worker> getWorkerProfile(String workerId) async {
    final r = await http
        .get(
          Uri.parse('$baseUrl/workers/me'),
          headers: await _headers(),
        )
        .timeout(ApiConfig.requestTimeout);
    _ensureSuccess(r);
    final d = _unwrap(jsonDecode(r.body));
    return Worker.fromJson(Map<String, dynamic>.from(d as Map));
  }

  Future<void> updateAvailability(String workerId, bool isAvailable) async {
    final r = await http
        .patch(
          Uri.parse('$baseUrl/workers/availability'),
          headers: await _headers(),
          body: jsonEncode({'availability': isAvailable ? 'AVAILABLE' : 'OFFLINE'}),
        )
        .timeout(ApiConfig.requestTimeout);
    _ensureSuccess(r);
  }

  Future<void> updatePreferredLocation(String preferredLocation) async {
    final r = await http
        .patch(
          Uri.parse('$baseUrl/workers/preferred-location'),
          headers: await _headers(),
          body: jsonEncode({'preferredLocation': preferredLocation.trim()}),
        )
        .timeout(ApiConfig.requestTimeout);
    _ensureSuccess(r);
  }

  Future<void> sendLocation({
    required String workerId,
    required double latitude,
    required double longitude,
    double? accuracy,
    String? taskId,
  }) async {
    final r = await http
        .patch(
          Uri.parse('$baseUrl/workers/location'),
          headers: await _headers(),
          body: jsonEncode({
            'latitude': latitude,
            'longitude': longitude,
            if (accuracy != null) 'accuracy': accuracy,
            if (taskId != null) 'complaintId': taskId,
          }),
        )
        .timeout(ApiConfig.requestTimeout);
    _ensureSuccess(r);
  }

  Future<void> submitCompletionProof({
    required String taskId,
    required Uint8List imageBytes,
    required String fileName,
    required double latitude,
    required double longitude,
    required double accuracy,
    String? remarks,
  }) async {
    final token = await storage.getToken();
    if (token == null || token.isEmpty) {
      throw const WorkerApiException(
        'Your session has expired. Please sign in again.',
      );
    }

    final mimeType = _detectImageMimeType(imageBytes, fileName: fileName);
    if (mimeType == null) {
      throw const WorkerApiException(
        'Unsupported image format. Only JPEG, PNG, and WebP are allowed.',
      );
    }

    final req = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/complaints/$taskId/completion-proof'),
    );
    req.headers['Authorization'] = 'Bearer $token';
    req.fields['latitude'] = latitude.toString();
    req.fields['longitude'] = longitude.toString();
    req.fields['accuracy'] = accuracy.toString();
    if (remarks != null && remarks.trim().isNotEmpty) {
      req.fields['remarks'] = remarks.trim();
    }
    req.files.add(
      http.MultipartFile.fromBytes(
        'image',
        imageBytes,
        filename: fileName,
        contentType: MediaType.parse(mimeType),
      ),
    );

    final r = await req.send().timeout(ApiConfig.requestTimeout);
    final body = await r.stream.bytesToString();
    if (r.statusCode < 200 || r.statusCode >= 300) {
      String message = 'Unable to submit completion proof.';
      try {
        final d = jsonDecode(body);
        if (d['message'] is String) message = d['message'];
      } catch (_) {}
      throw WorkerApiException(message);
    }
  }

  String? _detectImageMimeType(Uint8List bytes, {String? fileName}) {
    if (bytes.length >= 3 &&
        bytes[0] == 0xFF &&
        bytes[1] == 0xD8 &&
        bytes[2] == 0xFF) {
      return 'image/jpeg';
    }

    if (bytes.length >= 8 &&
        bytes[0] == 0x89 &&
        bytes[1] == 0x50 &&
        bytes[2] == 0x4E &&
        bytes[3] == 0x47 &&
        bytes[4] == 0x0D &&
        bytes[5] == 0x0A &&
        bytes[6] == 0x1A &&
        bytes[7] == 0x0A) {
      return 'image/png';
    }

    if (bytes.length >= 12 &&
        bytes[0] == 0x52 &&
        bytes[1] == 0x49 &&
        bytes[2] == 0x46 &&
        bytes[3] == 0x46 &&
        bytes[8] == 0x57 &&
        bytes[9] == 0x45 &&
        bytes[10] == 0x42 &&
        bytes[11] == 0x50) {
      return 'image/webp';
    }

    final lower = (fileName ?? '').toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';

    return null;
  }

  void _ensureSuccess(http.Response r) {
    if (r.statusCode >= 200 && r.statusCode < 300) return;
    var message = 'Server request failed (${r.statusCode}).';
    try {
      final d = jsonDecode(r.body);
      final m = d['message'];
      if (m is String && m.isNotEmpty) message = m;
      if (m is List && m.isNotEmpty) message = m.join(', ');
    } catch (_) {}
    throw WorkerApiException(message);
  }
}

extension TaskStatusApiValue on TaskStatus {
  String get apiValue {
    switch (this) {
  case TaskStatus.assigned:
    return 'ASSIGNED';

  case TaskStatus.accepted:
    return 'ACCEPTED';

  case TaskStatus.onTheWay:
    return 'ON_THE_WAY';

  case TaskStatus.arrived:
    return 'ARRIVED';

  case TaskStatus.inRoute:
    return 'IN_ROUTE';

  case TaskStatus.inProgress:
    return 'IN_PROGRESS';

  case TaskStatus.resolved:
    return 'VERIFICATION';

  case TaskStatus.verification:
    return 'VERIFICATION';

  case TaskStatus.completed:
    return 'COMPLETED';

  case TaskStatus.rejected:
    return 'DECLINED';

  default:
    return 'ASSIGNED';
}
  }
}
