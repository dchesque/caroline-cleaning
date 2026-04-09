# API Endpoints - Chesque Premium Cleaning

**Purpose**: Complete reference for all REST API endpoints  
**Last Updated**: April 2026

---

## Table of Contents
1. [Authentication](#authentication)
2. [Chat & Carol AI](#chat--carol-ai)
3. [Webhooks](#webhooks)
4. [Notifications](#notifications)
5. [Analytics & Tracking](#analytics--tracking)
6. [Configuration](#configuration)
7. [Admin Routes](#admin-routes)
8. [Health & Status](#health--status)

---

## Authentication

### User Profile

**GET** `/api/profile`
- **Auth**: Required (Supabase)
- **Purpose**: Get current logged-in user profile
- **Response**:
  ```json
  {
    "id": "user-uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "avatar_url": "https://...",
    "role": "owner"
  }
  ```

**PUT** `/api/profile`
- **Auth**: Required
- **Purpose**: Update user profile
- **Body**:
  ```json
  {
    "name": "New Name",
    "avatar_url": "https://..."
  }
  ```
- **Response**: Updated profile object

**POST** `/api/profile/password`
- **Auth**: Required
- **Purpose**: Change user password
- **Body**:
  ```json
  {
    "currentPassword": "old-password",
    "newPassword": "new-password"
  }
  ```
- **Response**:
  ```json
  { "success": true }
  ```

---

## Chat & Carol AI

### Send Chat Message

**POST** `/api/chat`
- **Auth**: Not required (public)
- **Purpose**: Send message to Carol AI, get response
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "message": "I need to schedule a cleaning",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "optional-user-id"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "response": "I'd love to help you schedule a cleaning!...",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-04-09T10:30:00Z"
  }
  ```
- **Errors**:
  - 400: Invalid message or session ID
  - 500: Carol AI service error

### Chat Session Status

**GET** `/api/chat/status?sessionId=<sessionId>`
- **Auth**: Not required
- **Purpose**: Check if session has unread messages
- **Response**:
  ```json
  {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "hasUnread": false,
    "lastMessage": {
      "text": "Confirmed for tomorrow at 10am",
      "timestamp": "2026-04-09T10:30:00Z"
    }
  }
  ```

### Carol AI Query (Internal)

**POST** `/api/carol/query`
- **Auth**: Required (internal use)
- **Purpose**: Direct LLM query for system use
- **Body**:
  ```json
  {
    "query": "What is the customer asking for?",
    "context": {
      "customer": { "name": "John", "address": "..." },
      "history": ["previous message 1", "previous message 2"]
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "response": "The customer is asking to...",
    "intent": "booking",
    "confidence": 0.95
  }
  ```

### Carol AI Actions (Internal)

**POST** `/api/carol/actions`
- **Auth**: Required
- **Purpose**: Execute Carol-triggered actions
- **Body**:
  ```json
  {
    "actionType": "create_appointment",
    "payload": {
      "customerPhone": "+15551234567",
      "serviceType": "house_cleaning",
      "date": "2026-04-15",
      "time": "10:00"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "appointmentId": "appt-123",
    "confirmationCode": "CHQ-2026-001"
  }
  ```

---

## Webhooks

### Incoming Webhook from n8n

**POST** `/api/webhook/n8n`
- **Auth**: HMAC verification via `x-webhook-secret` header
- **Purpose**: Process events from n8n automation
- **Headers**:
  ```
  x-webhook-secret: <HMAC-SHA256 signature>
  Content-Type: application/json
  ```
- **Supported Events**:
  - `lead_created` — New lead from form/chat
  - `appointment_completed` — Service finished
  - `payment_received` — Invoice paid
  - `customer_feedback` — Satisfaction survey
  - `appointment_reminder` — Reminder to be sent
  - `recurring_appointment` — Auto-created recurrence

- **Example - Lead Created**:
  ```json
  {
    "event": "lead_created",
    "timestamp": "2026-04-09T10:30:00Z",
    "payload": {
      "leadId": "lead-123",
      "name": "John Doe",
      "phone": "+15551234567",
      "email": "john@example.com",
      "address": "123 Main St, Charlotte, NC",
      "serviceType": "house_cleaning",
      "preferredDate": "2026-04-15",
      "notes": "First time customer"
    }
  }
  ```

- **Example - Appointment Completed**:
  ```json
  {
    "event": "appointment_completed",
    "timestamp": "2026-04-09T10:30:00Z",
    "payload": {
      "appointmentId": "appt-123",
      "customerId": "cust-456",
      "serviceType": "house_cleaning",
      "amount": 150.00,
      "duration": 120,
      "rating": 5,
      "notes": "Customer very satisfied"
    }
  }
  ```

- **Response**:
  ```json
  {
    "success": true,
    "processed": true,
    "message": "Event processed successfully"
  }
  ```

- **Signature Verification** (server-side):
  ```javascript
  const crypto = require('crypto');
  const secret = process.env.N8N_WEBHOOK_SECRET;
  const payload = req.rawBody; // Raw request body
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  const headerSignature = req.headers['x-webhook-secret'];
  if (signature !== headerSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  ```

---

## Notifications

### Send Notification

**POST** `/api/notifications/send`
- **Auth**: Required + CRON_SECRET
- **Purpose**: Send SMS/WhatsApp message via Twilio
- **Body**:
  ```json
  {
    "phone": "+15551234567",
    "message": "Your appointment is confirmed for tomorrow at 10am",
    "type": "appointment_reminder"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "messageSid": "SM1234567890abcdef",
    "status": "sent"
  }
  ```

### Send Cron - Reminders

**POST** `/api/cron/reminders`
- **Auth**: CRON_SECRET (must match `process.env.CRON_SECRET`)
- **Header**:
  ```
  Authorization: Bearer <CRON_SECRET>
  ```
- **Purpose**: Send appointment reminders (called by external scheduler)
- **Triggered by**: External cron service (e.g., Easypanel Cron, AWS Lambda, n8n)
- **Response**:
  ```json
  {
    "success": true,
    "remindersSent": 5,
    "timestamp": "2026-04-09T10:30:00Z"
  }
  ```

### Send Cron - Recurrences

**POST** `/api/cron/recurrences`
- **Auth**: CRON_SECRET
- **Purpose**: Create recurring appointments (e.g., bi-weekly cleaning)
- **Response**:
  ```json
  {
    "success": true,
    "appointmentsCreated": 3,
    "timestamp": "2026-04-09T10:30:00Z"
  }
  ```

### Send Cron - Cleanup Logs

**POST** `/api/cron/cleanup-logs`
- **Auth**: CRON_SECRET
- **Purpose**: Archive/delete old chat logs (data retention)
- **Response**:
  ```json
  {
    "success": true,
    "logsDeleted": 150,
    "timestamp": "2026-04-09T10:30:00Z"
  }
  ```

---

## Analytics & Tracking

### Track Event

**POST** `/api/tracking/event`
- **Auth**: Not required (public)
- **Purpose**: Track user behavior (for Google Analytics, Facebook Pixel, etc.)
- **Body**:
  ```json
  {
    "eventName": "Lead",
    "eventId": "lead_form_12345",
    "eventSourceUrl": "https://chesquecleaning.com/",
    "timestamp": "2026-04-09T10:30:00Z"
  }
  ```
- **Response**:
  ```json
  { "success": true }
  ```

### Tracking Config

**GET** `/api/tracking/config`
- **Auth**: Not required
- **Purpose**: Get tracking configuration (GA ID, Pixel IDs)
- **Response**:
  ```json
  {
    "googleAnalyticsId": "G-XXXXXXXXXX",
    "facebookPixelId": "123456789",
    "conversionPixels": [
      { "name": "lead", "id": "..." }
    ]
  }
  ```

---

## Configuration

### Public Config

**GET** `/api/config/public`
- **Auth**: Not required
- **Purpose**: Get public app configuration (services, pricing, hours)
- **Response**:
  ```json
  {
    "company": {
      "name": "Chesque Premium Cleaning",
      "phone": "+15551234567",
      "email": "hello@chesquecleaning.com"
    },
    "services": [
      {
        "id": "house_cleaning",
        "name": "House Cleaning",
        "description": "Comprehensive home cleaning",
        "basePrice": 150,
        "durationMinutes": 120
      }
    ],
    "operatingHours": {
      "monday": { "open": "08:00", "close": "20:00" },
      "tuesday": { "open": "08:00", "close": "20:00" },
      "wednesday": { "open": "08:00", "close": "20:00" },
      "thursday": { "open": "08:00", "close": "20:00" },
      "friday": { "open": "08:00", "close": "20:00" },
      "saturday": { "open": "09:00", "close": "18:00" },
      "sunday": { "open": "closed", "close": "closed" }
    }
  }
  ```

### Pricing

**GET** `/api/pricing`
- **Auth**: Not required
- **Purpose**: Get current pricing structure
- **Response**:
  ```json
  {
    "services": [
      {
        "id": "house_cleaning",
        "name": "House Cleaning",
        "pricing": [
          {
            "size": "small",
            "bedrooms": "1-2",
            "price": 120,
            "estimatedMinutes": 90
          },
          {
            "size": "medium",
            "bedrooms": "3-4",
            "price": 150,
            "estimatedMinutes": 120
          }
        ]
      }
    ]
  }
  ```

### Available Slots

**GET** `/api/slots?service=house_cleaning&date=2026-04-15`
- **Auth**: Not required
- **Purpose**: Get available appointment slots for a date
- **Query Parameters**:
  - `service`: Service ID (required)
  - `date`: Date in YYYY-MM-DD format (required)
  - `duration`: Override duration in minutes (optional)

- **Response**:
  ```json
  {
    "date": "2026-04-15",
    "service": "house_cleaning",
    "slots": [
      { "time": "08:00", "available": true },
      { "time": "09:00", "available": true },
      { "time": "10:00", "available": false },
      { "time": "11:00", "available": true }
    ]
  }
  ```

### Contact Form

**POST** `/api/contact`
- **Auth**: Not required
- **Purpose**: Submit contact/lead form
- **Body**:
  ```json
  {
    "name": "John Doe",
    "phone": "+15551234567",
    "email": "john@example.com",
    "message": "I need cleaning services",
    "serviceType": "house_cleaning",
    "preferredDate": "2026-04-15"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "leadId": "lead-123",
    "message": "Thank you! We'll be in touch soon."
  }
  ```

---

## Admin Routes

### Chat Logs

**GET** `/api/admin/chat-logs?limit=20&offset=0`
- **Auth**: Required
- **Purpose**: Get paginated chat logs
- **Query Parameters**:
  - `limit`: Results per page (default: 20)
  - `offset`: Pagination offset (default: 0)
  - `customerId`: Filter by customer (optional)
  - `dateFrom`: Filter from date (optional)
  - `dateTo`: Filter to date (optional)

- **Response**:
  ```json
  {
    "total": 150,
    "logs": [
      {
        "sessionId": "session-123",
        "customerId": "cust-456",
        "customerName": "John Doe",
        "startTime": "2026-04-09T10:00:00Z",
        "endTime": "2026-04-09T10:15:00Z",
        "messageCount": 8,
        "resolved": true
      }
    ]
  }
  ```

**GET** `/api/admin/chat-logs/[sessionId]`
- **Auth**: Required
- **Purpose**: Get detailed chat session
- **Response**:
  ```json
  {
    "sessionId": "session-123",
    "customerId": "cust-456",
    "messages": [
      {
        "id": "msg-1",
        "sender": "customer",
        "text": "I need help",
        "timestamp": "2026-04-09T10:00:00Z"
      },
      {
        "id": "msg-2",
        "sender": "carol",
        "text": "I'd love to help!",
        "timestamp": "2026-04-09T10:00:30Z"
      }
    ]
  }
  ```

**GET** `/api/admin/chat-logs/[sessionId]/export`
- **Auth**: Required
- **Purpose**: Export chat transcript as PDF/CSV
- **Query Parameters**:
  - `format`: "pdf" or "csv"

- **Response**: File download

---

## Health & Status

### Health Check

**GET** `/api/health`
- **Auth**: Not required
- **Purpose**: Check if app is healthy (database connection OK)
- **Response**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-04-09T10:30:00Z",
    "database": "connected",
    "version": "1.0.0"
  }
  ```

### Ready Check

**GET** `/api/ready`
- **Auth**: Not required
- **Purpose**: Check if app is ready to serve traffic (startup verification)
- **Response**:
  ```json
  {
    "ready": true,
    "timestamp": "2026-04-09T10:30:00Z"
  }
  ```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Invalid email address",
  "details": {
    "field": "email",
    "value": "invalid-email"
  }
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (auth required or invalid) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 429 | Too many requests (rate limited) |
| 500 | Server error |

---

## Rate Limiting

- **Public endpoints** (chat, contact): 10 requests/minute per IP
- **Authenticated endpoints** (admin): 100 requests/minute per user
- **Webhook endpoints**: No limit (verify HMAC signature)

---

## Webhook Setup in n8n

To integrate n8n with this app:

1. **Create HTTP request node** in n8n workflow
2. **Configure request**:
   - Method: `POST`
   - URL: `https://your-app.com/api/webhook/n8n`
   - Headers:
     ```
     Content-Type: application/json
     x-webhook-secret: <HMAC signature of payload>
     ```
3. **Generate HMAC signature** (Node.js):
   ```javascript
   const crypto = require('crypto');
   const secret = process.env.N8N_WEBHOOK_SECRET;
   const payload = JSON.stringify(data);
   const hmac = crypto.createHmac('sha256', secret);
   hmac.update(payload);
   const signature = hmac.digest('hex');
   ```
4. **Test webhook** from n8n interface

---

**Related**: [ARCHITECTURE.md](ARCHITECTURE.md) for system design | [features/CAROL_AI.md](features/CAROL_AI.md) for AI integration
