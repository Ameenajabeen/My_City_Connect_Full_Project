/// Application constants for MY CITY CONNECT - Worker Module
class AppConstants {
  AppConstants._();

  static const String appName = 'MY CITY CONNECT';
  static const String appTagline = 'Smart Civic Issue Management';
  static const String appModule = 'Worker Module';
  static const String appVersion = '1.0.0';

  // Role identifier
  static const String roleWorker = 'WORKER';

  // Storage Keys
  static const String keyAuthToken = 'mcc_auth_token';
  static const String keyWorkerSession = 'mcc_worker_session';
  static const String keyWorkerAvailability = 'mcc_worker_availability';
  static const String keyOfflineTasks = 'mcc_offline_tasks_cache';
  static const String keySettingsBaseUrl = 'mcc_settings_base_url';

  // Operational Defaults
  static const int defaultLocationUpdateIntervalSeconds = 30;
  static const double maxCompletionGpsDistanceMeters = 100.0;
}
