// types/lead-chat.ts
// Shared types for the lead-capture chat mode.
// No server-only imports here — safe to use in both client hooks and server agents.

export interface LeadContext {
  name: string | null
  phone: string | null
  zip: string | null
  zipConfirmed: boolean
  address: string | null
  leadSaved: boolean
  leadId: string | null
}

export function defaultLeadContext(): LeadContext {
  return {
    name: null,
    phone: null,
    zip: null,
    zipConfirmed: false,
    address: null,
    leadSaved: false,
    leadId: null,
  }
}
