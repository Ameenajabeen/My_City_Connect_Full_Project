class ApiConfig {
  ApiConfig._();
  static const bool useMockData = false;
  static const String defaultBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3001');
  static const String defaultWebSocketUrl = String.fromEnvironment('API_WS_URL', defaultValue: 'ws://10.0.2.2:3001/tracking');
  static const Duration requestTimeout = Duration(seconds: 20);
}
