import { NextResponse } from 'next/server'

interface ChatRequestMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
  model?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages?: ChatRequestMessage[]
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'El mensaje es obligatorio' },
        { status: 400 },
      )
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'La variable GROQ_API_KEY no está configurada' },
        { status: 500 },
      )
    }

    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      },
    )

    const data = (await groqResponse.json()) as GroqResponse

    if (!groqResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Groq rechazó la solicitud' },
        { status: groqResponse.status },
      )
    }

    const content = data.choices?.[0]?.message?.content

    if (typeof content !== 'string' || content.length === 0) {
      return NextResponse.json(
        { error: 'Groq no devolvió una respuesta válida' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      message: { role: 'assistant', content },
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
        total_tokens: data.usage?.total_tokens ?? 0,
      },
      model: data.model ?? 'unknown',
    })
  } catch {
    return NextResponse.json(
      { error: 'No se pudo conectar con Groq' },
      { status: 500 },
    )
  }
}
