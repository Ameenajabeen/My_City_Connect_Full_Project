import 'package:flutter/material.dart';

import '../../models/complaint_model.dart';
import '../../repositories/complaint_repository.dart';
import '../../services/api/api_client.dart';
import '../routes/app_routes.dart';
import '../theme/app_colors.dart';

class FeedbackScreen extends StatefulWidget {
  final String complaintId;

  const FeedbackScreen({
    super.key,
    required this.complaintId,
  });

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  int rating = 0;
  final TextEditingController commentController = TextEditingController();
  bool loading = false;
  bool checkingExisting = false;
  ComplaintFeedback? existingFeedback;

  @override
  void initState() {
    super.initState();
    _loadExisting();
  }

  Future<void> _loadExisting() async {
    setState(() => checkingExisting = true);
    try {
      final details = await RealComplaintRepository(ApiClient())
          .getComplaintById(widget.complaintId);
      if (mounted) {
        setState(() {
          existingFeedback = details.feedback;
          if (details.feedback != null) {
            rating = details.feedback!.rating;
            commentController.text = details.feedback!.comment ?? '';
          }
        });
      }
    } catch (_) {
      // Ignore and allow the user to submit a fresh rating.
    }

    if (mounted) {
      setState(() => checkingExisting = false);
    }
  }

  Future<void> _submit() async {
    if (rating == 0) return;

    setState(() => loading = true);
    try {
      await RealComplaintRepository(ApiClient()).submitFeedback(
        complaintId: widget.complaintId,
        rating: rating,
        comment: commentController.text.trim(),
      );
      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (_) => false);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }

    if (mounted) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (checkingExisting) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Resolution Feedback')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (existingFeedback != null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Your Rating')),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Your Rating',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  ...List.generate(
                    5,
                    (i) => Icon(
                      i < existingFeedback!.rating
                          ? Icons.star_rounded
                          : Icons.star_border_rounded,
                      size: 32,
                      color: i < existingFeedback!.rating
                          ? const Color(0xFFF5B63D)
                          : AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${existingFeedback!.rating}/5',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Text(
                'Your Feedback',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Text(
                existingFeedback!.comment?.trim().isNotEmpty == true
                    ? existingFeedback!.comment!
                    : 'No additional comments provided.',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Resolution Feedback')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'How satisfied were you with the resolution?',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                ...List.generate(
                  5,
                  (index) => GestureDetector(
                    onTap: () => setState(() => rating = index + 1),
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Icon(
                        index < rating
                            ? Icons.star_rounded
                            : Icons.star_border_rounded,
                        size: 32,
                        color: index < rating
                            ? const Color(0xFFF5B63D)
                            : AppColors.textTertiary,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text(
              'Additional feedback',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: commentController,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'Tell us how the resolution went...',
                fillColor: Colors.white,
                filled: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.cardBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.cardBorder),
                ),
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: loading || rating == 0 ? null : _submit,
                child: loading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Submit Feedback'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
