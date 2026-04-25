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
  attempts: { name: number; phone: number; zip: number; address: number }
  zipRejectedCount: number
  offTopicCount: number
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
    attempts: { name: 0, phone: 0, zip: 0, address: 0 },
    zipRejectedCount: 0,
    offTopicCount: 0,
  }
}
