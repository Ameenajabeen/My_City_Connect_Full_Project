import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/task_model.dart';
import 'task_provider.dart';

class TaskDetailsScreen extends ConsumerWidget {
  final String taskId;

  const TaskDetailsScreen({super.key, required this.taskId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final task = ref
        .watch(taskProvider)
        .where((item) => item.id == taskId || item.assignmentId == taskId)
        .firstOrNull;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      appBar: AppBar(
        title: const Text(
          'Task Details',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
        ),
      ),
      body: task == null
          ? const Center(child: Text('Task not found'))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  task.id,
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppColors.textTertiary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  task.title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  task.description,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 14),
                _card('Complaint Information', [
                  ['Category', task.category],
                  ['Department', task.department],
                  ['Priority', task.priority.toUpperCase()],
                ]),
                const SizedBox(height: 12),
                _card('Location', [
                  ['Address', task.address],
                  [
                    'GPS',
                    '${task.latitude.toStringAsFixed(5)}, ${task.longitude.toStringAsFixed(5)}',
                  ],
                  [
                    'Distance',
                    task.distance > 0
                        ? '${task.distance.toStringAsFixed(1)} km'
                        : '—',
                  ],
                ]),
                if (task.citizenRating != null ||
                    (task.citizenFeedback?.trim().isNotEmpty ?? false)) ...[
                  const SizedBox(height: 12),
                  _feedbackCard(task),
                ],
                const SizedBox(height: 14),
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pushNamed(
                      context,
                      AppRoutes.activeTask,
                      arguments: task.id,
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF159A63),
                    ),
                    child: const Text(
                      'CONTINUE TASK',
                      style: TextStyle(fontWeight: FontWeight.w900),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _feedbackCard(TaskModel task) {
    final rating = task.citizenRating;
    final comment = task.citizenFeedback?.trim();

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'CITIZEN FEEDBACK',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900),
          ),
          if (rating != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                ...List.generate(
                  5,
                  (index) => Icon(
                    index < rating ? Icons.star_rounded : Icons.star_border_rounded,
                    size: 20,
                    color: index < rating
                        ? const Color(0xFFF5B63D)
                        : AppColors.textTertiary,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '$rating/5',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ],
          if (comment != null && comment.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              comment,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
          ],
          if (task.feedbackSubmittedAt != null) ...[
            const SizedBox(height: 8),
            Text(
              'Submitted: ${task.feedbackSubmittedAt!.toLocal()}',
              style: const TextStyle(
                fontSize: 9,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _card(String title, List<List<String>> rows) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
            const SizedBox(height: 10),
            ...rows.map(
              (row) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        row[0],
                        style: const TextStyle(
                          fontSize: 9,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Text(
                        row[1],
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
