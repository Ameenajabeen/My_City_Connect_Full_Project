import 'package:flutter/material.dart';
import '../routes/app_routes.dart';
import '../theme/app_colors.dart';

class CitizenShell extends StatelessWidget {
  final int index;
  final Widget child;
  final bool showBack;
  final String? title;
  final VoidCallback? onRefresh;

  const CitizenShell({super.key, required this.index, required this.child, this.showBack=false, this.title, this.onRefresh});

  void _go(BuildContext context, int value) {
    final routes = [AppRoutes.home, AppRoutes.myComplaints, AppRoutes.reportIssue, AppRoutes.notifications, AppRoutes.profile];
    if (value == index) return;
    Navigator.pushNamedAndRemoveUntil(context, routes[value], (r) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: title == null ? null : AppBar(
        automaticallyImplyLeading: showBack,
        title: Text(title!, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        actions: [if (onRefresh != null) IconButton(onPressed: onRefresh, icon: const Icon(Icons.refresh_rounded))],
      ),
      body: child,
      floatingActionButton: FloatingActionButton(
        elevation: 5,
        backgroundColor: const Color(0xFF1769FF),
        foregroundColor: Colors.white,
        shape: const CircleBorder(),
        onPressed: () => Navigator.pushNamed(context, AppRoutes.reportIssue),
        child: const Icon(Icons.camera_alt_rounded, size: 21),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        height: 72,
        color: Colors.white,
        elevation: 14,
        shape: const CircularNotchedRectangle(),
        notchMargin: 7,
        child: Row(children: [
          _nav(context, Icons.home_rounded, 'Home', 0),
          _nav(context, Icons.description_outlined, 'Complaints', 1),
          const Expanded(child: SizedBox()),
          _nav(context, Icons.notifications_none_rounded, 'Alerts', 3),
          _nav(context, Icons.person_outline_rounded, 'Profile', 4),
        ]),
      ),
    );
  }

  Widget _nav(BuildContext context, IconData icon, String label, int value) {
    final selected = value == index;
    return Expanded(child: InkWell(onTap: () => _go(context, value), child: SizedBox(height: 70, child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(icon, size: 20, color: selected ? const Color(0xFF1769FF) : const Color(0xFF8792A2)),
      const SizedBox(height: 3),
      Text(label, style: TextStyle(fontSize: 10, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, color: selected ? const Color(0xFF1769FF) : const Color(0xFF8792A2))),
    ]))));
  }
}
