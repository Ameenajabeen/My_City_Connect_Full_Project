import '../models/complaint_model.dart';
import '../services/api/api_client.dart';
import '../services/api/api_endpoints.dart';

abstract class ComplaintRepository {
  Future<List<ComplaintModel>> getMyComplaints();
  Future<ComplaintModel> getComplaintById(String id);
  Future<List<Map<String, dynamic>>> getComplaintFeedback(String complaintId);
  Future<ComplaintModel> submitComplaint({
    required String category,
    required String description,
    required String imagePath,
    required double latitude,
    required double longitude,
    required String address,
    String? categorySource,
    String? aiDetectedCategory,
    double? aiConfidence,
    double? locationAccuracy,
  });
  Future<void> submitFeedback({
    required String complaintId,
    required int rating,
    String? comment,
  });
}

class RealComplaintRepository implements ComplaintRepository {
  final ApiClient apiClient;
  RealComplaintRepository(this.apiClient);

  Map<String, dynamic> _map(dynamic body) => Map<String, dynamic>.from(apiClient.unwrap(body) as Map);

  @override
  Future<List<ComplaintModel>> getMyComplaints() async {
    final response = await apiClient.get(ApiEndpoints.myComplaints);
    final data = _map(response.data);
    final items = (data['items'] as List? ?? const []);
    return items.map((json) => ComplaintModel.fromJson(Map<String, dynamic>.from(json as Map))).toList();
  }

  @override
  Future<ComplaintModel> getComplaintById(String id) async {
    final response = await apiClient.get(ApiEndpoints.complaintDetails(id));
    return ComplaintModel.fromJson(Map<String, dynamic>.from(apiClient.unwrap(response.data) as Map));
  }

  @override
  Future<List<Map<String, dynamic>>> getComplaintFeedback(String complaintId) async {
    final response = await apiClient.get(ApiEndpoints.complaintFeedback(complaintId));
    final data = apiClient.unwrap(response.data);
    if (data is! List) return const [];
    return data.map((item) => Map<String, dynamic>.from(item as Map)).toList();
  }

  @override
  Future<ComplaintModel> submitComplaint({
    required String category, required String description, required String imagePath,
    required double latitude, required double longitude, required String address,
    String? categorySource, String? aiDetectedCategory, double? aiConfidence, double? locationAccuracy,
  }) async {
    // Upload first so the common backend stores a durable URL, never a device-local path.
    final uploadResponse = await apiClient.uploadFile(ApiEndpoints.upload, filePath: imagePath, field: 'file');
    final uploadData = Map<String, dynamic>.from(apiClient.unwrap(uploadResponse.data) as Map);
    final imageUrl = uploadData['url']?.toString();
    if (imageUrl == null || imageUrl.isEmpty) throw Exception('Image upload failed');

    String? detectedCategory = aiDetectedCategory;
    double? confidence = aiConfidence;
    String? verificationStatus;

    // Reuse the existing AI endpoint when available. Failure is non-blocking so a citizen can still report an issue.
    try {
      final aiResponse = await apiClient.uploadFile(ApiEndpoints.aiVerify, filePath: imagePath, field: 'file');
      final aiData = Map<String, dynamic>.from(apiClient.unwrap(aiResponse.data) as Map);
      detectedCategory ??= aiData['detectedCategory']?.toString();
      confidence ??= (aiData['confidence'] as num?)?.toDouble();
      if (confidence != null) verificationStatus = confidence >= 0.70 ? 'VERIFIED' : 'LOW_CONFIDENCE';
    } catch (_) {
      // Keep AI verification pending if the optional AI service is offline.
    }

    final response = await apiClient.post(ApiEndpoints.complaints, data: {
      'category': category.toUpperCase(),
      'description': description,
      'imageUrl': imageUrl,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      if (categorySource != null) 'categorySource': categorySource.toUpperCase(),
      if (detectedCategory != null) 'aiDetectedCategory': detectedCategory.toUpperCase(),
      if (confidence != null) 'aiConfidence': confidence,
      if (verificationStatus != null) 'aiVerificationStatus': verificationStatus,
      if (locationAccuracy != null) 'locationAccuracy': locationAccuracy,
    });
    return ComplaintModel.fromJson(Map<String, dynamic>.from(apiClient.unwrap(response.data) as Map));
  }

