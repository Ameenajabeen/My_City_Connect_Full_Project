import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

class GpsCameraScreen extends StatefulWidget {
  const GpsCameraScreen({super.key});

  @override
  State<GpsCameraScreen> createState() => _GpsCameraScreenState();
}

class _GpsCameraScreenState extends State<GpsCameraScreen> with WidgetsBindingObserver {
  CameraController? _controller;
  Position? _position;
  String _address = 'Getting GPS location…';
  bool _loading = true;
  bool _capturing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) throw Exception('No camera is available on this device.');

      final backCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      final controller = CameraController(
        backCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );
      await controller.initialize();
      _controller = controller;
      await _refreshLocation();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    if (mounted) setState(() => _loading = false);
  }

  Future<void> _refreshLocation() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw Exception('Please enable GPS/location services.');
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      throw Exception('Location permission is required for GPS Camera.');
    }

    final position = await Geolocator.getCurrentPosition(
  desiredAccuracy: LocationAccuracy.high,
);

    var address = 'GPS location captured';
    try {
      final placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = <String?>[p.street, p.locality, p.administrativeArea]
            .where((value) => value != null && value.trim().isNotEmpty)
            .toList();
        if (parts.isNotEmpty) address = parts.join(', ');
      }
    } catch (_) {
      // GPS coordinates are still valid even if reverse geocoding is unavailable.
    }

    if (mounted) {
      setState(() {
        _position = position;
        _address = address;
        _error = null;
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;

    if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      controller.dispose();
      _controller = null;
    } else if (state == AppLifecycleState.resumed) {
      _initialize();
    }
  }

  Future<void> _capture() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized || _capturing) return;

    if (_position == null) {
      try {
        await _refreshLocation();
      } catch (e) {
        _showMessage(e.toString().replaceFirst('Exception: ', ''));
        return;
      }
    }

    setState(() => _capturing = true);
    try {
      final file = await controller.takePicture();
      if (!mounted) return;
      Navigator.pop(context, <String, dynamic>{
        'path': file.path,
        'latitude': _position?.latitude,
        'longitude': _position?.longitude,
        'accuracy': _position?.accuracy,
        'address': _address,
      });
    } catch (e) {
      _showMessage('Unable to capture the photo. Please try again.');
    } finally {
      if (mounted) setState(() => _capturing = false);
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (controller != null && controller.value.isInitialized)
              CameraPreview(controller)
            else
              const ColoredBox(color: Colors.black),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black54, Colors.transparent, Colors.black87],
                  stops: [0, .45, 1],
                ),
              ),
            ),
            Positioned(
              top: 12,
              left: 12,
              right: 12,
              child: Row(
                children: [
                  _roundButton(Icons.close_rounded, () => Navigator.pop(context)),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'GPS CAMERA',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                  ),
                  _roundButton(Icons.my_location_rounded, () async {
                    try {
                      await _refreshLocation();
                    } catch (e) {
                      _showMessage(e.toString().replaceFirst('Exception: ', ''));
                    }
                  }),
                ],
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 112,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: .65),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('GPS EVIDENCE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 5),
                    if (_position != null) ...[
                      Text(
                        '${_position!.latitude.toStringAsFixed(6)}, ${_position!.longitude.toStringAsFixed(6)}',
                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
                      ),
                      Text(
                        '±${_position!.accuracy.toStringAsFixed(1)} m  •  $_address',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white70, fontSize: 10),
                      ),
                    ] else
                      Text(_address, style: const TextStyle(color: Colors.white70, fontSize: 11)),
                  ],
                ),
              ),
            ),
            if (_loading)
              const Center(child: CircularProgressIndicator(color: Colors.white))
            else if (_error != null)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.location_off_rounded, color: Colors.white, size: 44),
                      const SizedBox(height: 12),
                      Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white)),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _initialize,
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('TRY AGAIN'),
                      ),
                    ],
                  ),
                ),
              ),
            Positioned(
              bottom: 22,
              left: 0,
              right: 0,
              child: Center(
                child: GestureDetector(
                  onTap: _capture,
                  child: Container(
                    width: 72,
                    height: 72,
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 3)),
                    child: Container(
                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                      child: _capturing
                          ? const Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.camera_alt_rounded, color: Color(0xFF1769FF), size: 28),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _roundButton(IconData icon, VoidCallback onTap) {
    return Material(
      color: Colors.black54,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Padding(padding: const EdgeInsets.all(10), child: Icon(icon, color: Colors.white, size: 20)),
      ),
    );
  }
}
