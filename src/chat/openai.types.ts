export interface OpenAIToolFunctionCall {
  name: string;
  arguments: string;
}

export interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: OpenAIToolFunctionCall;
}

export type OpenAIRole = 'system' | 'user' | 'assistant' | 'tool';

export interface OpenAIChatMessage {
  role: OpenAIRole;
  content: string | null;
  tool_calls?: OpenAIToolCall[];
}

export interface OpenAIChatChoice {
  index: number;
  message: OpenAIChatMessage;
  finish_reason: string | null;
}

export interface OpenAIChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChatChoice[];
}

