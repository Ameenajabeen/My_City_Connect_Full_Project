import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/worker_model.dart';
import '../../providers/auth_provider.dart';
import '../tasks/task_provider.dart';

class WorkerProfileScreen extends ConsumerStatefulWidget {
  const WorkerProfileScreen({super.key});

  @override
  ConsumerState<WorkerProfileScreen> createState() => _WorkerProfileScreenState();
}

class _WorkerProfileScreenState extends ConsumerState<WorkerProfileScreen> {
  Worker? _worker;
  final _preferredLocationController = TextEditingController();
  bool _savingPreferredLocation = false;
  String? _locationMessage;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _preferredLocationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final worker = _worker ?? ref.watch(currentWorkerProvider);
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      appBar: AppBar(
        title: const Text('Worker Profile', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900)),
      ),
      body: worker == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 36,
                        backgroundColor: const Color(0xFFE3F8EC),
                        child: Text(
                          worker.name.isEmpty ? 'W' : worker.name[0],
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF159A63)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(worker.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                      Text(worker.employeeId, style: const TextStyle(fontSize: 9, color: AppColors.textSecondary)),
                      const SizedBox(height: 8),
                      Chip(label: Text(worker.department, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700))),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _info('Employee ID', worker.employeeId, Icons.badge_outlined),
                _info('Department', worker.department, Icons.business_outlined),
                _info('Phone', worker.phone, Icons.phone_outlined),
                _info('Email', worker.email, Icons.email_outlined),
                _info('Assigned Zone', worker.assignedZone, Icons.location_city_outlined),
                _preferredLocation(),
                _info('Performance Rating', '${worker.rating.toStringAsFixed(1)} / 5.0', Icons.star_outline),
                _info('Completed Tasks', '${worker.completedTasksCount}', Icons.task_alt),
                _info('Availability', worker.isAvailable ? 'Available' : 'Unavailable', Icons.circle),
                const SizedBox(height: 12),
                SizedBox(
                  height: 46,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await ref.read(authStateProvider.notifier).logout();
                      if (!context.mounted) return;
                      Navigator.pushNamedAndRemoveUntil(context, AppRoutes.login, (_) => false);
                    },
                    icon: const Icon(Icons.logout, color: Color(0xFFE05252)),
                    label: const Text('Sign Out', style: TextStyle(color: Color(0xFFE05252), fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
    );
  }

  Future<void> _load() async {
    try {
      final x = await ref.read(workerApiServiceProvider).getWorkerProfile(ref.read(currentWorkerProvider)!.id);
      if (!mounted) return;
      setState(() => _worker = x);
      _preferredLocationController.text = x.preferredLocation ?? '';
    } catch (_) {}
  }

  Widget _info(String title, String value, IconData icon) => Container(
        margin: const EdgeInsets.only(bottom: 7),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Row(
          children: [
            Icon(icon, size: 17, color: AppColors.textSecondary),
            const SizedBox(width: 9),
            Expanded(child: Text(title, style: const TextStyle(fontSize: 9, color: AppColors.textTertiary))),
            Text(value, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700)),
          ],
        ),
      );

  Widget _preferredLocation() => Container(
        margin: const EdgeInsets.only(bottom: 7),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Preferred Working Location', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            TextField(
              controller: _preferredLocationController,
              maxLength: 160,
              decoration: const InputDecoration(hintText: 'Enter your preferred work area', counterText: ''),
            ),
            if (_locationMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  _locationMessage!,
                  style: TextStyle(fontSize: 11, color: _locationMessage!.startsWith('Saved') ? Colors.green : AppColors.error),
                ),
              ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton.icon(
                onPressed: _savingPreferredLocation ? null : _savePreferredLocation,
                icon: _savingPreferredLocation
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.save_outlined),
                label: const Text('Save Location'),
              ),
            ),
          ],
        ),
      );

  Future<void> _savePreferredLocation() async {
    final location = _preferredLocationController.text.trim();
    if (location.isEmpty) {
      setState(() => _locationMessage = 'Enter a preferred working location.');
      return;
    }
    setState(() => _savingPreferredLocation = true);
    try {
      final api = ref.read(workerApiServiceProvider);
      await api.updatePreferredLocation(location);
      final refreshed = await api.getWorkerProfile(ref.read(currentWorkerProvider)!.id);
      if (mounted) {
        setState(() {
          _worker = refreshed;
          _preferredLocationController.text = refreshed.preferredLocation ?? '';
          _locationMessage = 'Saved successfully.';
        });
      }
    } catch (error) {
      if (mounted) setState(() => _locationMessage = 'Unable to save: $error');
    } finally {
      if (mounted) setState(() => _savingPreferredLocation = false);
    }
  }
}
