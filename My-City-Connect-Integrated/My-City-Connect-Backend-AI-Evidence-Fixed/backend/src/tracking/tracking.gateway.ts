import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LocationUpdateDto } from './dto/location-update.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TrackingGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:complaint')
  handleJoinComplaintRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { complaintId: string }
  ) {
    if (data && data.complaintId) {
      client.join(`complaint:${data.complaintId}`);
      this.logger.log(`Client ${client.id} joined tracking channel for complaint: ${data.complaintId}`);
      return { event: 'joined', complaintId: data.complaintId };
    }
  }

  @SubscribeMessage('worker:location')
  handleWorkerLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationUpdateDto
  ) {
    this.logger.debug(`Location stream update from worker ${data.workerId}: [${data.latitude}, ${data.longitude}]`);

    // Broadcast update to anyone tracking this complaint
    if (data.complaintId) {
      this.server.to(`complaint:${data.complaintId}`).emit('worker:location', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }

    // Also broadcast to officer dashboard
    this.server.emit('officer:worker:location', data);
    return { received: true };
  }

  broadcastComplaintStatus(complaintId: string, status: string, remarks?: string) {
    if (!this.server) return;
    const payload = { complaintId, status, remarks, timestamp: new Date().toISOString() };
    this.server.to(`complaint:${complaintId}`).emit('complaint:status', payload);
    this.server.emit('COMPLAINT_STATUS_CHANGED', payload);
    if (status === 'RESOLVED') this.server.emit('COMPLAINT_RESOLVED', payload);
  }

  broadcastWorkerLocation(data: { workerId: string; complaintId?: string; latitude: number; longitude: number; accuracy?: number; timestamp?: string }) {
    if (!this.server) return;
    const payload = { ...data, timestamp: data.timestamp || new Date().toISOString() };
    this.server.emit('WORKER_LOCATION_UPDATED', payload);
    if (data.complaintId) this.server.to(`complaint:${data.complaintId}`).emit('worker:location', payload);
  }

  broadcastWorkerAvailability(workerId: string, availability: string) {
    if (!this.server) return;
    this.server.emit('WORKER_STATUS_CHANGED', { workerId, availability, timestamp: new Date().toISOString() });
  }

  broadcastNewComplaint(complaint: any) {
    if (!this.server) return;
    this.server.emit('NEW_COMPLAINT', complaint);
  }

  broadcastComplaintUpdated(complaint: any) {
    if (!this.server) return;
    this.server.emit('COMPLAINT_UPDATED', complaint);
  }

  broadcastComplaintResolved(complaint: any) {
    if (!this.server) return;
    this.server.emit('COMPLAINT_RESOLVED', complaint);
  }

  broadcastNotification(notification: any) {
    if (!this.server) return;
    this.server.emit('NOTIFICATION_CREATED', notification);
  }

  broadcastAssignmentUpdated(assignmentId: string, complaintId: string, status: string) {
    if (this.server) {
      const payload = { assignmentId, complaintId, status, timestamp: new Date().toISOString() };
      this.server.to(`complaint:${complaintId}`).emit('assignment:updated', payload);
      this.server.emit(status === 'ASSIGNED' ? 'WORKER_ASSIGNED' : 'WORKER_STATUS_CHANGED', payload);
    }
  }
}
