import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../models/complaint_model.dart';
import '../../repositories/complaint_repository.dart';
import '../../services/api/api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/citizen_shell.dart';

class TrackingScreen extends StatefulWidget {
  final String complaintId;
  const TrackingScreen({super.key, required this.complaintId});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  final ApiClient _apiClient = ApiClient();
  ComplaintModel? c;
  GoogleMapController? _mapController;
  Timer? _locationTimer;
  LatLng? _workerLocation;
  bool _trackingAvailable = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      c = await RealComplaintRepository(_apiClient)
          .getComplaintById(widget.complaintId);
      final worker = c?.worker;
      if (_validCoordinate(worker?.latitude, worker?.longitude)) {
        _workerLocation = LatLng(worker!.latitude!, worker.longitude!);
        _trackingAvailable = true;
      }
      if (mounted) setState(() {});
      await _loadWorkerLocation();
      _locationTimer ??= Timer.periodic(
        const Duration(seconds: 5),
        (_) => _loadWorkerLocation(),
      );
    } catch (_) {
      if (mounted) setState(() {});
    }
  }

  Future<void> _loadWorkerLocation() async {
    try {
      final response = await _apiClient.get(
        '/tracking/complaint/${widget.complaintId}',
      );
      final payload = _apiClient.unwrap(response.data);
      if (payload is! Map) return;

      final workerValue = payload['worker'] ?? payload['location'];
      LatLng? nextLocation;
      if (workerValue is Map &&
          _validCoordinate(workerValue['latitude'], workerValue['longitude'])) {
        nextLocation = LatLng(
          (workerValue['latitude'] as num).toDouble(),
          (workerValue['longitude'] as num).toDouble(),
        );
      }

      if (!mounted) return;
      final changed = nextLocation != _workerLocation;
      setState(() {
        _workerLocation = nextLocation;
        _trackingAvailable = nextLocation != null;
      });
      if (changed && nextLocation != null) _fitMap();
    } catch (_) {
      if (!_trackingAvailable && mounted) setState(() {});
    }
  }

  bool _validCoordinate(dynamic latitude, dynamic longitude) {
    if (latitude is! num || longitude is! num) return false;
    return latitude.isFinite &&
        longitude.isFinite &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180;
  }

  LatLng get _complaintLocation => LatLng(c!.latitude, c!.longitude);

  void _fitMap() {
    final map = _mapController;
    final complaint = c;
    if (map == null || complaint == null) return;

    final worker = _workerLocation;
    if (worker == null || worker == _complaintLocation) {
      map.animateCamera(CameraUpdate.newLatLngZoom(_complaintLocation, 15));
      return;
    }

    final latitudeDelta =
        (_complaintLocation.latitude - worker.latitude).abs() * 111320;
    final longitudeDelta =
        (_complaintLocation.longitude - worker.longitude).abs() *
            111320 *
            math.cos(_complaintLocation.latitude * math.pi / 180);
    final distanceMeters = math.sqrt(
      latitudeDelta * latitudeDelta + longitudeDelta * longitudeDelta,
    );
    if (distanceMeters < 150) {
      map.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(
            (_complaintLocation.latitude + worker.latitude) / 2,
            (_complaintLocation.longitude + worker.longitude) / 2,
          ),
          16,
        ),
      );
      return;
    }

    map.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(
            _complaintLocation.latitude < worker.latitude
                ? _complaintLocation.latitude
                : worker.latitude,
            _complaintLocation.longitude < worker.longitude
                ? _complaintLocation.longitude
                : worker.longitude,
          ),
          northeast: LatLng(
            _complaintLocation.latitude > worker.latitude
                ? _complaintLocation.latitude
                : worker.latitude,
            _complaintLocation.longitude > worker.longitude
                ? _complaintLocation.longitude
                : worker.longitude,
          ),
        ),
        48,
      ),
    );
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CitizenShell(
      index: 1,
      title: 'Live Worker Tracking',
      showBack: true,
      onRefresh: _load,
      child: c == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  height: 270,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE7EFF6),
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    children: [
                      GoogleMap(
                        initialCameraPosition: CameraPosition(
                          target: _complaintLocation,
                          zoom: 15,
                        ),
                        onMapCreated: (controller) {
                          _mapController = controller;
                          _fitMap();
                        },
                        markers: {
                          Marker(
                            markerId: const MarkerId('complaint-location'),
                            position: _complaintLocation,
                            infoWindow: const InfoWindow(
                              title: 'Complaint location',
                            ),
                            icon: BitmapDescriptor.defaultMarkerWithHue(
                              BitmapDescriptor.hueAzure,
                            ),
                          ),
                          if (_workerLocation != null)
                            Marker(
                              markerId: const MarkerId('assigned-worker'),
                              position: _workerLocation!,
                              infoWindow: InfoWindow(
                                title: c!.worker?.name ?? 'Assigned worker',
                              ),
                              icon: BitmapDescriptor.defaultMarkerWithHue(
                                BitmapDescriptor.hueRed,
                              ),
                            ),
                        },
                        myLocationButtonEnabled: false,
                        zoomControlsEnabled: false,
                      ),
                      if (!_trackingAvailable)
                        Positioned(
                          top: 12,
                          left: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.94),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'Worker location unavailable',
                              style: TextStyle(
                                fontSize: 9,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Container(
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
                        'ASSIGNED WORKER',
                        style: TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textTertiary,
                        ),
                      ),
                      const SizedBox(height: 7),
                      Text(
                        c!.worker?.name ?? 'Worker assigned',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      Text(
                        c!.worker?.department ?? '',
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _trackingAvailable
                            ? 'Live location updated every 5 seconds'
                            : 'Waiting for live location',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Color(0xFF1769FF),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
