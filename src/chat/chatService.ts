import { Injectable } from "@nestjs/common";

@Injectable()
export class ChatService {
    async chatWithBot(message: string): Promise<string> {
        
        return `Echo for bot: ${message} `;
    }
}