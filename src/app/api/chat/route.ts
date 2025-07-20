import {NextRequest} from 'next/server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerChunkSchema = z.object({
  content: z.string(),
});

export const maxDuration = 60;

// This defines the expected input schema for our API endpoint.
const ChatRequestSchema = z.object({
  message: z.string(),
});

// We are using the Genkit Next.js helper to create the API endpoint.
export const POST = ai.next.api({
  // We specify the input schema for the endpoint.
  inputSchema: ChatRequestSchema,
  // We specify the output schema for the endpoint. `stream` is a helper for this.
  outputSchema: ai.next.stream(AnswerChunkSchema),
  // This is the main logic for our endpoint.
  handler: async ({message}, stream) => {
    const llmResponse = await ai.generate({
      prompt: `You are a helpful and friendly legal assistant for the laws of Nepal. Your name is "ABC".
You can answer questions about Nepalese law, its constitution, and legal procedures.
You can also draft legal documents and translate legal text from English to Nepali and vice versa.
Keep your responses concise and to the point.
Here is the user's message:
${message}`,
      // We are telling the model to stream the response.
      stream: true,
    });

    // We are iterating over the streaming response from the model.
    for await (const chunk of llmResponse.stream) {
      // We are publishing the chunk to the client.
      stream.chunk({
        content: chunk.text,
      });
    }
  },
});
