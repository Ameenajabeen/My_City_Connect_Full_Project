import 'package:flutter/material.dart';
import '../../services/api/api_client.dart';
import '../../services/api/api_endpoints.dart';
import '../theme/app_colors.dart';

class ChatMessage {
  final String text;
  final bool fromUser;
  ChatMessage(this.text, this.fromUser);
}

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<ChatMessage> _messages = [
    ChatMessage('Hello! I am the My City Connect AI assistant. How can I help you with a civic issue?', false),
  ];
  bool _sending = false;

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;

    _controller.clear();
    setState(() {
      _messages.add(ChatMessage(text, true));
      _sending = true;
    });
    _scrollToBottom();

    try {
      final response = await ApiClient().post(
        ApiEndpoints.chatbotMessage,
        data: {'message': text},
      );
      final body = ApiClient().unwrap(response.data);
      final reply = _extractReply(body);
      if (!mounted) return;
      setState(() => _messages.add(ChatMessage(reply, false)));
    } catch (e) {
      if (!mounted) return;
      setState(() => _messages.add(ChatMessage(
            'I could not reach the AI assistant right now. Please check the backend connection and try again.',
            false,
          )));
    } finally {
      if (mounted) {
        setState(() => _sending = false);
        _scrollToBottom();
      }
    }
  }

  String _extractReply(dynamic body) {
    if (body is String && body.trim().isNotEmpty) return body;
    if (body is Map) {
      for (final key in const ['reply', 'response', 'answer', 'message', 'text', 'content']) {
        final value = body[key];
        if (value is String && value.trim().isNotEmpty) return value;
      }
      final nested = body['data'];
      if (nested is Map) return _extractReply(nested);
    }
    return 'I received your request, but the AI service returned an unexpected response.';
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('AI Help', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return Align(
                  alignment: message.fromUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .82),
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                    decoration: BoxDecoration(
                      color: message.fromUser ? const Color(0xFF1769FF) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: message.fromUser ? Colors.transparent : AppColors.cardBorder),
                    ),
                    child: Text(
                      message.text,
                      style: TextStyle(
                        color: message.fromUser ? Colors.white : AppColors.textPrimary,
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_sending)
            const Padding(
              padding: EdgeInsets.fromLTRB(18, 0, 18, 6),
              child: Align(alignment: Alignment.centerLeft, child: Text('AI is typing…', style: TextStyle(fontSize: 11, color: AppColors.textSecondary))),
            ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: const InputDecoration(hintText: 'Ask about civic issues…'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sending ? null : _send,
                    icon: const Icon(Icons.send_rounded),
                    tooltip: 'Send',
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
