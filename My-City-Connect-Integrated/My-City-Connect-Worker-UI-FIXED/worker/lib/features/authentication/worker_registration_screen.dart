import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/worker_department.dart';
import '../../providers/auth_provider.dart';
import '../../repositories/interfaces/i_auth_repository.dart';
import '../../shared_widgets/custom_button.dart';

class WorkerRegistrationScreen extends ConsumerStatefulWidget {
  const WorkerRegistrationScreen({super.key});

  @override
  ConsumerState<WorkerRegistrationScreen> createState() =>
      _WorkerRegistrationScreenState();
}

class _WorkerRegistrationScreenState
    extends ConsumerState<WorkerRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordFocusNode = FocusNode();
  List<WorkerDepartment> _departments = [];
  String? _departmentId;
  String? _errorMessage;
  bool _loadingDepartments = true;
  bool _isSubmitting = false;
  bool _obscurePassword = true;
  bool _registered = false;

  @override
  void initState() {
    super.initState();
    _loadDepartments();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  Future<void> _loadDepartments() async {
    try {
      final departments = await ref
          .read(authRepositoryProvider)
          .getDepartments();
      if (!mounted) return;
      setState(() {
        _departments = departments;
        _departmentId = departments.isNotEmpty ? departments.first.id : null;
        _loadingDepartments = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString();
        _loadingDepartments = false;
      });
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (_departmentId == null) {
      setState(
        () => _errorMessage = 'Select an active department to continue.',
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      await ref
          .read(authRepositoryProvider)
          .registerWorker(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text,
            departmentId: _departmentId!,
          );
      if (mounted) setState(() => _registered = true);
    } on AuthException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } catch (_) {
      if (mounted) {
        setState(
          () => _errorMessage = 'Registration failed. Please try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _goToLogin() {
    Navigator.pushReplacementNamed(
      context,
      AppRoutes.login,
      arguments: _emailController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceLight,
      appBar: AppBar(
        title: const Text('Create Worker Account'),
        backgroundColor: AppColors.surfaceLight,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(
                      Icons.badge_outlined,
                      size: 42,
                      color: AppColors.primary,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Worker Registration',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 23,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 22),
                    if (_errorMessage != null) ...[
                      _MessageBox(message: _errorMessage!, isError: true),
                      const SizedBox(height: 16),
                    ],
                    if (_registered) ...[
                      const _MessageBox(
                        message:
                            'Account created. Sign in with your email or Worker ID.',
                        isError: false,
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _nameController,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        labelText: 'Full name',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                          ? 'Enter your name.'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                      validator: (value) {
                        final email = value?.trim() ?? '';
                        return RegExp(
                              r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                            ).hasMatch(email)
                            ? null
                            : 'Enter a valid email address.';
                      },
                    ),
                    const SizedBox(height: 14),
                    if (_loadingDepartments)
                      const LinearProgressIndicator()
                    else if (_departments.isEmpty)
                      const _MessageBox(
                        message: 'No active departments are available.',
                        isError: true,
                      )
                    else
                      DropdownButtonFormField<String>(
                        initialValue: _departmentId,
                        decoration: const InputDecoration(
                          labelText: 'Department',
                          prefixIcon: Icon(Icons.business_outlined),
                        ),
                        items: _departments
                            .map(
                              (department) => DropdownMenuItem(
                                value: department.id,
                                child: Text(
                                  department.name,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) =>
                            setState(() => _departmentId = value),
                        validator: (value) =>
                            value == null ? 'Select a department.' : null,
                      ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _passwordController,
                      focusNode: _passwordFocusNode,
                      obscureText: _obscurePassword,
                      autofillHints: const [AutofillHints.newPassword],
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          tooltip: _obscurePassword
                              ? 'Show password'
                              : 'Hide password',
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                        ),
                      ),
                      validator: (value) => value == null || value.length < 6
                          ? 'Password must be at least 6 characters.'
                          : null,
                    ),
                    const SizedBox(height: 22),
                    CustomButton(
                      text: _registered ? 'Go to Login' : 'Create Account',
                      icon: _registered ? Icons.login : Icons.person_add_alt_1,
                      isLoading: _isSubmitting,
                      onPressed:
                          _isSubmitting ||
                              _loadingDepartments ||
                              _departments.isEmpty
                          ? null
                          : _registered
                          ? _goToLogin
                          : _register,
                    ),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: _goToLogin,
                      child: const Text('Already have an account? Login'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MessageBox extends StatelessWidget {
  const _MessageBox({required this.message, required this.isError});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final color = isError ? AppColors.error : AppColors.primary;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError ? AppColors.errorContainer : AppColors.primaryContainer,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color),
      ),
      child: Text(message, style: TextStyle(color: color, fontSize: 13)),
    );
  }
}
