import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_endpoints.dart';

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiEndpoints.baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 20),
      headers: {'Accept': 'application/json'},
    ));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _secureStorage.read(key: 'jwt_token');
        if (token != null && token.isNotEmpty) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
    ));
  }

  Dio get dio => _dio;
  Future<void> saveToken(String token) => _secureStorage.write(key: 'jwt_token', value: token);
  Future<void> saveRefreshToken(String token) => _secureStorage.write(key: 'refresh_token', value: token);
  Future<String?> getRefreshToken() => _secureStorage.read(key: 'refresh_token');
  Future<void> clearToken() async {
    await _secureStorage.delete(key: 'jwt_token');
    await _secureStorage.delete(key: 'refresh_token');
  }

  dynamic unwrap(dynamic value) {
    if (value is Map<String, dynamic> && value.containsKey('data')) return value['data'];
    return value;
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) => _dio.get(path, queryParameters: queryParameters);
  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) => _dio.post(path, data: data, queryParameters: queryParameters);
  Future<Response> patch(String path, {dynamic data}) => _dio.patch(path, data: data);
  Future<Response> uploadFile(String path, {required String filePath, required String field, Map<String, dynamic>? data}) async {
    final fileName = filePath.split(Platform.pathSeparator).last;
    final formData = FormData.fromMap({if (data != null) ...data, field: await MultipartFile.fromFile(filePath, filename: fileName)});
    return _dio.post(path, data: formData);
  }
}
