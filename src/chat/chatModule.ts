
import { Module } from '@nestjs/common';
import { ChatController } from './chatController';
import { ChatService } from './chatService';


@Module({
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}