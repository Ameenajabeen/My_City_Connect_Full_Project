import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/task_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/location_service.dart';
import '../tasks/task_provider.dart';

class WorkerDashboardScreen extends ConsumerStatefulWidget {
  const WorkerDashboardScreen({super.key});

  @override
  ConsumerState<WorkerDashboardScreen> createState() =>
      _WorkerDashboardScreenState();
}

class _WorkerDashboardScreenState
    extends ConsumerState<WorkerDashboardScreen> {
  final LocationService loc = LocationService();
  Position? position;
  bool available = false;
  bool loading = true;
  int nav = 0;

  @override
  void initState() {
    super.initState();
    Future.microtask(_init);
  }

  Future<void> _init() async {
    final w = ref.read(currentWorkerProvider);
    if (w == null) {
      if (mounted) setState(() => loading = false);
      return;
    }

    available = w.isAvailable;

    try {
      await ref.read(taskProvider.notifier).loadTasks();
      if (available) await _startGps();
    } catch (_) {}

    if (mounted) setState(() => loading = false);
  }

  Future<void> _startGps() async {
    if (!await loc.requestPermission()) return;

    final p = await loc.getCurrentLocation();
    if (p != null) {
      if (mounted) setState(() => position = p);
      await _send(p);
    }

    await loc.startTracking((p) async {
      if (!mounted) return;
      setState(() => position = p);
      await _send(p);
    });
  }

  Future<void> _send(Position p) async {
    final w = ref.read(currentWorkerProvider);
    if (w == null) return;

    final tasks = ref.read(taskProvider).where(
      (t) => !{TaskStatus.completed, TaskStatus.rejected}.contains(t.status),
    );

    try {
      await ref.read(workerApiServiceProvider).sendLocation(
            workerId: w.id,
            latitude: p.latitude,
            longitude: p.longitude,
            accuracy: p.accuracy,
            taskId: tasks.isEmpty ? null : tasks.first.id,
          );
    } catch (_) {}
  }

  Future<void> _toggle() async {
    final w = ref.read(currentWorkerProvider);
    if (w == null) return;

    final next = !available;

    if (next && !await loc.requestPermission()) {
      _msg('Location permission is required to go online.');
      return;
    }

    try {
      await ref.read(workerApiServiceProvider).updateAvailability(w.id, next);

      if (next) {
        await _startGps();
      } else {
        await loc.stopTracking();
      }

      if (mounted) setState(() => available = next);
    } catch (e) {
      _msg(e.toString());
    }
  }

  void _msg(String m) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(m)));
  }

  @override
  void dispose() {
    unawaited(loc.stopTracking());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = ref.watch(currentWorkerProvider);
    final tasks = ref.watch(taskProvider);
    final active = tasks
        .where((t) => !{
              TaskStatus.completed,
              TaskStatus.rejected,
            }.contains(t.status))
        .toList();
    final completed =
        tasks.where((t) => t.status == TaskStatus.completed).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      body: SafeArea(
        child: loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: () =>
                    ref.read(taskProvider.notifier).loadTasks(),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Worker Dashboard',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pushNamed(
                            context,
                            AppRoutes.notifications,
                          ),
                          icon: const Icon(
                            Icons.notifications_none_rounded,
                            size: 20,
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pushNamed(
                            context,
                            AppRoutes.settings,
                          ),
                          icon: const Icon(
                            Icons.settings_outlined,
                            size: 20,
                          ),
                        ),
                        IconButton(
                          onPressed: () => ref
                              .read(authStateProvider.notifier)
                              .logout()
                              .then(
                                (_) => Navigator.pushNamedAndRemoveUntil(
                                  context,
                                  AppRoutes.login,
                                  (_) => false,
                                ),
                              ),
                          icon: const Icon(
                            Icons.logout_rounded,
                            size: 19,
                            color: Color(0xFFE05252),
                          ),
                        ),
                      ],
                    ),
                    _header(w),
                    const SizedBox(height: 12),
                    _availability(),
                    const SizedBox(height: 12),
                    if (available) _gps(),
                    const SizedBox(height: 12),
                    _stats(tasks.length, active.length, completed),
                    const SizedBox(height: 14),
                    if (active.isNotEmpty) _task(active.first) else _empty(),
                  ],
                ),
              ),
      ),
      bottomNavigationBar: _bottom(),
    );
  }

  Widget _header(dynamic w) {
    final name = w?.name?.toString() ?? 'Worker';
    final initial = name.isEmpty ? 'W' : name.substring(0, 1).toUpperCase();

    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: const Color(0xFFE7F7EF),
            child: Text(
              initial,
              style: const TextStyle(
                color: Color(0xFF159A63),
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  'Employee ID: ${w?.employeeId ?? '—'}',
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  w?.department ?? '',
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  w?.assignedZone ?? '',
                  style: const TextStyle(
                    fontSize: 8,
                    color: AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _availability() {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: available
                  ? const Color(0xFFE3F8EC)
                  : const Color(0xFFF0F2F5),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.circle,
              size: 9,
              color: available
                  ? const Color(0xFF18A566)
                  : AppColors.textTertiary,
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  available ? 'AVAILABLE' : 'OFFLINE',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  available
                      ? 'Officer can assign new complaints to you.'
                      : 'Go online to receive assignments.',
                  style: const TextStyle(
                    fontSize: 8,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 34,
            child: FilledButton(
              onPressed: _toggle,
              style: FilledButton.styleFrom(
                backgroundColor: available
                    ? const Color(0xFFE85C5C)
                    : const Color(0xFF159A63),
                padding: const EdgeInsets.symmetric(horizontal: 14),
              ),
              child: Text(
                available ? 'Go Offline' : 'Go Online',
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _gps() {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.gps_fixed,
            color: Color(0xFF159A63),
            size: 18,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Live GPS',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  position == null
                      ? 'Waiting for location'
                      : '${position!.latitude.toStringAsFixed(6)}, '
                        '${position!.longitude.toStringAsFixed(6)}',
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (position != null)
                  Text(
                    'Accuracy: ${position!.accuracy.toStringAsFixed(1)} m',
                    style: const TextStyle(
                      fontSize: 8,
                      color: AppColors.textTertiary,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stats(int a, int b, int c) {
    return Row(
      children: [
        _stat('$a', 'Assigned', Icons.assignment_outlined),
        const SizedBox(width: 8),
        _stat('$b', 'Active', Icons.groups_outlined),
        const SizedBox(width: 8),
        _stat('$c', 'Completed', Icons.check_circle_outline),
      ],
    );
  }

  Widget _stat(String v, String l, IconData i) {
    return Expanded(
      child: Container(
        height: 70,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(i, size: 17, color: const Color(0xFF159A63)),
            const SizedBox(height: 3),
            Text(
              v,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w900,
              ),
            ),
            Text(
              l,
              style: const TextStyle(
                fontSize: 8,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _task(TaskModel t) {
    return InkWell(
      onTap: () => Navigator.pushNamed(
        context,
        AppRoutes.taskDetails,
        arguments: t.id,
      ),
      child: Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  t.id,
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textTertiary,
                  ),
                ),
                const Spacer(),
                _tag(_status(t.status)),
              ],
            ),
            const SizedBox(height: 7),
            Text(
              t.title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              t.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 9,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              t.address,
              style: const TextStyle(
                fontSize: 8,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 34,
              child: FilledButton(
                onPressed: () => Navigator.pushNamed(
                  context,
                  AppRoutes.taskDetails,
                  arguments: t.id,
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF159A63),
                ),
                child: const Text(
                  'Open Assigned Task',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _empty() {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.task_alt_rounded,
            size: 42,
            color: Color(0xFF159A63),
          ),
          SizedBox(height: 8),
          Text(
            'No assigned tasks',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'New complaints assigned by the officer will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 9,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _tag(String s) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFE3F8EC),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        s,
        style: const TextStyle(
          fontSize: 7,
          fontWeight: FontWeight.w900,
          color: Color(0xFF159A63),
        ),
      ),
    );
  }

  String _status(TaskStatus s) {
    if (s == TaskStatus.inProgress) return 'IN PROGRESS';
    return s.name.replaceAll(RegExp(r'([A-Z])'), ' ').toUpperCase();
  }

  Widget _bottom() {
    return BottomNavigationBar(
      currentIndex: nav,
      onTap: (i) {
        setState(() => nav = i);
        if (i == 1) {
          Navigator.pushNamed(context, AppRoutes.tasks);
        } else if (i == 2) {
          Navigator.pushNamed(context, AppRoutes.notifications);
        } else if (i == 3) {
          Navigator.pushNamed(context, AppRoutes.profile);
        }
      },
      type: BottomNavigationBarType.fixed,
      selectedItemColor: const Color(0xFF159A63),
      unselectedItemColor: AppColors.textTertiary,
      selectedFontSize: 9,
      unselectedFontSize: 8,
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard_outlined),
          label: 'Dashboard',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.assignment_outlined),
          label: 'My Tasks',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.notifications_none),
          label: 'Alerts',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          label: 'Profile',
        ),
      ],
    );
  }
}
