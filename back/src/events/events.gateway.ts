import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinStore')
  handleJoinStore(
    @MessageBody() storeId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `store_${storeId}`;
    client.join(room);
    console.log(`Client ${client.id} joined room ${room}`);
    return { event: 'joined', data: room };
  }

  notifyStoreOrdersUpdate(storeId: string) {
    const room = `store_${storeId}`;
    this.server.to(room).emit('ordersUpdated', {
      timestamp: new Date().toISOString()
    });
  }
}
