import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/task_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/location_service.dart';
import 'task_provider.dart';

class ActiveTaskScreen extends ConsumerStatefulWidget {
  final TaskModel task;
  const ActiveTaskScreen({super.key, required this.task});
  @override
  ConsumerState<ActiveTaskScreen> createState() => _ActiveTaskScreenState();
}

class _ActiveTaskScreenState extends ConsumerState<ActiveTaskScreen> {
  final LocationService loc = LocationService();
  GoogleMapController? _mapController;
  Position? p;
  bool tracking = false;
  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    if (await loc.requestPermission()) {
      final x = await loc.getCurrentLocation();
      if (x != null && mounted) {
        setState(() => p = x);
        await _sendPosition(x);
      }
      await loc.startTracking((x) {
        if (!mounted) return;
        setState(() => p = x);
        _sendPosition(x);
        _fitMap();
      });
      if (mounted) setState(() => tracking = true);
    }
  }

  Future<void> _sendPosition(Position position) async {
    final worker = ref.read(currentWorkerProvider);
    if (worker == null) return;
    try {
      await ref.read(workerApiServiceProvider).sendLocation(
            workerId: worker.id,
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            taskId: widget.task.id,
          );
    } catch (_) {
      // Keep the live map usable during temporary telemetry failures.
    }
  }

  Future<void> _fitMap() async {
    final controller = _mapController;
    final position = p;
    if (controller == null || position == null) return;
    final complaint = LatLng(widget.task.latitude, widget.task.longitude);
    final worker = LatLng(position.latitude, position.longitude);
    final bounds = LatLngBounds(
      southwest: LatLng(
        worker.latitude < complaint.latitude ? worker.latitude : complaint.latitude,
        worker.longitude < complaint.longitude ? worker.longitude : complaint.longitude,
      ),
      northeast: LatLng(
        worker.latitude > complaint.latitude ? worker.latitude : complaint.latitude,
        worker.longitude > complaint.longitude ? worker.longitude : complaint.longitude,
      ),
    );
    try {
      await controller.animateCamera(CameraUpdate.newLatLngBounds(bounds, 56));
    } catch (_) {
      await controller.animateCamera(CameraUpdate.newLatLngZoom(complaint, 15));
    }
  }

  @override
  void dispose() {
    loc.stopTracking();
    _mapController?.dispose();
    super.dispose();
  }

  double _distance() => p == null
      ? 0
      : Geolocator.distanceBetween(
          p!.latitude,
          p!.longitude,
          widget.task.latitude,
          widget.task.longitude,
        );
  Future<void> _status(TaskStatus s) async {
    final ok = await ref
        .read(taskProvider.notifier)
        .updateStatus(widget.task.id, s);
    if (!mounted) return;
    if (!ok) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Unable to update task.')));
    }
  }

  Widget _button(TaskStatus s) {
    switch (s) {
      case TaskStatus.assigned:
        return _btn('Accept Task', () => _status(TaskStatus.accepted));
      case TaskStatus.accepted:
        return _btn('Start Navigation', () => _status(TaskStatus.onTheWay));
      case TaskStatus.onTheWay:
        return _btn('Arrived at Location', () => _status(TaskStatus.arrived));
      case TaskStatus.arrived:
        return _btn('Start Repair', () => _status(TaskStatus.inProgress));
      case TaskStatus.inRoute:
        return _btn('Start Repair', () => _status(TaskStatus.inProgress));
      case TaskStatus.inProgress:
        return _btn('Mark Resolved & Add Proof', () async {
          final ok = await ref
              .read(taskProvider.notifier)
              .markResolved(widget.task.id);
          if (ok && mounted) {
            Navigator.pushNamed(
              context,
              AppRoutes.completionProof,
              arguments: widget.task.id,
            );
          }
        });
      case TaskStatus.resolved:
        return _btn(
          'Upload Completion Proof',
          () => Navigator.pushNamed(
            context,
            AppRoutes.completionProof,
            arguments: widget.task.id,
          ),
        );
      default:
        return const Text(
          'Waiting for officer verification',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: AppColors.textSecondary,
          ),
        );
    }
  }

  Widget _btn(String t, VoidCallback f) => SizedBox(
    width: double.infinity,
    height: 46,
    child: ElevatedButton(
      onPressed: f,
      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF159A63)),
      child: Text(
        t,
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
      ),
    ),
  );
  @override
  Widget build(BuildContext context) {
    final task =
        ref
            .watch(taskProvider)
            .where((x) => x.id == widget.task.id)
            .firstOrNull ??
        widget.task;
      final distanceMeters = _distance();
      final distanceText = distanceMeters < 1000
        ? '${distanceMeters.toStringAsFixed(0)} m'
        : '${(distanceMeters / 1000).toStringAsFixed(1)} km';
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      appBar: AppBar(
        title: const Text(
          'Active Task',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 20),
        children: [
          Container(
            margin: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFE2F8ED),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFB8E8D0)),
            ),
            child: Row(
              children: [
                const Icon(Icons.circle, size: 9, color: Color(0xFF159A63)),
                const SizedBox(width: 6),
                Text(
                  task.status == TaskStatus.resolved
                      ? 'WAITING FOR PROOF'
                      : task.status.name.replaceAll('_', ' ').toUpperCase(),
                  style: const TextStyle(
                    fontSize: 9,
                    color: Color(0xFF159A63),
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const Spacer(),
                if (tracking)
                  const Text(
                    'LIVE',
                    style: TextStyle(
                      fontSize: 8,
                      color: Color(0xFF159A63),
                      fontWeight: FontWeight.w900,
                    ),
                  ),
              ],
            ),
          ),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            height: 300,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(15),
              color: const Color(0xFFDDE9E1),
              border: Border.all(color: AppColors.cardBorder),
            ),
            clipBehavior: Clip.antiAlias,
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: LatLng(task.latitude, task.longitude),
                zoom: 15,
              ),
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
              zoomControlsEnabled: false,
              markers: {
                Marker(
                  markerId: const MarkerId('complaint'),
                  position: LatLng(task.latitude, task.longitude),
                  infoWindow: InfoWindow(title: task.category, snippet: task.address),
                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
                ),
                if (p != null)
                  Marker(
                    markerId: const MarkerId('worker'),
                    position: LatLng(p!.latitude, p!.longitude),
                    infoWindow: const InfoWindow(title: 'Your current location'),
                    icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
                  ),
              },
              onMapCreated: (controller) {
                _mapController = controller;
                _fitMap();
              },
            ),
          ),
          Container(
            margin: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.route_rounded,
                  size: 22,
                  color: Color(0xFF159A63),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Route to Complaint',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        'Distance: $distanceText',
                        style: const TextStyle(
                          fontSize: 9,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      Text(
                        'Address: ${task.address}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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
          ),
          Container(
            margin: const EdgeInsets.fromLTRB(16, 4, 16, 10),
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Live Location',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                Text(
                  p == null
                      ? 'Waiting for GPS'
                      : 'Lat: ${p!.latitude.toStringAsFixed(6)}\nLng: ${p!.longitude.toStringAsFixed(6)}\nDistance to complaint: ${_distance().toStringAsFixed(0)} m',
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _button(task.status),
          ),
        ],
      ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

