
import { Module } from '@nestjs/common';
import { ChatController } from './chatController';
import { ChatService } from './chatService';
import { ProductsModule } from '../products/products.module';
import { CurrencyModule } from '../currency/currency.module';


@Module({
  imports: [ProductsModule, CurrencyModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
  
})
export class ChatModule {}