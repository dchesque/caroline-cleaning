// lib/ai/state-machine/types.ts
// Type definitions for Carol's conversational state machine

import { CarolServices, SessionContext, SlotInfo } from '@/lib/services/carol-services'
import { CarolLLM } from '../llm'

// Re-export SessionContext so consumers can import from one place
export type { SessionContext, SlotInfo }

// ═══════════════════════════════════════════
// STATES
// ═══════════════════════════════════════════

export type CarolState =
  // Start
  | 'GREETING'
  // Phone collection
  | 'COLLECT_PHONE'
  | 'CONFIRM_PHONE'
  | 'LOOKUP_CUSTOMER'
  // New customer
  | 'NEW_CUSTOMER_NAME'
  | 'EXPLAIN_FIRST_VISIT'
  | 'NEW_CUSTOMER_ADDRESS'
  | 'CHECK_ZIP'
  | 'ZIP_NOT_COVERED'
  | 'CREATE_LEAD'
  // Returning customer
  | 'RETURNING_CUSTOMER'
  | 'DETECT_INTENT'
  // Booking flow
  | 'CONFIRM_ADDRESS'
  | 'ASK_SERVICE_TYPE'
  | 'ASK_DATE'
  | 'COLLECT_DATE'
  | 'CHECK_AVAILABILITY'
  | 'NO_SLOTS'
  | 'COLLECT_TIME'
  | 'CREATE_BOOKING'
  | 'CONFIRM_SUMMARY'
  | 'COLLECT_PREFERENCE'
  | 'UPDATE_PREFERENCE'
  // Cancel flow
  | 'SHOW_APPOINTMENTS'
  | 'SELECT_APPOINTMENT'
  | 'CONFIRM_CANCEL'
  | 'CANCEL_APPOINTMENT'
  // Reschedule
  | 'CONFIRM_RESCHEDULE'
  // FAQ & others
  | 'FAQ_RESPONSE'
  | 'ASK_CALLBACK_TIME'
  | 'SCHEDULE_CALLBACK'
  | 'UPDATE_CLIENT_INFO'
  | 'SAVE_PET_INFO'
  | 'SAVE_ALLERGY_INFO'
  | 'DEFLECT_PRICE'
  | 'GUARDRAIL'
  // End
  | 'DONE'

// ═══════════════════════════════════════════
// USER INTENT
// ═══════════════════════════════════════════

export type UserIntent =
  | 'schedule'
  | 'cancel'
  | 'reschedule'
  | 'faq'
  | 'callback'
  | 'update_info'
  | 'price_inquiry'
  | 'pet_info'
  | 'allergy_info'
  | 'greeting'
  | 'confirm_yes'
  | 'confirm_no'
  | 'correction'
  | 'off_topic'
  | 'unknown'

// ═══════════════════════════════════════════
// HANDLER TYPES
// ═══════════════════════════════════════════

/**
 * Result returned by every state handler.
 *
 * - nextState: the state to transition to after this handler completes.
 * - response: text to send back to the user (empty string if silent).
 * - contextUpdates: partial SessionContext fields to merge into the current context.
 * - silent: when true the engine chains immediately to the next handler
 *   without waiting for user input (e.g., LOOKUP_CUSTOMER runs automatically
 *   after CONFIRM_PHONE). The engine accumulates responses from chained handlers.
 */
export interface HandlerResult {
  nextState: CarolState
  response: string
  contextUpdates?: Partial<SessionContext>
  silent?: boolean
}

/**
 * A state handler function.
 *
 * @param message  - The user's latest message (may be empty for silent transitions).
 * @param context  - The current session context (read-only within the handler).
 * @param services - The service layer for DB/API operations.
 * @param llm      - The LLM wrapper for natural language tasks (intent detection, extraction, generation).
 * @returns A HandlerResult describing the transition and response.
 */
export type StateHandler = (
  message: string,
  context: SessionContext,
  services: CarolServices,
  llm: CarolLLM,
) => Promise<HandlerResult>
