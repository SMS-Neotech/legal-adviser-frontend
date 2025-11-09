import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIStream, StreamingTextResponse } from 'ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const maxDuration = 60;

export async function POST(req: Request) {
  const { message } = await req.json();

  const prompt = `You are a helpful and friendly legal assistant for the laws of Nepal. Your name is "ABC".
You can answer questions about Nepalese law, its constitution, and legal procedures.
You can also draft legal documents and translate legal text from English to Nepali and vice versa.
Keep your responses concise and to the point.
Here is the user's message:
${message}`;

  const geminiStream = await genAI
    .getGenerativeModel({ model: 'gemini-1.5-flash' })
    .generateContentStream(prompt);

  const stream = GoogleAIStream(geminiStream);

  return new StreamingTextResponse(stream);
}
