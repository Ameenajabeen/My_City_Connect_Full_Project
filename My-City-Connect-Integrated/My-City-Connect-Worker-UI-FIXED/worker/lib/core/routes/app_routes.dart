import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/splash/splash_screen.dart';
import '../../features/authentication/login_screen.dart';
import '../../features/authentication/worker_registration_screen.dart';
import '../../features/dashboard/worker_dashboard_screen.dart';
import '../../features/tasks/task_list_screen.dart';
import '../../features/tasks/task_details_screen.dart';
import '../../features/tasks/active_task_screen.dart';
import '../../features/tasks/task_provider.dart';
import '../../features/maps/map_navigation_screen.dart';
import '../../features/completion/completion_proof_screen.dart';
import '../../features/completion/verification_result_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/profile/worker_profile_screen.dart';
import '../../features/statistics/worker_statistics_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/ai_assistant/ai_assistant_screen.dart';

/// Centralized route definitions and generator for the Worker module
class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String dashboard = '/dashboard';
  static const String tasks = '/tasks';
  static const String taskDetails = '/task-details';
  static const String activeTask = '/active-task';
  static const String maps = '/maps';
  static const String completionProof = '/completion-proof';
  static const String verificationResult = '/verification-result';
  static const String notifications = '/notifications';
  static const String profile = '/profile';
  static const String statistics = '/statistics';
  static const String settings = '/settings';
  static const String aiAssistant = '/ai-assistant';

  static Route<dynamic> onGenerateRoute(RouteSettings routeSettings) {
    switch (routeSettings.name) {
      case splash:
        return MaterialPageRoute(
          builder: (_) => const SplashScreen(),
        );

      case login:
        return MaterialPageRoute(
          builder: (_) => LoginScreen(initialIdentifier: routeSettings.arguments as String?),
        );

      case register:
        return MaterialPageRoute(
          builder: (_) => const WorkerRegistrationScreen(),
        );

      case dashboard:
        return MaterialPageRoute(
          builder: (_) => const WorkerDashboardScreen(),
        );

      case tasks:
        return MaterialPageRoute(
          builder: (_) => const TaskListScreen(),
        );

      case taskDetails:
        final taskId = routeSettings.arguments as String?;
        if (taskId == null || taskId.isEmpty) {
          return MaterialPageRoute(builder: (_) => const Scaffold(body: Center(child: Text('Task ID is required'))));
        }

        return MaterialPageRoute(
          builder: (_) => TaskDetailsScreen(
            taskId: taskId,
          ),
        );

      case activeTask:
        final taskId = routeSettings.arguments as String?;
        if (taskId == null || taskId.isEmpty) {
          return MaterialPageRoute(builder: (_) => const Scaffold(body: Center(child: Text('Task ID is required'))));
        }

        return MaterialPageRoute(
          builder: (context) {
            final task = ProviderScope.containerOf(context)
                .read(taskProvider.notifier)
                .getTask(taskId);

            if (task == null) {
              return const Scaffold(
                body: Center(
                  child: Text('Task not found'),
                ),
              );
            }

            return ActiveTaskScreen(
              task: task,
            );
          },
        );

      case maps:
        return MaterialPageRoute(
          builder: (_) => const MapNavigationScreen(),
        );

      case completionProof:
        final taskId = routeSettings.arguments as String?;
        if (taskId == null || taskId.isEmpty) {
          return MaterialPageRoute(builder: (_) => const Scaffold(body: Center(child: Text('Task ID is required'))));
        }

        return MaterialPageRoute(
          builder: (_) => CompletionProofScreen(
            taskId: taskId,
          ),
        );

      case verificationResult:
        return MaterialPageRoute(
          builder: (_) => const VerificationResultScreen(),
        );

      case notifications:
        return MaterialPageRoute(
          builder: (_) => const NotificationsScreen(),
        );

      case profile:
        return MaterialPageRoute(
          builder: (_) => const WorkerProfileScreen(),
        );

      case statistics:
        return MaterialPageRoute(
          builder: (_) => const WorkerStatisticsScreen(),
        );

      case settings:
        return MaterialPageRoute(
          builder: (_) => const SettingsScreen(),
        );

      case aiAssistant:
        return MaterialPageRoute(
          builder: (_) => const AiAssistantScreen(),
        );

      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(
              title: const Text('Page Not Found'),
            ),
            body: Center(
              child: Text(
                'No route defined for ${routeSettings.name}',
              ),
            ),
          ),
        );
    }
  }
}