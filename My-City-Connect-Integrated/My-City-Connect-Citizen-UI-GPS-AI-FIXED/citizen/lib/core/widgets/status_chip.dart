import 'package:flutter/material.dart';
import '../../models/complaint_model.dart';
import '../theme/app_colors.dart';

class StatusChip extends StatelessWidget {
  final ComplaintStatus status;

  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case ComplaintStatus.submitted:
        bg = AppColors.statusSubmitted.withValues(alpha: 0.12);
        fg = AppColors.statusSubmitted;
        label = 'SUBMITTED';
        break;
      case ComplaintStatus.verification:
        bg = AppColors.statusVerification.withValues(alpha: 0.12);
        fg = AppColors.statusVerification;
        label = 'AI VERIFYING';
        break;
      case ComplaintStatus.verified:
        bg = AppColors.statusVerified.withValues(alpha: 0.12);
        fg = AppColors.statusVerified;
        label = 'VERIFIED';
        break;
      case ComplaintStatus.assigned:
        bg = AppColors.statusAssigned.withValues(alpha: 0.12);
        fg = AppColors.statusAssigned;
        label = 'ASSIGNED';
        break;
      case ComplaintStatus.workerAccepted:
      case ComplaintStatus.workerCompleted:
      case ComplaintStatus.rework:
      case ComplaintStatus.inProgress:
        bg = AppColors.statusInProgress.withValues(alpha: 0.12);
        fg = AppColors.statusInProgress;
        label = 'IN PROGRESS';
        break;
      case ComplaintStatus.resolved:
        bg = AppColors.statusResolved.withValues(alpha: 0.12);
        fg = AppColors.statusResolved;
        label = 'RESOLVED';
        break;
      case ComplaintStatus.rejected:
        bg = AppColors.statusRejected.withValues(alpha: 0.12);
        fg = AppColors.statusRejected;
        label = 'REJECTED';
        break;
      case ComplaintStatus.closed:
        bg = Colors.grey.withValues(alpha: 0.12);
        fg = Colors.black54;
        label = 'CLOSED';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: fg,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: fg,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
