import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../core/theme/app_colors.dart';
import '../../shared_widgets/custom_button.dart';

class MapNavigationScreen extends StatefulWidget {
  const MapNavigationScreen({super.key});

  @override
  State<MapNavigationScreen> createState() => _MapNavigationScreenState();
}

class _MapNavigationScreenState extends State<MapNavigationScreen> {
  GoogleMapController? _mapController;

  // Complaint location: Indiranagar
  static const LatLng _complaintLocation = LatLng(
    12.9716,
    77.5946,
  );

  // Temporary worker location.
  // Later this will come directly from LocationService.
  static const LatLng _workerLocation = LatLng(
    12.9724,
    77.5806,
  );

  Set<Marker> get _markers {
    return {
      const Marker(
        markerId: MarkerId('worker'),
        position: _workerLocation,
        infoWindow: InfoWindow(
          title: 'Worker Location',
          snippet: 'Current worker position',
        ),
      ),
      const Marker(
        markerId: MarkerId('complaint'),
        position: _complaintLocation,
        infoWindow: InfoWindow(
          title: 'Complaint Location',
          snippet: 'Broken streetlight',
        ),
      ),
    };
  }

  void _fitMarkers() {
    if (_mapController == null) return;

    final bounds = LatLngBounds(
      southwest: LatLng(
        _workerLocation.latitude < _complaintLocation.latitude
            ? _workerLocation.latitude
            : _complaintLocation.latitude,
        _workerLocation.longitude < _complaintLocation.longitude
            ? _workerLocation.longitude
            : _complaintLocation.longitude,
      ),
      northeast: LatLng(
        _workerLocation.latitude > _complaintLocation.latitude
            ? _workerLocation.latitude
            : _complaintLocation.latitude,
        _workerLocation.longitude > _complaintLocation.longitude
            ? _workerLocation.longitude
            : _complaintLocation.longitude,
      ),
    );

    _mapController!.animateCamera(
      CameraUpdate.newLatLngBounds(bounds, 80),
    );
  }

  void _openNavigation() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Turn-by-turn navigation will be connected next.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const T('Map & Navigation'),
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: const CameraPosition(
              target: _complaintLocation,
              zoom: 14,
            ),
            markers: _markers,
            myLocationEnabled: false,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            onMapCreated: (controller) {
              _mapController = controller;

              Future.delayed(
                const Duration(milliseconds: 500),
                _fitMarkers,
              );
            },
          ),

          // Map controls
          Positioned(
            right: 16,
            top: 16,
            child: Column(
              children: [
                FloatingActionButton.small(
                  heroTag: 'zoom_in',
                  onPressed: () {
                    _mapController?.animateCamera(
                      CameraUpdate.zoomIn(),
                    );
                  },
                  child: const Icon(Icons.add),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: 'zoom_out',
                  onPressed: () {
                    _mapController?.animateCamera(
                      CameraUpdate.zoomOut(),
                    );
                  },
                  child: const Icon(Icons.remove),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: 'fit_markers',
                  onPressed: _fitMarkers,
                  child: const Icon(Icons.center_focus_strong),
                ),
              ],
            ),
          ),

          // Bottom information card
          Positioned(
            left: 16,
            right: 16,
            bottom: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceWhite,
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        color: AppColors.error,
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Complaint: 12th Main Road, Indiranagar',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(
                        Icons.person_pin_circle,
                        color: AppColors.secondary,
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Worker: 12.9724 N, 77.5806 E',
                          style: TextStyle(
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const T('Distance: approximately 1.2 km',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryDark,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  CustomButton(
                    text: 'Open Turn-by-Turn Navigation',
                    icon: Icons.navigation_rounded,
                    onPressed: _openNavigation,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}