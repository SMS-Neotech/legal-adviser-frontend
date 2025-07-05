export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rating?: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};
