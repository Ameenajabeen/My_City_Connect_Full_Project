import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

enum BadgeType { available, unavailable, urgent, high, medium, low, inProgress, resolved, completed }

/// Status badge indicator for task priorities, workflow statuses, and worker availability
class StatusBadge extends StatelessWidget {
  final String label;
  final BadgeType type;

  const StatusBadge({
    super.key,
    required this.label,
    required this.type,
  });

  @override
  Widget build(BuildContext context) {
    final style = _getBadgeStyle();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: style.backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: style.borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: style.textColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: style.textColor,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  _BadgeStyle _getBadgeStyle() {
    switch (type) {
      case BadgeType.available:
        return const _BadgeStyle(
          backgroundColor: AppColors.availableContainer,
          borderColor: AppColors.availableGreen,
          textColor: AppColors.availableGreen,
        );
      case BadgeType.unavailable:
        return const _BadgeStyle(
          backgroundColor: AppColors.unavailableContainer,
          borderColor: AppColors.unavailableRed,
          textColor: AppColors.unavailableRed,
        );
      case BadgeType.urgent:
        return const _BadgeStyle(
          backgroundColor: Color(0xFFFEE2E2),
          borderColor: AppColors.priorityUrgent,
          textColor: AppColors.priorityUrgent,
        );
      case BadgeType.high:
        return const _BadgeStyle(
          backgroundColor: Color(0xFFFFEDD5),
          borderColor: AppColors.priorityHigh,
          textColor: AppColors.priorityHigh,
        );
      case BadgeType.medium:
        return const _BadgeStyle(
          backgroundColor: Color(0xFFFEF3C7),
          borderColor: AppColors.priorityMedium,
          textColor: AppColors.priorityMedium,
        );
      case BadgeType.low:
        return const _BadgeStyle(
          backgroundColor: Color(0xFFF1F5F9),
          borderColor: AppColors.priorityLow,
          textColor: AppColors.priorityLow,
        );
      case BadgeType.inProgress:
        return const _BadgeStyle(
          backgroundColor: AppColors.secondaryContainer,
          borderColor: AppColors.secondary,
          textColor: AppColors.secondary,
        );
      case BadgeType.resolved:
      case BadgeType.completed:
        return const _BadgeStyle(
          backgroundColor: AppColors.successContainer,
          borderColor: AppColors.success,
          textColor: AppColors.success,
        );
    }
  }
}

class _BadgeStyle {
  final Color backgroundColor;
  final Color borderColor;
  final Color textColor;

  const _BadgeStyle({
    required this.backgroundColor,
    required this.borderColor,
    required this.textColor,
  });
}
