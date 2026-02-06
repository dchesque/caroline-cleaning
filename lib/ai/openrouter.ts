// lib/ai/openrouter.ts
import OpenAI from 'openai'

export const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Caroline Premium Cleaning'
    }
})

export const MODELS = {
    CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
    GPT4_TURBO: 'openai/gpt-4-turbo',
    LLAMA_70B: 'meta-llama/llama-3.1-70b-instruct'
}
