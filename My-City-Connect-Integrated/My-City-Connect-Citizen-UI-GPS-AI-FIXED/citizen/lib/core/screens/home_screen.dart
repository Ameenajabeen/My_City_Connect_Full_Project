import 'package:flutter/material.dart';
import '../../models/complaint_model.dart';
import '../../repositories/auth_repository.dart';
import '../../repositories/complaint_repository.dart';
import '../../services/api/api_client.dart';
import '../routes/app_routes.dart';
import '../theme/app_colors.dart';
import '../widgets/citizen_shell.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  UserModel? user;
  List<ComplaintModel> complaints = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ApiClient();
      user = await RealAuthRepository(api).getCurrentUser();
      complaints = await RealComplaintRepository(api).getMyComplaints();
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  int _count(ComplaintStatus s) =>
      complaints.where((c) => c.status == s).length;

  @override
  Widget build(BuildContext context) {
    final firstName = user?.name.trim().split(' ').first;
    final name = (firstName != null && firstName.isNotEmpty)
        ? firstName
        : 'Citizen';

    return CitizenShell(
      index: 0,
      child: SafeArea(
        top: true,
        bottom: false,
        child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: const Color(0xFF2E63F6),
                  child: Text(
                    name[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Hello, $name 👋',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'How can we help you today?',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Icon(Icons.notifications_none_rounded, size: 20),
                      if (complaints.isNotEmpty)
                        Positioned(
                          right: 7,
                          top: 6,
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            InkWell(
              onTap: () => Navigator.pushNamed(
                context,
                AppRoutes.reportIssue,
              ),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                height: 64,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF5B48F5), Color(0xFF3B4CF5)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x223B4CF5),
                      blurRadius: 12,
                      offset: Offset(0, 5),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .18),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.camera_alt_outlined,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'GPS CAMERA ACTION',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            'REPORT CIVIC ISSUE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: Colors.white,
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'YOUR ISSUE OVERVIEW',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  'Zone • Ward',
                  style: TextStyle(
                    fontSize: 9,
                    color: AppColors.textTertiary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _stat(
                  '${_count(ComplaintStatus.submitted) + _count(ComplaintStatus.verification)}',
                  'Pending',
                  const Color(0xFFF08A00),
                ),
                const SizedBox(width: 8),
                _stat(
                  '${_count(ComplaintStatus.inProgress) + _count(ComplaintStatus.workerCompleted)}',
                  'In Progress',
                  const Color(0xFF1769FF),
                ),
                const SizedBox(width: 8),
                _stat(
                  '${_count(ComplaintStatus.resolved)}',
                  'Resolved',
                  const Color(0xFF18A566),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _quick(
                  Icons.timeline_rounded,
                  'Track All',
                  () => Navigator.pushNamed(
                    context,
                    AppRoutes.myComplaints,
                  ),
                ),
                const SizedBox(width: 8),
                _quick(
                  Icons.auto_awesome_outlined,
                  'AI Help',
                  () => Navigator.pushNamed(
                    context,
                    AppRoutes.chatbot,
                  ),
                ),
                const SizedBox(width: 8),
                _quick(
                  Icons.notifications_none_rounded,
                  'Alerts',
                  () => Navigator.pushNamed(
                    context,
                    AppRoutes.notifications,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Complaints',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.pushNamed(
                    context,
                    AppRoutes.myComplaints,
                  ),
                  child: const Text(
                    'View All  ›',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            if (loading)
              const Padding(
                padding: EdgeInsets.all(30),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (complaints.isEmpty)
              _empty()
            else
              ...complaints.take(3).map(_complaintCard),
          ],
          ),
        ),
      ),
    );
  }

  Widget _stat(String value, String label, Color color) {
    return Expanded(
      child: Container(
        height: 58,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 9,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _quick(IconData icon, String text, VoidCallback onTap) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 36,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 15, color: const Color(0xFF3F68E9)),
              const SizedBox(width: 5),
              Text(
                text,
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _complaintCard(ComplaintModel c) {
    return InkWell(
      onTap: () => Navigator.pushNamed(
        context,
        AppRoutes.complaintDetails,
        arguments: c.id,
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(
                  Icons.construction_rounded,
                  size: 17,
                  color: Color(0xFF202A45),
                ),
                const SizedBox(width: 6),
                Text(
                  '#${c.id}',
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppColors.textTertiary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                _badge(
                  c.priority.name.toUpperCase(),
                  const Color(0xFFF8B84E),
                ),
                const SizedBox(width: 5),
                _badge(
                  _status(c.status),
                  const Color(0xFF2D8BEA),
                ),
              ],
            ),
            const SizedBox(height: 7),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _category(c.category),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(height: 3),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                c.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                  height: 1.35,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 12,
                  color: AppColors.textTertiary,
                ),
                const SizedBox(width: 3),
                Expanded(
                  child: Text(
                    c.address,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 9,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  size: 17,
                  color: AppColors.textTertiary,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .15),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 7,
          fontWeight: FontWeight.w900,
          color: color.withValues(alpha: .95),
        ),
      ),
    );
  }

  Widget _empty() {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: const Center(
        child: Text(
          'No complaints yet. Tap the camera button to report an issue.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  String _category(IssueCategory c) {
    return c.name
        .replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m.group(1)}')
        .replaceFirstMapped(
          RegExp(r'^.'),
          (m) => m.group(0)!.toUpperCase(),
        )
        .replaceAll('_', ' ');
  }

  String _status(ComplaintStatus s) {
    if (s == ComplaintStatus.inProgress) return 'IN PROGRESS';
    if (s == ComplaintStatus.workerCompleted) return 'WORK COMPLETED';
    return s.name.replaceAll('_', ' ').toUpperCase();
  }
}
