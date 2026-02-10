
import { Module } from '@nestjs/common';
import { ChatController } from './chatController';
import { ChatService } from './chatService';
import { ProductsModule } from '../products/products.module';


@Module({
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
  imports: [ProductsModule],
})
export class ChatModule {}