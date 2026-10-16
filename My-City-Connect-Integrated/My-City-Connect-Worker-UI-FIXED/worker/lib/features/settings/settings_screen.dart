import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/api_config.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/localization/language_provider.dart';
import '../../core/theme/app_colors.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final locale = ref.watch(appLanguageProvider);
    final languageName = switch (locale.languageCode) { 'ta' => l.t('Tamil'), 'hi' => l.t('Hindi'), _ => l.t('English') };
    return Scaffold(
      appBar: AppBar(title: Text(l.t('Settings & Configuration'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Card(child: ListTile(
          leading: const Icon(Icons.language, color: AppColors.primary),
          title: Text(l.t('Language'), style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text(languageName),
          trailing: DropdownButton<String>(
            value: locale.languageCode,
            underline: const SizedBox(),
            items: ['en','ta','hi'].map((code) => DropdownMenuItem(value: code, child: Text({'en':'English','ta':'Tamil','hi':'Hindi'}[code]!))).toList(),
            onChanged: (code) async { if (code != null) { await ref.read(appLanguageProvider.notifier).setLanguage(code); } },
          ),
        )),
        const Divider(),
        SwitchListTile(title: Text(l.t('Mock Data Mode'), style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(l.t('Enable local offline mock repositories')), value: ApiConfig.useMockData, activeTrackColor: AppColors.primary, onChanged: (_) {}),
        const Divider(),
        ListTile(title: Text(l.t('API Base URL'), style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: const Text(ApiConfig.defaultBaseUrl), trailing: const Icon(Icons.edit_outlined)),
        const Divider(),
        ListTile(title: Text(l.t('GPS Update Interval'), style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(l.t('30 seconds (configurable)')), trailing: const Icon(Icons.timer_outlined)),
      ]),
    );
  }
}
