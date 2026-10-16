import 'package:flutter/material.dart';

/// High-visibility civic color palette tailored for municipal field workers.
class AppColors {
  AppColors._();

  // Primary Civic Green (Municipal Governance)
  static const Color primary = Color(0xFF15803D); // Green 700
  static const Color primaryDark = Color(0xFF166534); // Green 800
  static const Color primaryLight = Color(0xFF22C55E); // Green 500
  static const Color primaryContainer = Color(0xFFDCFCE7); // Green 100

  // Secondary Civic Blue (Navigation & Systems)
  static const Color secondary = Color(0xFF0369A1); // Sky 700
  static const Color secondaryDark = Color(0xFF075985); // Sky 800
  static const Color secondaryContainer = Color(0xFFE0F2FE); // Sky 100

  // Worker Availability Status
  static const Color availableGreen = Color(0xFF16A34A);
  static const Color availableContainer = Color(0xFFDCFCE7);
  static const Color unavailableRed = Color(0xFFDC2626);
  static const Color unavailableContainer = Color(0xFFFEE2E2);

  // Task Priority Colors
  static const Color priorityUrgent = Color(0xFFB91C1C); // Deep Red
  static const Color priorityHigh = Color(0xFFEA580C); // Amber Orange
  static const Color priorityMedium = Color(0xFFCA8A04); // Yellow Amber
  static const Color priorityLow = Color(0xFF475569); // Slate Grey

  // Surfaces & Backgrounds (High outdoor contrast)
  static const Color surfaceLight = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color borderSubtle = Color(0xFFCBD5E1);

  // Text Colors
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900
  static const Color textSecondary = Color(0xFF475569); // Slate 600
  static const Color textMuted = Color(0xFF64748B); // Slate 500
  // Backward-compatible aliases used by existing worker screens.
  static const Color textTertiary = textMuted;
  static const Color cardBorder = borderLight;
  static const Color textWhite = Color(0xFFFFFFFF);

  // Feedback Colors
  static const Color error = Color(0xFFDC2626);
  static const Color errorContainer = Color(0xFFFEE2E2);
  static const Color warning = Color(0xFFD97706);
  static const Color warningContainer = Color(0xFFFEF3C7);
  static const Color success = Color(0xFF15803D);
  static const Color successContainer = Color(0xFFDCFCE7);
}
