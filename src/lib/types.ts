export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rating?: 'good' | 'bad';
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};
