import 'package:flutter/material.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/home_screen.dart';
import '../screens/report_issue_screen.dart';
import '../screens/my_complaints_screen.dart';
import '../screens/complaint_details_screen.dart';
import '../screens/tracking_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/feedback_screen.dart';
import '../screens/gps_camera_screen.dart';
import '../screens/chatbot_screen.dart';
class AppRoutes{AppRoutes._();static const splash='/';static const login='/login';static const register='/register';static const home='/home';static const reportIssue='/report-issue';static const gpsCamera='/gps-camera';static const myComplaints='/my-complaints';static const complaintDetails='/complaint-details';static const liveTracking='/live-tracking';static const notifications='/notifications';static const chatbot='/chatbot';static const profile='/profile';static const feedback='/feedback';static Route<dynamic> onGenerateRoute(RouteSettings s){switch(s.name){case splash:return MaterialPageRoute(builder:(_)=>const SplashScreen());case login:return MaterialPageRoute(builder:(_)=>const LoginScreen());case register:return MaterialPageRoute(builder:(_)=>const RegisterScreen());case home:return MaterialPageRoute(builder:(_)=>const HomeScreen());case reportIssue:return MaterialPageRoute(builder:(_)=>const ReportIssueScreen());case gpsCamera:return MaterialPageRoute(builder:(_)=>const GpsCameraScreen());case myComplaints:return MaterialPageRoute(builder:(_)=>const MyComplaintsScreen());case complaintDetails:return MaterialPageRoute(builder:(_)=>ComplaintDetailsScreen(complaintId:s.arguments as String));case liveTracking:return MaterialPageRoute(builder:(_)=>TrackingScreen(complaintId:s.arguments as String));case notifications:return MaterialPageRoute(builder:(_)=>const NotificationsScreen());case profile:return MaterialPageRoute(builder:(_)=>const ProfileScreen());case feedback:return MaterialPageRoute(builder:(_)=>FeedbackScreen(complaintId:s.arguments as String));case chatbot:return MaterialPageRoute(builder:(_)=>const ChatbotScreen());default:return MaterialPageRoute(builder:(_)=>Scaffold(body:Center(child:Text('Route not found: ${s.name}'))));}}
}
