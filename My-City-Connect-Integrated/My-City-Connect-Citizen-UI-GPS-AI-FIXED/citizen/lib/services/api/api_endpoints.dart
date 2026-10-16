class ApiEndpoints {
  ApiEndpoints._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001',
  );
  static const String wsUrl = String.fromEnvironment(
    'API_WS_URL',
    defaultValue: 'ws://10.0.2.2:3001/tracking',
  );

  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String currentUser = '/auth/me';
  static const String complaints = '/complaints';
  static const String myComplaints = '/complaints/my';
  static String complaintDetails(String id) => '/complaints/$id';
  static String complaintTimeline(String id) => '/complaints/$id/timeline';
  static String complaintFeedback(String id) => '/complaints/$id/feedback';
  static String completionProofs(String id) => '/complaints/$id/completion-proof';
  static const String feedback = '/feedback';
  static const String notifications = '/notifications';
  static const String chatbotMessage = '/chatbot/message';
  static const String upload = '/uploads';
  static const String aiVerify = '/ai/verify-image';
  static const String aiCheckDuplicate = '/ai/check-duplicate';
  static const String redZones = '/redzones';
  static const String departments = '/departments';
  static String tracking(String complaintId) => '/tracking/$complaintId';
}
