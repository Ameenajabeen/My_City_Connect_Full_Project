import 'package:flutter_test/flutter_test.dart';
import 'package:my_city_connect_worker/core/constants/app_constants.dart';
import 'package:my_city_connect_worker/core/config/api_config.dart';
import 'package:my_city_connect_worker/core/theme/app_theme.dart';
import 'package:my_city_connect_worker/core/theme/app_colors.dart';
import 'package:my_city_connect_worker/core/routes/app_routes.dart';

void main() {
  group('Phase 1 - Configuration and Theme Tests', () {
    test('AppConstants contains correct branding and worker role', () {
      expect(AppConstants.appName, 'MY CITY CONNECT');
      expect(AppConstants.appModule, 'Worker Module');
      expect(AppConstants.roleWorker, 'WORKER');
      expect(AppConstants.defaultLocationUpdateIntervalSeconds, 30);
    });

    test('ApiConfig points to the common backend and mock mode is disabled', () {
      expect(ApiConfig.useMockData, isFalse);
      expect(ApiConfig.defaultBaseUrl, contains(':3001'));
    });

    test('AppTheme builds Material 3 theme with high-contrast palette', () {
      final theme = AppTheme.lightTheme;
      expect(theme.useMaterial3, isTrue);
      expect(theme.colorScheme.primary, AppColors.primary);
      expect(theme.scaffoldBackgroundColor, AppColors.surfaceLight);
    });

    test('AppRoutes defines all required screen routes', () {
      expect(AppRoutes.splash, '/');
      expect(AppRoutes.login, '/login');
      expect(AppRoutes.dashboard, '/dashboard');
      expect(AppRoutes.tasks, '/tasks');
      expect(AppRoutes.taskDetails, '/task-details');
      expect(AppRoutes.activeTask, '/active-task');
      expect(AppRoutes.maps, '/maps');
      expect(AppRoutes.completionProof, '/completion-proof');
      expect(AppRoutes.verificationResult, '/verification-result');
      expect(AppRoutes.notifications, '/notifications');
      expect(AppRoutes.profile, '/profile');
      expect(AppRoutes.statistics, '/statistics');
      expect(AppRoutes.settings, '/settings');
      expect(AppRoutes.aiAssistant, '/ai-assistant');
    });
  });
}
