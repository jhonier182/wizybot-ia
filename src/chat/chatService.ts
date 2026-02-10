import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class ChatService {
    private readonly openaiApiKey: string;
    private readonly openaiModel: string;
    private readonly openaiUrl = 'https://api.openai.com/v1/chat/completions';

    constructor(
        private readonly configService: ConfigService,
        private readonly productsService: ProductsService   
    ) {
        this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') ?? '';
        this.openaiModel = this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4.1-mini';

        if (!this.openaiApiKey) {
            throw new Error('OPENAI_API_KEY is not set');
        }
    }

    async chatWithBot(message: string): Promise<string> {
        try {
            // First call to OpenAI with tools
            const firstResponse = await this.callOpenAIWithTools(message);

            const choice = firstResponse.choices[0];
            const toolCalls = choice.message.tool_calls;

            // If the model did NOT request to use tools, return its response directly
            if (!toolCalls || toolCalls.length === 0) {
                return choice.message.content ?? 'No response from model';
            }

            // For simplicity, handle only the first tool_call
            const toolCall = toolCalls[0];

            // Execute the tool locally
            const toolResult = await this.runTool(toolCall.function.name, toolCall.function.arguments);

            // Second call to OpenAI with the result of the tool
            const finalResponse = await this.callOpenAIWithToolResult(message, choice.message, toolCall, toolResult);

            return finalResponse.choices[0].message.content ?? 'No response from model';
        } catch (error) {
            console.error('Error in chatWithBot:', error);
            throw new InternalServerErrorException('Error while processing chatbot request');
        }
    }

    private async callOpenAIWithTools(userMessage: string) {
        const body = {
            model: this.openaiModel,
            messages: [
                {
                    role: 'user',
                    content: userMessage,
                },
            ],
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'searchProducts',
                        description: 'Search for products related to the user query in the products catalog.',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'User search query, e.g. "phone", "present for my dad", etc.',
                                },
                            },
                            required: ['query'],
                        },
                    },
                },
                {
                    type: 'function',
                    function: {
                        name: 'convertCurrencies',
                        description: 'Convert an amount of money from one currency to another.',
                        parameters: {
                            type: 'object',
                            properties: {
                                amount: {
                                    type: 'number',
                                    description: 'Amount of money to convert',
                                },
                                fromCurrency: {
                                    type: 'string',
                                    description: 'ISO currency code to convert from, e.g. "USD", "EUR"',
                                },
                                toCurrency: {
                                    type: 'string',
                                    description: 'ISO currency code to convert to, e.g. "EUR", "CAD"',
                                },
                            },
                            required: ['amount', 'fromCurrency', 'toCurrency'],
                        },
                    },
                },
            ],
            tool_choice: 'auto',
        };

        const response = await axios.post(this.openaiUrl, body, {
            headers: {
                Authorization: `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    }

    private async runTool(toolName: string, rawArgs: string): Promise<any> {
        let args: any;
        try {
            args = JSON.parse(rawArgs);
        } catch (e) {
            throw new Error(`Invalid JSON arguments for tool ${toolName}`);
        }

        if (toolName === 'searchProducts') {
           const products = this.productsService.search(args.query);
           return products.map((p) => ({
            title: p.displayTitle,
            description: p.embeddingText,
            url: p.url,
            imageUrl: p.imageUrl,
            discount: p.discount,
            price: p.price,
            variants: p.variants,
            createDate: p.createDate,
           }));
        }
        throw new Error(`Unknown tool: ${toolName}`);
    }

    private async callOpenAIWithToolResult(
        userMessage: string,
        assistantMessageWithToolCall: any,
        toolCall: any,
        toolResult: any,
    ) {
        const toolMessage = {
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(toolResult),
        };

        const body = {
            model: this.openaiModel,
            messages: [
                { role: 'user', content: userMessage },
                assistantMessageWithToolCall,
                toolMessage,
            ],
        };

        const response = await axios.post(this.openaiUrl, body, {
            headers: {
                Authorization: `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    }
}