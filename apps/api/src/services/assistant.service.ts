import Groq from 'groq-sdk';
import { searchIndex, type SearchResult } from './orama-index.service.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

export interface AssistantResponse {
  answer: string;
  sources: SearchResult[];
}

export async function ask(query: string): Promise<AssistantResponse> {
  // 1. Retrieve candidates via BM25
  const sources = await searchIndex(query, 10);

  if (sources.length === 0) {
    return {
      answer: 'No encontre informacion relevante en tus datos.',
      sources: [],
    };
  }

  // 2. Build context from top results
  const context = sources
    .map((s, i) => {
      const label = s.type === 'document' ? 'Documento'
        : s.type === 'database' ? 'Base de datos'
        : s.type === 'project' ? 'Proyecto'
        : 'Fila';
      return `[${i + 1}] ${label}: "${s.title}" — ${s.body.slice(0, 300)}`;
    })
    .join('\n');

  // 3. Ask Groq to synthesize an answer
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Eres un asistente de busqueda. El usuario pregunta sobre sus documentos, bases de datos y proyectos.
Usa SOLO la informacion del contexto proporcionado para responder.
Si la informacion no es suficiente, dilo claramente.
Responde en espanol, de forma concisa. Menciona en que documento/proyecto/base de datos encontraste la informacion.`,
      },
      {
        role: 'user',
        content: `Pregunta: ${query}\n\nContexto:\n${context}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const answer = completion.choices[0]?.message?.content ?? 'No pude generar una respuesta.';

  return { answer, sources };
}
