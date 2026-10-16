import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:google_maps_flutter/google_maps_flutter.dart';

class RouteResult {
  final List<LatLng> points;
  final int distanceMeters;
  final Duration duration;

  const RouteResult({
    required this.points,
    required this.distanceMeters,
    required this.duration,
  });
}

class RouteService {
  final String apiKey;

  RouteService({
    required this.apiKey,
  });

  Future<RouteResult?> getRoute({
    required LatLng origin,
    required LatLng destination,
  }) async {
    final uri = Uri.parse(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
    );

    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
            'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
      },
      body: jsonEncode({
        'origin': {
          'location': {
            'latLng': {
              'latitude': origin.latitude,
              'longitude': origin.longitude,
            },
          },
        },
        'destination': {
          'location': {
            'latLng': {
              'latitude': destination.latitude,
              'longitude': destination.longitude,
            },
          },
        },
        'travelMode': 'DRIVE',
        'routingPreference': 'TRAFFIC_AWARE',
      }),
    );

    if (response.statusCode != 200) {
      return null;
    }

    final data = jsonDecode(response.body);

    if (data['routes'] == null || data['routes'].isEmpty) {
      return null;
    }

    final route = data['routes'][0];

    final encodedPolyline =
        route['polyline']?['encodedPolyline'] as String?;

    if (encodedPolyline == null) {
      return null;
    }

    final points = _decodePolyline(encodedPolyline);

    final distanceMeters =
        (route['distanceMeters'] as num?)?.toInt() ?? 0;

    final durationString =
        route['duration'] as String? ?? '0s';

    final seconds =
        double.tryParse(durationString.replaceAll('s', '')) ?? 0;

    return RouteResult(
      points: points,
      distanceMeters: distanceMeters,
      duration: Duration(seconds: seconds.round()),
    );
  }

  List<LatLng> _decodePolyline(String encoded) {
    final points = <LatLng>[];

    int index = 0;
    int latitude = 0;
    int longitude = 0;

    while (index < encoded.length) {
      int shift = 0;
      int result = 0;

      while (true) {
        final byte = encoded.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;

        if (byte < 0x20) {
          break;
        }
      }

      final deltaLatitude =
          (result & 1) != 0
              ? ~(result >> 1)
              : (result >> 1);

      latitude += deltaLatitude;

      shift = 0;
      result = 0;

      while (true) {
        final byte = encoded.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;

        if (byte < 0x20) {
          break;
        }
      }

      final deltaLongitude =
          (result & 1) != 0
              ? ~(result >> 1)
              : (result >> 1);

      longitude += deltaLongitude;

      points.add(
        LatLng(
          latitude / 1e5,
          longitude / 1e5,
        ),
      );
    }

    return points;
  }
}