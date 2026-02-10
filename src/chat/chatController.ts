// src/chat/chat.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chatService';
import { ChatRequestDto } from './chat-request.dto';

class ChatResponse {
  answer: string;
}

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to the chatbot' })
  @ApiBody({ type: ChatRequestDto })
  @ApiOkResponse({
    description: 'Chatbot response',
    type: ChatResponse,
  })
  async createChat(@Body() body: ChatRequestDto): Promise<ChatResponse> {
    const answer = await this.chatService.chatWithBot(body.message);
    return { answer };
  }
}