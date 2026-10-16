import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MongoDbService } from '../database/mongodb.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private prisma: PrismaService,
    private mongoDb: MongoDbService
  ) {}

  async processMessage(citizenId: string, dto: ChatbotMessageDto) {
    const text = dto.message.toLowerCase();
    const lang = dto.language || 'en';

    // 1. Save Citizen message in MongoDB
    try {
      await this.mongoDb.saveChatMessage({
        citizenId,
        sender: 'CITIZEN',
        message: dto.message,
        language: lang,
        createdAt: new Date(),
      });
    } catch (e) {
      this.logger.warn(`Failed to archive chat message: ${e.message}`);
    }

    let botResponse = '';

    // 2. Complaint status lookup with STRICT OWNERSHIP CHECK
    const cmpMatch = dto.message.match(/CMP[-_]?\d+/i);
    const targetCmpNumber = cmpMatch ? cmpMatch[0].toUpperCase() : dto.contextComplaintId;

    if (targetCmpNumber) {
      let complaint: any = null;
      if (this.prisma.isConnected) {
        complaint = await this.prisma.complaint.findFirst({
          where: {
            OR: [
              { complaintNumber: targetCmpNumber },
              { id: targetCmpNumber },
            ],
          },
          include: { department: true, assignedWorker: { include: { user: true } } },
        });
      }

      if (complaint) {
        // Privacy rule: Never expose complaint of another citizen
        if (complaint.citizenId !== citizenId) {
          botResponse = lang === 'ta'
            ? 'மன்னிக்கவும், இந்த புகார் உங்கள் கணக்குடன் இணைக்கப்படவில்லை. தனியுரிமை காரணங்களுக்காக விவரங்களை காட்ட இயலாது.'
            : lang === 'hi'
            ? 'क्षमा करें, यह शिकायत आपके खाते से संबंधित नहीं है। गोपनीयता कारणों से विवरण उपलब्ध नहीं है।'
            : 'For privacy and security, I can only provide status updates for complaints filed from your own account.';
        } else {
          const dept = complaint.department?.name || 'Municipal Works';
          const workerName = complaint.assignedWorker?.user?.name;
          const workerStatus = complaint.assignedWorker?.status || 'Assigned';

          if (lang === 'ta') {
            botResponse = `புகார் #${complaint.complaintNumber} தற்போது "${complaint.status}" நிலையில் உள்ளது. துறை: ${dept}.${workerName ? ` பணியாளர்: ${workerName} (${workerStatus})` : ''}`;
          } else if (lang === 'hi') {
            botResponse = `शिकायत #${complaint.complaintNumber} की वर्तमान स्थिति "${complaint.status}" है। विभाग: ${dept}।${workerName ? ` कार्यकर्ता: ${workerName}` : ''}`;
          } else {
            botResponse = `Complaint #${complaint.complaintNumber} is currently "${complaint.status}". Handled by ${dept}.${workerName ? ` Field Worker: ${workerName} (${workerStatus}).` : ' Inspection team will be dispatched shortly.'}`;
          }
        }
      }
    }

    // 3. General civic guidance responses if no specific complaint was resolved
    if (!botResponse) {
      if (text.includes('how to report') || text.includes('report') || text.includes('புகார் செய்ய')) {
        if (lang === 'ta') {
          botResponse = 'புகார் அளிக்க: முகப்புப் பக்கத்தில் "Report Issue" பொத்தானைத் தட்டவும், புகைப்படத்தை எடுக்கவும், GPS இருப்பிடத்தை உறுதிசெய்து சமர்ப்பிக்கவும். AI தானாகவே புகாரை வகைப்படுத்தும்.';
        } else if (lang === 'hi') {
          botResponse = 'शिकायत दर्ज करने के लिए: होम स्क्रीन पर "Report Issue" पर टैप करें, फ़ोटो लें, GPS स्थान की पुष्टि करें और सबमिट करें। AI स्वचालित रूप से समस्या का पता लगाएगा।';
        } else {
          botResponse = 'To report a civic issue: Tap "Report Issue" on the home screen, capture photo evidence with your camera, verify the GPS pin, and confirm submission. Our AI will automatically identify the problem category.';
        }
      } else if (text.includes('pothole') || text.includes('road') || text.includes('சாலை')) {
        botResponse = lang === 'ta'
          ? 'சாலை மற்றும் குழி சார்ந்த புகார்கள் நெடுஞ்சாலை மற்றும் சாலை பராமரிப்பு துறைக்கு (PWD) 24 மணி நேரத்திற்குள் தீர்க்க பரிந்துரைக்கப்படும்.'
          : 'Pothole and road damage complaints are routed to the Roads & Infrastructure (PWD) department with a 24-hour target SLA.';
      } else if (text.includes('streetlight') || text.includes('light') || text.includes('விளக்கு')) {
        botResponse = lang === 'ta'
          ? 'தெருவிளக்கு புகார்கள் மின்சார துறைக்கு தானாக அனுப்பப்பட்டு 24 மணி நேரத்திற்குள் பழுதுபார்க்கப்படும்.'
          : 'Streetlight faults are allocated to Electrical Engineering & Street Lighting. Standard repair turnaround is 24 hours.';
      } else if (text.includes('garbage') || text.includes('waste') || text.includes('குப்பை')) {
        botResponse = lang === 'ta'
          ? 'குப்பை மற்றும் தூய்மை புகார்கள் திடக் கழிவு மேலாண்மை (SWM) பிரிவுக்கு ஒதுக்கப்படும்.'
          : 'Garbage accumulation complaints are immediately routed to Solid Waste Management & Sanitation with a 12-hour resolution SLA.';
      } else {
        botResponse = lang === 'ta'
          ? 'வணக்கம்! நான் உங்கள் நகராட்சி உதவியாளர். நீங்கள் புகார் அளிப்பது, நிலை அறிவது அல்லது நகராட்சி சேவைகள் பற்றி கேட்கலாம்.'
          : lang === 'hi'
          ? 'नमस्ते! मैं आपका नागरिक सहायक हूँ। आप शिकायत दर्ज करने, स्थिति जानने या नगर निगम सेवाओं के बारे में पूछ सकते हैं।'
          : "Hello! I am your City Assistant. You can ask me how to report an issue, check the live status of your complaints, or inquire about municipal department workflows.";
      }
    }

    // 4. Save Bot response in MongoDB
    try {
      await this.mongoDb.saveChatMessage({
        citizenId,
        sender: 'BOT',
        message: botResponse,
        language: lang,
        createdAt: new Date(),
      });
    } catch (e) {}

    return {
      reply: botResponse,
      language: lang,
      timestamp: new Date().toISOString(),
    };
  }

  async processVoiceInput(citizenId: string, language = 'en') {
    // API boundary for speech-to-text integration
    return this.processMessage(citizenId, {
      message: 'What is the status of my recent complaint?',
      language,
    });
  }

  async getHistory(citizenId: string) {
    return this.mongoDb.getChatHistory(citizenId);
  }
}
