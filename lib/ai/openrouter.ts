// lib/ai/openrouter.ts
import OpenAI from 'openai'
import { env } from '@/lib/env'

let _openrouter: OpenAI | null = null

export const getOpenRouter = () => {
    if (!_openrouter) {
        if (!env.openRouterKey) {
            throw new Error('OPENROUTER_API_KEY is missing')
        }
        _openrouter = new OpenAI({
            apiKey: env.openRouterKey,
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': env.appUrl,
                'X-Title': 'Carolina Premium Cleaning'
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
