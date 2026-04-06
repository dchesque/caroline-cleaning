// lib/ai/state-machine/handlers/index.ts
// Registers all state handlers with the Carol state machine engine.

import type { CarolStateMachine } from '../engine'

// Greeting
import { handleGreeting } from './greeting'

// Phone
import { handleCollectPhone, handleConfirmPhone, handleLookupCustomer } from './phone'

// Customer
import {
  handleNewCustomerName,
  handleExplainFirstVisit,
  handleNewCustomerAddress,
  handleCheckZip,
  handleZipNotCovered,
  handleCreateLead,
  handleReturningCustomer,
  handleDetectIntent,
} from './customer'

// Booking
import {
  handleConfirmAddress,
  handleAskServiceType,
  handleAskDate,
  handleCollectDate,
  handleCheckAvailability,
  handleNoSlots,
  handleCollectTime,
  handleCreateBooking,
  handleConfirmSummary,
  handleCollectPreference,
  handleUpdatePreference,
} from './booking'

// Cancel
import {
  handleShowAppointments,
  handleSelectAppointment,
  handleConfirmCancelResponse,
  handleCancelAppointment,
} from './cancel'

// Reschedule
import { handleConfirmReschedule } from './reschedule'

// FAQ
import {
  handleFaqResponse,
  handleDeflectPrice,
  handleSavePetInfo,
  handleSaveAllergyInfo,
} from './faq'

// Callback
import { handleAskCallbackTime, handleScheduleCallback } from './callback'

// Guardrail & misc
import { handleGuardrail, handleUpdateClientInfo, handleDone } from './guardrail'

/**
 * Register every state handler with the engine.
 * Call this once during application bootstrap.
 */
export function registerAllHandlers(engine: CarolStateMachine): void {
  // Start
  engine.registerHandler('GREETING', handleGreeting)

  // Phone collection
  engine.registerHandler('COLLECT_PHONE', handleCollectPhone)
  engine.registerHandler('CONFIRM_PHONE', handleConfirmPhone)
  engine.registerHandler('LOOKUP_CUSTOMER', handleLookupCustomer)

  // New customer
  engine.registerHandler('NEW_CUSTOMER_NAME', handleNewCustomerName)
  engine.registerHandler('EXPLAIN_FIRST_VISIT', handleExplainFirstVisit)
  engine.registerHandler('NEW_CUSTOMER_ADDRESS', handleNewCustomerAddress)
  engine.registerHandler('CHECK_ZIP', handleCheckZip)
  engine.registerHandler('ZIP_NOT_COVERED', handleZipNotCovered)
  engine.registerHandler('CREATE_LEAD', handleCreateLead)

  // Returning customer
  engine.registerHandler('RETURNING_CUSTOMER', handleReturningCustomer)
  engine.registerHandler('DETECT_INTENT', handleDetectIntent)

  // Booking flow
  engine.registerHandler('CONFIRM_ADDRESS', handleConfirmAddress)
  engine.registerHandler('ASK_SERVICE_TYPE', handleAskServiceType)
  engine.registerHandler('ASK_DATE', handleAskDate)
  engine.registerHandler('COLLECT_DATE', handleCollectDate)
  engine.registerHandler('CHECK_AVAILABILITY', handleCheckAvailability)
  engine.registerHandler('NO_SLOTS', handleNoSlots)
  engine.registerHandler('COLLECT_TIME', handleCollectTime)
  engine.registerHandler('CREATE_BOOKING', handleCreateBooking)
  engine.registerHandler('CONFIRM_SUMMARY', handleConfirmSummary)
  engine.registerHandler('COLLECT_PREFERENCE', handleCollectPreference)
  engine.registerHandler('UPDATE_PREFERENCE', handleUpdatePreference)

  // Cancel flow
  engine.registerHandler('SHOW_APPOINTMENTS', handleShowAppointments)
  engine.registerHandler('SELECT_APPOINTMENT', handleSelectAppointment)
  engine.registerHandler('CONFIRM_CANCEL', handleConfirmCancelResponse)
  engine.registerHandler('CANCEL_APPOINTMENT', handleCancelAppointment)

  // Reschedule
  engine.registerHandler('CONFIRM_RESCHEDULE', handleConfirmReschedule)

  // FAQ & info
  engine.registerHandler('FAQ_RESPONSE', handleFaqResponse)
  engine.registerHandler('DEFLECT_PRICE', handleDeflectPrice)
  engine.registerHandler('SAVE_PET_INFO', handleSavePetInfo)
  engine.registerHandler('SAVE_ALLERGY_INFO', handleSaveAllergyInfo)

  // Callback
  engine.registerHandler('ASK_CALLBACK_TIME', handleAskCallbackTime)
  engine.registerHandler('SCHEDULE_CALLBACK', handleScheduleCallback)

  // Guardrail & misc
  engine.registerHandler('GUARDRAIL', handleGuardrail)
  engine.registerHandler('UPDATE_CLIENT_INFO', handleUpdateClientInfo)
  engine.registerHandler('DONE', handleDone)
}
