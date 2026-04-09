# Routes & Screens - Chesque Premium Cleaning

**Purpose**: Complete map of all application pages and routes  
**Last Updated**: April 2026

---

## Table of Contents
1. [Public Routes](#public-routes)
2. [Protected Routes (Admin)](#protected-routes-admin)
3. [Auth Routes](#auth-routes)
4. [API Routes](#api-routes)
5. [Navigation Structure](#navigation-structure)

---

## Public Routes

Routes accessible to anyone without authentication.

### Landing Page
**Route**: `/`  
**File**: `app/(public)/page.tsx`  
**Layout**: `app/(public)/layout.tsx`

**Sections**:
- Header (logo, phone link, chat CTA)
- Hero section (tagline, "Schedule a Visit" button)
- Services overview
- How it works (3-step process)
- Testimonials (4.9/5 stars, 150+ reviews)
- FAQ section
- Footer (links, contact)

**Features**:
- Embedded chat widget (bottom right)
- Mobile-responsive design
- Hero image/banner
- Service pricing grid

### Chat (Fullscreen)
**Route**: `/chat`  
**File**: `app/(public)/chat/page.tsx`

**Features**:
- Mobile-first chat interface
- Carol AI conversations
- Session persistence
- Booking flow integration
- Message history

**Use Case**: User accesses directly or via widget "Open Chat" button

### Privacy Policy
**Route**: `/privacy`  
**File**: `app/(public)/privacy/page.tsx`

**Content**:
- Data collection practices
- GDPR/CCPA compliance
- Cookie policy

### Terms of Service
**Route**: `/terms`  
**File**: `app/(public)/terms/page.tsx`

**Content**:
- Usage terms
- Liability disclaimers
- Service limitations

### Contract Signing (Public)
**Route**: `/contrato/[id]/assinar`  
**File**: `app/(public)/contrato/[id]/assinar/page.tsx`

**Features**:
- Unauthenticated contract review
- Signature capture
- Contract status display
- Success confirmation

---

## Protected Routes (Admin)

**Access**: Requires Supabase authentication  
**Layout**: `app/(admin)/layout.tsx` (includes sidebar + header)  
**Redirect**: Unauthenticated users → `/login`

### Dashboard
**Route**: `/admin`  
**File**: `app/(admin)/admin/page.tsx`

**Displays**:
- Quick stats (total revenue, leads, appointments)
- Recent bookings
- Pending tasks
- KPI cards
- Quick actions

### Agenda (Scheduling)
**Route**: `/admin/agenda`  
**File**: `app/(admin)/admin/agenda/page.tsx`

**Features**:
- Interactive calendar view
- Day/week/month views
- Appointment creation/edit
- Team member assignment
- Color-coded service types
- Availability slots calculation
- Drag-to-reschedule

**Sub-features**:
- Appointment modal
- Recurring appointment setup
- Travel time calculation

### CRM (Customers)
**Route**: `/admin/clientes`  
**File**: `app/(admin)/admin/clientes/page.tsx`

**Features**:
- Client list with filters
- Search by name/phone/email
- Status indicators (active, inactive, VIP)
- Quick contact actions
- Bulk operations
- Import/export

#### Client Detail
**Route**: `/admin/clientes/[id]`  
**File**: `app/(admin)/admin/clientes/[id]/page.tsx`

**Tabs**:
1. **Info** — Contact details, address, preferences
2. **Financeiro** — Invoice history, payment status
3. **Contratos** — Associated contracts
4. **Agendamentos** — All past/future appointments
5. **Histórico** — Complete interaction log

### Contracts
**Route**: `/admin/contratos`  
**File**: `app/(admin)/admin/contratos/page.tsx`

**Features**:
- Contract templates
- Contract list with status
- Filter by status (draft, signed, expired)
- Bulk send (email templates)
- Archive contracts
- Version history

#### New Contract
**Route**: `/admin/contratos/novo`  
**File**: `app/(admin)/admin/contratos/novo/page.tsx`

**Features**:
- Contract builder
- Template selection
- Custom terms editor
- Client assignment
- Send via email
- Signing workflow

#### Contract Detail
**Route**: `/admin/contratos/[id]`  
**File**: `app/(admin)/admin/contratos/[id]/page.tsx`

**Features**:
- Document viewer
- Status timeline
- Signing status for each party
- Share link generation
- Signature verification

### Financial Module
**Route**: `/admin/financeiro`  
**File**: `app/(admin)/admin/financeiro/page.tsx`

**Displays**:
- Revenue summary
- Expense summary
- Net profit
- Cash flow chart
- Recent transactions
- Quick transaction add

#### Receitas (Income)
**Route**: `/admin/financeiro/receitas`  
**File**: `app/(admin)/admin/financeiro/receitas/page.tsx`

**Features**:
- Income list
- Filter by date range, service, client
- Add/edit income
- Category assignment
- Invoice attachment
- Reconciliation status

#### Despesas (Expenses)
**Route**: `/admin/financeiro/despesas`  
**File**: `app/(admin)/admin/financeiro/despesas/page.tsx`

**Features**:
- Expense list
- Category management
- Vendor tracking
- Receipt attachment
- Budget vs actual
- Recurring expense setup

#### Categorias (Categories)
**Route**: `/admin/financeiro/categorias`  
**File**: `app/(admin)/admin/financeiro/categorias/page.tsx`

**Features**:
- Income categories CRUD
- Expense categories CRUD
- Budget allocation per category
- Category usage reports

#### Relatórios (Reports)
**Route**: `/admin/financeiro/relatorios`  
**File**: `app/(admin)/admin/financeiro/relatorios/page.tsx`

**Reports**:
- P&L statement
- Revenue by service
- Expense breakdown
- Tax summary
- Cash flow forecast
- Export to Excel/PDF

### Analytics
**Route**: `/admin/analytics`  
**File**: `app/(admin)/admin/analytics/page.tsx`

**Overview Dashboard**:
- Key metrics (conversion, revenue, satisfaction)
- Last 30 days summary
- Links to detailed reports

#### Clientes (Customer Analytics)
**Route**: `/admin/analytics/clientes`  
**File**: `app/(admin)/admin/analytics/clientes/page.tsx`

**Metrics**:
- Total customers by status
- New customers (trend)
- Customer lifetime value
- Churn rate
- Repeat customer %

#### Conversão (Conversion Funnel)
**Route**: `/admin/analytics/conversao`  
**File**: `app/(admin)/admin/analytics/conversao/page.tsx`

**Funnel Stages**:
1. Website visitor
2. Chat initiated
3. Quote requested
4. Appointment booked
5. Service completed
6. Invoice paid
7. Repeat booking

#### Receita (Revenue Analytics)
**Route**: `/admin/analytics/receita`  
**File**: `app/(admin)/admin/analytics/receita/page.tsx`

**Metrics**:
- Total revenue (YTD, month, week)
- Average transaction value
- Revenue by service type
- Revenue by customer segment
- Projection vs actual

#### Carol (Chat Analytics)
**Route**: `/admin/analytics/carol`  
**File**: `app/(admin)/admin/analytics/carol/page.tsx`

**Metrics**:
- Chat volume (daily, hourly)
- Avg response time
- Chat resolution rate
- Customer satisfaction (CSAT)
- Common questions
- Unanswered questions

#### Satisfação (Satisfaction)
**Route**: `/admin/analytics/satisfacao`  
**File**: `app/(admin)/admin/analytics/satisfacao/page.tsx`

**Surveys**:
- NPS (Net Promoter Score)
- Customer feedback
- Service quality ratings
- Response rate trends

#### Tendências (Trends)
**Route**: `/admin/analytics/tendencias`  
**File**: `app/(admin)/admin/analytics/tendencias/page.tsx`

**Analysis**:
- Seasonal patterns
- Service popularity trends
- Peak booking times
- Customer acquisition trends

### Messages (Chat Logs)
**Route**: `/admin/mensagens`  
**File**: `app/(admin)/admin/mensagens/page.tsx`

**Features**:
- Chat session list
- Filter by date, customer, status
- Search conversations
- Export transcripts
- Sentiment analysis

#### Message Thread
**Route**: `/admin/mensagens/[sessionId]`  
**File**: `app/(admin)/admin/mensagens/[sessionId]/page.tsx`

**Features**:
- Full conversation history
- Customer details sidebar
- Carol AI response quality indicator
- Manual intervention history
- Note taking

### Chat Logs (Audit)
**Route**: `/admin/chat-logs`  
**File**: `app/(admin)/admin/chat-logs/page.tsx`

**Features**:
- All chat sessions
- Detailed logging
- Timestamp tracking
- Export capability
- Search & filter

#### Chat Log Detail
**Route**: `/admin/chat-logs/[sessionId]`  
**File**: `app/(admin)/admin/chat-logs/[sessionId]/page.tsx`

**Features**:
- Message transcript
- Context & metadata
- Export button
- View/Print

### Services Management
**Route**: `/admin/servicos`  
**File**: `app/(admin)/admin/servicos/page.tsx`

**Features**:
- Service list (cleaning types)
- Pricing per service
- Duration estimation
- Add-ons/extras
- Service availability
- Team capability mapping

### Team Management
**Route**: `/admin/equipe`  
**File**: `app/(admin)/admin/equipe/page.tsx`

**Features**:
- Team member roster
- Availability calendar
- Skills/certifications
- Performance metrics
- Contact information
- Schedule assignments

### Leads
**Route**: `/admin/leads`  
**File**: `app/(admin)/admin/leads/page.tsx`

**Features**:
- Lead list
- Lead source tracking
- Lead status (new, contacted, qualified, lost)
- Lead scoring
- Conversion tracking
- Follow-up reminders

### Account
**Route**: `/admin/conta`  
**File**: `app/(admin)/admin/conta/page.tsx`

**Features**:
- User profile
- Email address
- Change password
- Preferences
- API key management
- Session management

### Settings/Configuration
**Route**: `/admin/configuracoes`  
**File**: `app/(admin)/admin/configuracoes/page.tsx`

**Sub-sections**:

#### Empresa (Company)
**Route**: `/admin/configuracoes/empresa`  
**Features**:
- Business name
- Logo upload
- Phone number
- Address
- Service areas (coverage map)
- Operating hours

#### Equipe (Team)
**Route**: `/admin/configuracoes/equipe`  
**File**: `app/(admin)/admin/configuracoes/equipe/page.tsx`
**Features**:
- Team member management
- Roles & permissions
- Add/remove team members

#### Serviços (Services)
**Route**: `/admin/configuracoes/servicos`  
**File**: `app/(admin)/admin/configuracoes/servicos/page.tsx`
**Features**:
- Service catalog
- Pricing tiers
- Duration estimates
- Service descriptions

#### Pricing
**Route**: `/admin/configuracoes/pricing`  
**File**: `app/(admin)/admin/configuracoes/pricing/page.tsx`
**Features**:
- Pricing structure
- Discount rules
- Promotional pricing
- Seasonal adjustments

#### Áreas (Service Areas)
**Route**: `/admin/configuracoes/areas`  
**File**: `app/(admin)/admin/configuracoes/areas/page.tsx`
**Features**:
- Geographic service areas
- Area-based pricing
- Travel time settings

#### Add-ons
**Route**: `/admin/configuracoes/addons`  
**File**: `app/(admin)/admin/configuracoes/addons/page.tsx`
**Features**:
- Add-on products
- Pricing
- Availability rules

#### Página Inicial (Landing Page)
**Route**: `/admin/configuracoes/pagina-inicial`  
**File**: `app/(admin)/admin/configuracoes/pagina-inicial/page.tsx`
**Features**:
- Hero section text
- Service showcase
- Testimonials management
- FAQ management
- CTA text customization

#### Rastreamento (Tracking)
**Route**: `/admin/configuracoes/trackeamento`  
**File**: `app/(admin)/admin/configuracoes/trackeamento/page.tsx`
**Features**:
- Google Analytics setup
- Conversion pixel management
- UTM tracking
- Event tracking configuration

#### Sistema (System)
**Route**: `/admin/configuracoes/sistema`  
**File**: `app/(admin)/admin/configuracoes/sistema/page.tsx`
**Features**:
- API endpoint status
- System health
- Error logs
- Backup status
- Version information

---

## Auth Routes

### Login
**Route**: `/login`  
**File**: `app/(auth)/login/page.tsx`  
**Layout**: `app/(auth)/layout.tsx`

**Features**:
- Supabase Auth form
- Email/password input
- Sign up link
- Password reset link
- Remember me checkbox
- Error handling
- Loading state

**Redirect**: After successful login → `/admin`

---

## API Routes

### Chat & Carol

**POST** `/api/chat`
- **Input**: `{ message: string, sessionId: string }`
- **Purpose**: Process customer chat message
- **Response**: Carol AI response + session update

**POST** `/api/carol/query`
- **Input**: Carol AI query (internal)
- **Purpose**: Direct LLM query (used by Carol system)
- **Response**: LLM response

**POST** `/api/carol/actions`
- **Input**: Carol AI action (booking, notification)
- **Purpose**: Execute Carol-triggered actions
- **Response**: Action result

**GET/POST** `/api/chat/status`
- **Purpose**: Check chat session status
- **Response**: Session status, unread count

### Configuration

**GET** `/api/config/public`
- **Purpose**: Public app configuration (services, pricing, hours)
- **Response**: Config JSON

**GET** `/api/pricing`
- **Purpose**: Current pricing structure
- **Response**: Pricing tiers

**GET** `/api/slots`
- **Purpose**: Available appointment slots
- **Query**: `?service=cleaning&date=2026-04-15`
- **Response**: Available time slots

### Webhooks

**POST** `/api/webhook/n8n`
- **Input**: Webhook payload from n8n
- **Purpose**: Process incoming automation events
- **Events**: lead_created, appointment_completed, payment_received, etc.
- **Response**: `{ success: true }`

### Notifications

**POST** `/api/notifications/send`
- **Input**: `{ phone: string, message: string }`
- **Purpose**: Send SMS/WhatsApp via Twilio
- **Response**: Message SID

**POST** `/api/cron/reminders`
- **Purpose**: Send appointment reminders
- **Trigger**: Scheduled (CRON)
- **Response**: Number sent

**POST** `/api/cron/recurrences`
- **Purpose**: Create recurring appointments
- **Trigger**: Scheduled (CRON)
- **Response**: Appointments created

### Tracking

**POST** `/api/tracking/event`
- **Input**: Analytics event
- **Purpose**: Track user behavior (GA, Facebook Pixel)
- **Response**: `{ tracked: true }`

**POST** `/api/contact`
- **Input**: Contact form submission
- **Purpose**: Process lead form
- **Response**: Lead created confirmation

### Admin Endpoints

**GET/POST** `/api/admin/chat-logs`
- **Purpose**: Fetch/manage chat logs
- **Response**: Chat logs array

**GET** `/api/admin/chat-logs/[sessionId]`
- **Purpose**: Get specific chat session details
- **Response**: Session details

**GET** `/api/admin/chat-logs/[sessionId]/export`
- **Purpose**: Export chat transcript
- **Response**: CSV/PDF file

### Utility

**GET** `/api/health`
- **Purpose**: Health check (Supabase connection)
- **Response**: `{ status: "healthy" }`

**GET** `/api/ready`
- **Purpose**: Readiness check (startup)
- **Response**: `{ ready: true }`

**GET** `/api/profile`
- **Purpose**: Get current user profile
- **Response**: User profile object

**PUT** `/api/profile`
- **Purpose**: Update user profile
- **Input**: Profile data
- **Response**: Updated profile

**POST** `/api/profile/password`
- **Purpose**: Change password
- **Input**: Old password, new password
- **Response**: `{ success: true }`

---

## Navigation Structure

### Public Navigation
```
/ (Home)
├── Chat Widget (overlay)
├── /chat (fullscreen chat)
├── /privacy
├── /terms
└── /login (admin login)
```

### Admin Sidebar Navigation
```
/admin (Dashboard)
├── Agenda (Scheduling)
├── Clientes (CRM)
├── Contratos (Contracts)
├── Financeiro (Financial)
│   ├── Receitas (Income)
│   ├── Despesas (Expenses)
│   ├── Categorias (Categories)
│   └── Relatórios (Reports)
├── Analytics
│   ├── Visão Geral (Overview)
│   ├── Clientes (Customer)
│   ├── Conversão (Funnel)
│   ├── Receita (Revenue)
│   ├── Carol (Chat)
│   ├── Satisfação (Satisfaction)
│   └── Tendências (Trends)
├── Mensagens (Messages)
├── Chat Logs (Audit)
├── Leads (Pipeline)
├── Serviços (Services)
├── Equipe (Team)
├── Configurações (Settings)
│   ├── Empresa (Company)
│   ├── Equipe (Team)
│   ├── Serviços (Services)
│   ├── Pricing
│   ├── Áreas (Areas)
│   ├── Add-ons
│   ├── Página Inicial (Landing)
│   ├── Rastreamento (Tracking)
│   └── Sistema (System)
└── Conta (Account)
```

---

**Related**: [ARCHITECTURE.md](ARCHITECTURE.md) for technical implementation details.
