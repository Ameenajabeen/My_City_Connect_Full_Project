import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme/app_colors.dart';
import '../../shared_widgets/custom_card.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifications = [
      {
        'title': 'New Urgent Task Assigned',
        'message': 'Officer Sharma assigned CMP1023 (Streetlight hazard) to you.',
        'time': '10 mins ago',
        'isRead': false,
        'icon': Icons.assignment_late,
        'color': AppColors.priorityUrgent,
      },
      {
        'title': 'Completion Proof Approved',
        'message': 'AI and Officer verified CMP1021 completion proof.',
        'time': '2 hours ago',
        'isRead': true,
        'icon': Icons.verified,
        'color': AppColors.success,
      },
      {
        'title': 'Daily Duty Reminder',
        'message': 'Ensure your availability is set to AVAILABLE during shift hours.',
        'time': '4 hours ago',
        'isRead': true,
        'icon': Icons.info_outline,
        'color': AppColors.secondary,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const T('Notifications'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: notifications.length,
        itemBuilder: (context, index) {
          final item = notifications[index];
          return CustomCard(
            backgroundColor: (item['isRead'] as bool) ? AppColors.surfaceWhite : const Color(0xFFF0FDF4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: (item['color'] as Color).withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title'] as String,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item['message'] as String,
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item['time'] as String,
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
