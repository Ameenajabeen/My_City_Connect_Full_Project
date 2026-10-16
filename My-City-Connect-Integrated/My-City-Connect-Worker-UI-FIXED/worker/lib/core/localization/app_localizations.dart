import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;
  const AppLocalizations(this.locale);

  static const supportedLocales = [Locale('en'), Locale('ta'), Locale('hi')];

  static AppLocalizations of(BuildContext context) =>
      Localizations.of<AppLocalizations>(context, AppLocalizations)!;

  String t(String text) {
    final direct = _translations[locale.languageCode]?[text];
    if (direct != null) return direct;

    // Dynamic labels keep their values while translating the fixed prefix.
    const dynamicPrefixes = <String, Map<String, String>>{
      'ta': {
        'Distance: ': 'தூரம்: ',
        'Estimated time: ': 'மதிப்பிடப்பட்ட நேரம்: ',
        'Distance to complaint: ': 'புகாரிடத்திற்கான தூரம்: ',
        'Lat: ': 'அட்சரேகை: ',
        'Lng: ': 'தீர்க்கரேகை: ',
        'Employee ID: ': 'பணியாளர் ID: ',
        'Department: ': 'துறை: ',
      },
      'hi': {
        'Distance: ': 'दूरी: ',
        'Estimated time: ': 'अनुमानित समय: ',
        'Distance to complaint: ': 'शिकायत से दूरी: ',
        'Lat: ': 'अक्षांश: ',
        'Lng: ': 'देशांतर: ',
        'Employee ID: ': 'कर्मचारी ID: ',
        'Department: ': 'विभाग: ',
      },
    };

    final prefixes = dynamicPrefixes[locale.languageCode];
    if (prefixes != null) {
      for (final entry in prefixes.entries) {
        if (text.startsWith(entry.key)) {
          return '${entry.value}${text.substring(entry.key.length)}';
        }
      }
    }
    return text;
  }

  static const Map<String, Map<String, String>> _translations = {
    'ta': {
      'Worker Sign In': 'பணியாளர் உள்நுழைவு',
      'Municipal Field Operations Portal': 'நகராட்சி களப்பணி தளம்',
      'Employee ID / Username': 'பணியாளர் ID / பயனர் பெயர்',
      'Password': 'கடவுச்சொல்',
      'Remember Session': 'அமர்வை நினைவில் கொள்',
      'Login to Dashboard': 'டாஷ்போர்டில் உள்நுழைக',
      'Worker Dashboard': 'பணியாளர் டாஷ்போர்டு',
      'Dashboard': 'டாஷ்போர்டு',
      'My Tasks': 'என் பணிகள்',
      'Alerts': 'அறிவிப்புகள்',
      'Profile': 'சுயவிவரம்',
      'Settings & Configuration': 'அமைப்புகள் மற்றும் கட்டமைப்பு',
      'Language': 'மொழி',
      'English': 'ஆங்கிலம்',
      'Tamil': 'தமிழ்',
      'Hindi': 'இந்தி',
      'Mock Data Mode': 'Mock தரவு முறை',
      'Enable local offline mock repositories': 'உள்ளூர் ஆஃப்லைன் mock தரவை இயக்கு',
      'API Base URL': 'API அடிப்படை URL',
      'GPS Update Interval': 'GPS புதுப்பிப்பு இடைவெளி',
      '30 seconds (configurable)': '30 விநாடிகள் (மாற்றக்கூடியது)',
      'Worker Profile': 'பணியாளர் சுயவிவரம்',
      'Phone': 'தொலைபேசி',
      'Email': 'மின்னஞ்சல்',
      'Assigned Zone': 'ஒதுக்கப்பட்ட மண்டலம்',
      'Performance Rating': 'செயல்திறன் மதிப்பீடு',
      'Employee ID': 'பணியாளர் ID',
      'Department': 'துறை',
      'Completed Tasks': 'முடிக்கப்பட்ட பணிகள்',
      'Availability': 'கிடைக்கும் நிலை',
      'Available': 'கிடைக்கிறது',
      'Unavailable': 'கிடைக்கவில்லை',
      'Showing the last authenticated worker details.': 'கடைசியாக உள்நுழைந்த பணியாளர் விவரங்கள் காட்டப்படுகின்றன.',
      'Sign Out': 'வெளியேறு',
      'Active Task': 'செயலில் உள்ள பணி',
      'TASK ASSIGNED': 'பணி ஒதுக்கப்பட்டது',
      'TASK ACCEPTED': 'பணி ஏற்கப்பட்டது',
      'ON THE WAY': 'வழியில்',
      'ARRIVED': 'வந்துவிட்டார்',
      'REPAIR IN PROGRESS': 'பழுதுபார்ப்பு நடைபெறுகிறது',
      'WAITING FOR PROOF': 'ஆதாரத்திற்காக காத்திருக்கிறது',
      'WAITING FOR OFFICER': 'அதிகாரிக்காக காத்திருக்கிறது',
      'COMPLETED': 'முடிக்கப்பட்டது',
      'REJECTED': 'நிராகரிக்கப்பட்டது',
      'LIVE': 'நேரலை',
      'Route to Complaint': 'புகார் இடத்திற்கான பாதை',
      'Live Location': 'நேரடி இருப்பிடம்',
      'Accept Task': 'பணியை ஏற்கவும்',
      'Start Navigation': 'வழிசெலுத்தலை தொடங்கவும்',
      'Travel to the complaint location': 'புகார் இடத்திற்குச் செல்லவும்',
      'Start Repair': 'பழுதுபார்ப்பை தொடங்கவும்',
      'Mark Resolved & Add Proof': 'தீர்வு எனக் குறிட்டு ஆதாரம் சேர்க்கவும்',
      'Upload Completion Proof': 'முடிப்பு ஆதாரத்தை பதிவேற்றவும்',
      'Task completed successfully.': 'பணி வெற்றிகரமாக முடிக்கப்பட்டது.',
      'Task rejected. Please contact the officer.': 'பணி நிராகரிக்கப்பட்டது. அதிகாரியை தொடர்பு கொள்ளவும்.',
      'Waiting for officer verification': 'அதிகாரி சரிபார்ப்புக்காக காத்திருக்கிறது',
      'Completion proof submitted. Waiting for officer verification.': 'முடிப்பு ஆதாரம் சமர்ப்பிக்கப்பட்டது. அதிகாரி சரிபார்ப்புக்காக காத்திருக்கிறது.',
      'You have arrived at the complaint location.': 'நீங்கள் புகார் இடத்தை அடைந்துவிட்டீர்கள்.',
      'Arrived at Location': 'இடத்தை அடைந்துவிட்டேன்',
      'Use this if the map pin or GPS is inaccurate.': 'வரைபட இடம்காட்டி அல்லது GPS துல்லியமாக இல்லாவிட்டால் இதைப் பயன்படுத்தவும்.',
      'Task Details': 'பணி விவரங்கள்',
      'Complaint Information': 'புகார் தகவல்',
      'Location': 'இருப்பிடம்',
      'Category': 'வகை',
      'Priority': 'முன்னுரிமை',
      'Address': 'முகவரி',
      'GPS': 'GPS',
      'Continue Task': 'பணியை தொடரவும்',
      'Task Completed': 'பணி முடிந்தது',
      'No tasks found': 'பணிகள் எதுவும் இல்லை',
      'Notifications': 'அறிவிப்புகள்',
      'Performance Statistics': 'செயல்திறன் புள்ளிவிவரங்கள்',
      'Worker Performance Summary': 'பணியாளர் செயல்திறன் சுருக்கம்',
      'Today Completed:': 'இன்று முடிக்கப்பட்டது:',
      'Weekly Completed:': 'வாரத்தில் முடிக்கப்பட்டது:',
      'Monthly Completed:': 'மாதத்தில் முடிக்கப்பட்டது:',
      'Average Completion Time:': 'சராசரி முடிப்பு நேரம்:',
      'AI Worker Assistant': 'AI பணியாளர் உதவியாளர்',
      'Language changed': 'மொழி மாற்றப்பட்டது',
      'WORKER APPLICATION': 'பணியாளர் பயன்பாடு',
      'Test Accounts (Role Validation):': 'சோதனை கணக்குகள் (பங்கு சரிபார்ப்பு):',
      'ROLE: WORKER': 'பங்கு: பணியாளர்',
      'ALL': 'அனைத்தும்',
      'PENDING': 'நிலுவையில்',
      'ACTIVE': 'செயலில்',
      'DONE': 'முடிந்தது',
      'Assigned': 'ஒதுக்கப்பட்டது',
      'Accepted': 'ஏற்கப்பட்டது',
      'On the Way': 'வழியில்',
      'Arrived': 'வந்துவிட்டார்',
      'In Progress': 'நடைபெறுகிறது',
      'Resolved': 'தீர்க்கப்பட்டது',
      'Verification': 'சரிபார்ப்பு',
      'Completed': 'முடிக்கப்பட்டது',
      'Rejected': 'நிராகரிக்கப்பட்டது',
      'Distance': 'தூரம்',
      'Photo Evidence': 'புகைப்பட ஆதாரம்',
      'Real-Time GPS Verification': 'நிகழ்நேர GPS சரிபார்ப்பு',
      'GPS will be captured together with the completion photo.': 'முடிப்பு புகைப்படத்துடன் GPS பதிவு செய்யப்படும்.',
      'Open Assigned Task': 'ஒதுக்கப்பட்ட பணியை திறக்கவும்',
      'No active tasks': 'செயலில் பணிகள் இல்லை',
      'New complaints assigned by an officer will appear here.': 'அதிகாரி ஒதுக்கும் புதிய புகார்கள் இங்கே தோன்றும்.',
      'View My Tasks': 'என் பணிகளை பார்க்கவும்',
      'You are now available. GPS tracking is active.': 'நீங்கள் இப்போது கிடைக்கிறீர்கள். GPS கண்காணிப்பு செயல்பாட்டில் உள்ளது.',
      'You are now unavailable.': 'நீங்கள் இப்போது கிடைக்கவில்லை.',
      'Location permission is required to become available.': 'கிடைக்க இருப்பிட அனுமதி தேவை.',
      'Unable to update task. Please check the server and try again.': 'பணியை புதுப்பிக்க முடியவில்லை. சேவையகத்தை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
      'Unable to mark the task resolved.': 'பணியை தீர்க்கப்பட்டதாக குறிக்க முடியவில்லை.',
      'Location permission is required for live task tracking.': 'நிகழ்நேர பணி கண்காணிப்புக்கு இருப்பிட அனுமதி தேவை.',
      'Unable to start live location tracking.': 'நிகழ்நேர இருப்பிட கண்காணிப்பை தொடங்க முடியவில்லை.',
      'Hello Arun! I am your My City Connect Field Assistant. Ask me about your tasks, priorities, or today\'s schedule.': 'வணக்கம்! நான் உங்கள் My City Connect களப்பணி உதவியாளர். உங்கள் பணிகள், முன்னுரிமைகள் அல்லது இன்றைய அட்டவணையைப் பற்றி கேளுங்கள்.',
    },
    'hi': {
      'Worker Sign In': 'कर्मचारी लॉगिन',
      'Municipal Field Operations Portal': 'नगरपालिका फील्ड ऑपरेशन पोर्टल',
      'Employee ID / Username': 'कर्मचारी ID / उपयोगकर्ता नाम',
      'Password': 'पासवर्ड',
      'Remember Session': 'सेशन याद रखें',
      'Login to Dashboard': 'डैशबोर्ड में लॉगिन करें',
      'Worker Dashboard': 'कर्मचारी डैशबोर्ड',
      'Dashboard': 'डैशबोर्ड',
      'My Tasks': 'मेरे कार्य',
      'Alerts': 'अलर्ट',
      'Profile': 'प्रोफ़ाइल',
      'Settings & Configuration': 'सेटिंग्स और कॉन्फ़िगरेशन',
      'Language': 'भाषा',
      'English': 'अंग्रेज़ी',
      'Tamil': 'तमिल',
      'Hindi': 'हिंदी',
      'Mock Data Mode': 'Mock डेटा मोड',
      'Enable local offline mock repositories': 'स्थानीय ऑफलाइन mock डेटा सक्षम करें',
      'API Base URL': 'API बेस URL',
      'GPS Update Interval': 'GPS अपडेट अंतराल',
      '30 seconds (configurable)': '30 सेकंड (कॉन्फ़िगर करने योग्य)',
      'Worker Profile': 'कर्मचारी प्रोफ़ाइल',
      'Phone': 'फ़ोन',
      'Email': 'ईमेल',
      'Assigned Zone': 'आवंटित ज़ोन',
      'Performance Rating': 'प्रदर्शन रेटिंग',
      'Employee ID': 'कर्मचारी ID',
      'Department': 'विभाग',
      'Completed Tasks': 'पूर्ण किए गए कार्य',
      'Availability': 'उपलब्धता',
      'Available': 'उपलब्ध',
      'Unavailable': 'अनुपलब्ध',
      'Showing the last authenticated worker details.': 'अंतिम प्रमाणित कर्मचारी विवरण दिखाया जा रहा है।',
      'Sign Out': 'साइन आउट',
      'Active Task': 'सक्रिय कार्य',
      'TASK ASSIGNED': 'कार्य सौंपा गया',
      'TASK ACCEPTED': 'कार्य स्वीकार किया गया',
      'ON THE WAY': 'रास्ते में',
      'ARRIVED': 'पहुंच गया',
      'REPAIR IN PROGRESS': 'मरम्मत जारी है',
      'WAITING FOR PROOF': 'प्रमाण की प्रतीक्षा',
      'WAITING FOR OFFICER': 'अधिकारी की प्रतीक्षा',
      'COMPLETED': 'पूरा हुआ',
      'REJECTED': 'अस्वीकृत',
      'LIVE': 'लाइव',
      'Route to Complaint': 'शिकायत तक मार्ग',
      'Live Location': 'लाइव लोकेशन',
      'Accept Task': 'कार्य स्वीकार करें',
      'Start Navigation': 'नेविगेशन शुरू करें',
      'Travel to the complaint location': 'शिकायत स्थल पर जाएं',
      'Start Repair': 'मरम्मत शुरू करें',
      'Mark Resolved & Add Proof': 'समाधान के रूप में चिह्नित करें और प्रमाण जोड़ें',
      'Upload Completion Proof': 'पूर्णता प्रमाण अपलोड करें',
      'Task completed successfully.': 'कार्य सफलतापूर्वक पूरा हुआ।',
      'Task rejected. Please contact the officer.': 'कार्य अस्वीकृत है। अधिकारी से संपर्क करें।',
      'Waiting for officer verification': 'अधिकारी सत्यापन की प्रतीक्षा',
      'Completion proof submitted. Waiting for officer verification.': 'पूर्णता प्रमाण जमा किया गया। अधिकारी सत्यापन की प्रतीक्षा है।',
      'You have arrived at the complaint location.': 'आप शिकायत स्थल पर पहुंच गए हैं।',
      'Arrived at Location': 'स्थान पर पहुंच गया',
      'Use this if the map pin or GPS is inaccurate.': 'यदि मानचित्र पिन या GPS सटीक नहीं है तो इसका उपयोग करें।',
      'Task Details': 'कार्य विवरण',
      'Complaint Information': 'शिकायत जानकारी',
      'Location': 'स्थान',
      'Category': 'श्रेणी',
      'Priority': 'प्राथमिकता',
      'Address': 'पता',
      'GPS': 'GPS',
      'Continue Task': 'कार्य जारी रखें',
      'Task Completed': 'कार्य पूरा हुआ',
      'No tasks found': 'कोई कार्य नहीं मिला',
      'Notifications': 'सूचनाएं',
      'Performance Statistics': 'प्रदर्शन आँकड़े',
      'Worker Performance Summary': 'कर्मचारी प्रदर्शन सारांश',
      'Today Completed:': 'आज पूरा हुआ:',
      'Weekly Completed:': 'साप्ताहिक पूरा हुआ:',
      'Monthly Completed:': 'मासिक पूरा हुआ:',
      'Average Completion Time:': 'औसत पूर्णता समय:',
      'AI Worker Assistant': 'AI कर्मचारी सहायक',
      'Language changed': 'भाषा बदल दी गई',
      'WORKER APPLICATION': 'कर्मचारी एप्लिकेशन',
      'Test Accounts (Role Validation):': 'टेस्ट अकाउंट (भूमिका सत्यापन):',
      'ROLE: WORKER': 'भूमिका: कर्मचारी',
      'ALL': 'सभी',
      'PENDING': 'लंबित',
      'ACTIVE': 'सक्रिय',
      'DONE': 'पूर्ण',
      'Assigned': 'सौंपा गया',
      'Accepted': 'स्वीकार किया गया',
      'On the Way': 'रास्ते में',
      'Arrived': 'पहुंच गया',
      'In Progress': 'प्रगति में',
      'Resolved': 'हल किया गया',
      'Verification': 'सत्यापन',
      'Completed': 'पूरा हुआ',
      'Rejected': 'अस्वीकृत',
      'Distance': 'दूरी',
      'Photo Evidence': 'फोटो प्रमाण',
      'Real-Time GPS Verification': 'रीयल-टाइम GPS सत्यापन',
      'GPS will be captured together with the completion photo.': 'पूर्णता फोटो के साथ GPS दर्ज किया जाएगा।',
      'Open Assigned Task': 'सौंपा गया कार्य खोलें',
      'No active tasks': 'कोई सक्रिय कार्य नहीं',
      'New complaints assigned by an officer will appear here.': 'अधिकारी द्वारा सौंपे गए नए शिकायत कार्य यहां दिखाई देंगे।',
      'View My Tasks': 'मेरे कार्य देखें',
      'You are now available. GPS tracking is active.': 'आप अब उपलब्ध हैं। GPS ट्रैकिंग सक्रिय है।',
      'You are now unavailable.': 'आप अब उपलब्ध नहीं हैं।',
      'Location permission is required to become available.': 'उपलब्ध होने के लिए स्थान अनुमति आवश्यक है।',
      'Unable to update task. Please check the server and try again.': 'कार्य अपडेट नहीं हो सका। सर्वर जांचें और फिर प्रयास करें।',
      'Unable to mark the task resolved.': 'कार्य को हल किया हुआ चिह्नित नहीं किया जा सका।',
      'Location permission is required for live task tracking.': 'लाइव कार्य ट्रैकिंग के लिए स्थान अनुमति आवश्यक है।',
      'Unable to start live location tracking.': 'लाइव स्थान ट्रैकिंग शुरू नहीं हो सकी।',
      'Hello Arun! I am your My City Connect Field Assistant. Ask me about your tasks, priorities, or today\'s schedule.': 'नमस्ते! मैं आपका My City Connect फील्ड सहायक हूँ। अपने कार्य, प्राथमिकताओं या आज की समय-सारणी के बारे में पूछें।',
    },
  };
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['en', 'ta', 'hi'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) => false;
}

class T extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const T(
    this.text, {
    super.key,
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) => Text(
        AppLocalizations.of(context).t(text),
        style: style,
        textAlign: textAlign,
        maxLines: maxLines,
        overflow: overflow,
      );
}
