// lib/ai/openrouter.ts
import OpenAI from 'openai'

let _openrouter: OpenAI | null = null

export const getOpenRouter = () => {
    if (!_openrouter) {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('OPENROUTER_API_KEY is missing')
        }
        _openrouter = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'Caroline Premium Cleaning'
            }
        })
    }
    return _openrouter
}

// For backward compatibility but using a Proxy to delay initialization
export const openrouter = new Proxy({} as OpenAI, {
    get: (target, prop, receiver) => {
        return Reflect.get(getOpenRouter(), prop, receiver)
    }
})

export const MODELS = {
    CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
    GPT4_TURBO: 'openai/gpt-4-turbo',
    LLAMA_70B: 'meta-llama/llama-3.1-70b-instruct'
}
