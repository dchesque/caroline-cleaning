// types/lead-chat.ts
// Shared types for the lead-capture chat mode.
// No server-only imports here — safe to use in both client hooks and server agents.

export interface LeadContext {
  name: string | null
  phone: string | null
  zip: string | null
  leadSaved: boolean
  leadId: string | null
  retries: number
}

export function defaultLeadContext(): LeadContext {
  return {
    name: null,
    phone: null,
    zip: null,
    leadSaved: false,
    leadId: null,
    retries: 0,
  }
}
