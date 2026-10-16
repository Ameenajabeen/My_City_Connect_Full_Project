import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../tasks/task_provider.dart';

class CompletionProofScreen extends ConsumerStatefulWidget {
  final String taskId;

  const CompletionProofScreen({super.key, required this.taskId});

  @override
  ConsumerState<CompletionProofScreen> createState() =>
      _CompletionProofScreenState();
}

class _CompletionProofScreenState extends ConsumerState<CompletionProofScreen> {
  Uint8List? bytes;
  Position? pos;
  bool capturing = false;
  bool submitting = false;
  final remarks = TextEditingController();
  double? distance;

  Future<void> _capture() async {
    setState(() => capturing = true);

    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw Exception('Enable GPS on your phone.');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('Location permission is required.');
      }

      final x = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      final task = ref.read(taskProvider.notifier).getTask(widget.taskId);

      if (task != null) {
        distance = Geolocator.distanceBetween(
          x.latitude,
          x.longitude,
          task.latitude,
          task.longitude,
        );
      }

      final img = await ImagePicker().pickImage(
        source: ImageSource.camera,
        imageQuality: 88,
      );

      if (img == null) return;

      bytes = await img.readAsBytes();
      pos = x;
    } catch (e) {
      _msg(e.toString());
    } finally {
      if (mounted) setState(() => capturing = false);
    }
  }

  Future<void> _submit() async {
    if (bytes == null || pos == null) {
      _msg('Capture the completion photo and GPS first.');
      return;
    }

    if ((distance ?? 99999) > 100) {
      _msg('You must be within 100 meters of the complaint location.');
      return;
    }

    setState(() => submitting = true);

    try {
      await ref
          .read(workerApiServiceProvider)
          .submitCompletionProof(
            taskId: widget.taskId,
            imageBytes: bytes!,
            fileName:
                'completion_${widget.taskId}_${DateTime.now().millisecondsSinceEpoch}.jpg',
            latitude: pos!.latitude,
            longitude: pos!.longitude,
            accuracy: pos!.accuracy,
            remarks: remarks.text,
          );

      await ref.read(taskProvider.notifier).loadTasks();

      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          AppRoutes.verificationResult,
          arguments: {
            'taskId': widget.taskId,
            'gpsVerified': true,
            'distanceMeters': distance,
          },
        );
      }
    } catch (e) {
      _msg(e.toString());
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  void _msg(String s) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(s)));
  }

  @override
  void dispose() {
    remarks.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final task = ref.read(taskProvider.notifier).getTask(widget.taskId);
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      appBar: AppBar(
        title: Text(
          'Completion Proof: ${widget.taskId}',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Photo Evidence',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _photo(false, task?.citizenImage)),
                    const SizedBox(width: 10),
                    Expanded(child: _photo(true, null)),
                  ],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 38,
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: capturing ? null : _capture,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF0A79B2),
                    ),
                    icon: const Icon(Icons.camera_alt_outlined, size: 17),
                    label: Text(
                      capturing
                          ? 'Opening camera...'
                          : 'Capture Completion Photo',
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.gps_fixed_rounded,
                  color: Color(0xFF159A63),
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Real-Time GPS Verification',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        pos == null
                            ? 'GPS will be captured with the completion photo.'
                            : '${pos!.latitude.toStringAsFixed(6)}, '
                                  '${pos!.longitude.toStringAsFixed(6)}  •  '
                                  '${distance?.toStringAsFixed(1) ?? '—'} m from complaint',
                        style: const TextStyle(
                          fontSize: 8,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: remarks,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Worker Remarks / Completion Notes',
              hintText: 'Describe the work completed...',
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 48,
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: submitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF159A63),
              ),
              icon: const Icon(Icons.send_rounded, size: 17),
              label: submitting
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'SUBMIT COMPLETION PROOF',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _photo(bool after, String? beforePhotoUrl) {
    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: !after && beforePhotoUrl != null && beforePhotoUrl.isNotEmpty
          ? ClipRRect(
              borderRadius: BorderRadius.circular(9),
              child: Image.network(
                beforePhotoUrl,
                fit: BoxFit.cover,
                width: double.infinity,
                errorBuilder: (_, __, ___) => const Center(
                  child: Text('Photo unavailable', style: TextStyle(fontSize: 9, color: AppColors.textTertiary)),
                ),
              ),
            )
          : after && bytes != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(9),
              child: Image.memory(
                bytes!,
                fit: BoxFit.cover,
                width: double.infinity,
              ),
            )
          : Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  after ? Icons.camera_alt_outlined : Icons.image_outlined,
                  size: 30,
                  color: after
                      ? const Color(0xFF159A63)
                      : AppColors.textTertiary,
                ),
                const SizedBox(height: 5),
                Text(
                  after && bytes != null
                      ? 'AFTER CAPTURED'
                      : after
                      ? 'AFTER • Not captured'
                        : after
                          ? 'AFTER • Not captured'
                          : 'Photo unavailable',
                  style: const TextStyle(
                    fontSize: 8,
                    color: AppColors.textTertiary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
    );
  }
}
