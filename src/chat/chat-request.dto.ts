import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";


 export class ChatRequestDto {
     @ApiProperty({
         description: 'The message to send to the chatbot',
         example: 'I am looking for iphone ' })
     @IsString()
     @MinLength(1)
     message: string;
 }
