import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:my_city_connect_worker/app.dart';
import 'package:my_city_connect_worker/core/constants/app_constants.dart';

void main() {
  testWidgets('App launches with Splash Screen showing App Title and Tagline', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MyCityConnectWorkerApp(),
      ),
    );

    // Verify Splash Screen contents
    expect(find.text(AppConstants.appName), findsOneWidget);
    expect(find.text(AppConstants.appTagline), findsOneWidget);
    expect(find.text('WORKER APPLICATION'), findsOneWidget);

    // Advance past splash timer to login screen
    await tester.pumpAndSettle(const Duration(seconds: 3));
    expect(find.text('Worker Sign In'), findsOneWidget);
  });
}