  @override
  Future<void> submitFeedback({required String complaintId, required int rating, String? comment}) async {
    await apiClient.post(ApiEndpoints.feedback, data: {'complaintId': complaintId, 'rating': rating, 'comment': comment});
  }
}

class MockComplaintRepository implements ComplaintRepository {
  final List<ComplaintModel> _mockComplaints = [
    ComplaintModel(
      id: 'CMP1023',
      citizenId: 'CIT-7821',
      citizenName: 'Priya Sundaram',
      category: IssueCategory.pothole,
      description: 'Severe 2-ft pothole near Anna Nagar roundabout causing night accidents.',
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
      latitude: 13.0827,
      longitude: 80.2155,
      address: 'Anna Nagar 2nd Avenue, Near Roundabout, Chennai',
      ward: 'Ward 104, Zone 8',
      status: ComplaintStatus.inProgress,
      priority: ComplaintPriority.high,
      department: 'Roads & Infrastructure Maintenance',
      createdAt: DateTime.now().subtract(const Duration(hours: 6)),
      updatedAt: DateTime.now(),
      worker: const WorkerInfo(
        id: 'WRK-25',
        name: 'Arun Kumar',
        phone: '+91 98402 11234',
        department: 'Road Maintenance Dept',
        status: 'Driving Patch Repair Truck to Spot',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        latitude: 13.0855,
        longitude: 80.2180,
        distanceKm: 1.2,
        rating: 4.8,
      ),
    ),
    ComplaintModel(
      id: 'CMP1019',
      citizenId: 'CIT-7821',
      citizenName: 'Priya Sundaram',
      category: IssueCategory.streetlight,
      description: 'Streetlight pole #42 dark for 3 days.',
      imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
      latitude: 13.0890,
      longitude: 80.2110,
      address: '4th Main Road, Shanthi Colony, Chennai',
      ward: 'Ward 104, Zone 8',
      status: ComplaintStatus.assigned,
      priority: ComplaintPriority.medium,
      department: 'Electrical Engineering & Street Lighting',
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      updatedAt: DateTime.now(),
    ),
  ];

  @override
  Future<List<ComplaintModel>> getMyComplaints() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return List.from(_mockComplaints);
  }

  @override
  Future<ComplaintModel> getComplaintById(String id) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _mockComplaints.firstWhere((c) => c.id == id);
  }

  @override
  Future<List<Map<String, dynamic>>> getComplaintFeedback(
    String complaintId,
  ) async {
    return const [];
  }

  @override
  Future<ComplaintModel> submitComplaint({
    required String category,
    required String description,
    required String imagePath,
    required double latitude,
    required double longitude,
    required String address,
    String? categorySource,
    String? aiDetectedCategory,
    double? aiConfidence,
    double? locationAccuracy,
  }) async {
    await Future.delayed(const Duration(milliseconds: 600));
    final newComplaint = ComplaintModel(
      id: 'CMP${DateTime.now().millisecondsSinceEpoch % 10000}',
      citizenId: 'CIT-7821',
      citizenName: 'Priya Sundaram',
      category: IssueCategory.values.firstWhere(
        (e) => e.name.toLowerCase() == category.toLowerCase(),
        orElse: () => IssueCategory.other,
      ),
      description: description,
      imageUrl: imagePath,
      latitude: latitude,
      longitude: longitude,
      address: address,
      ward: 'Ward 104, Zone 8',
      status: ComplaintStatus.submitted,
      priority: ComplaintPriority.high,
      department: 'General Municipal Works',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    _mockComplaints.insert(0, newComplaint);
    return newComplaint;
  }

  @override
  Future<void> submitFeedback({
    required String complaintId,
    required int rating,
    String? comment,
  }) async {
    await Future.delayed(const Duration(milliseconds: 300));
  }
}
