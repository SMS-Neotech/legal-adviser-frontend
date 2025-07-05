export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rating?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};
