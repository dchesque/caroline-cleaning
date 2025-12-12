# FASE 3: LANDING PAGE + CHAT UI
## Caroline Premium Cleaning - Plataforma de Atendimento e Gestão

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Duração Estimada:** 4-5 dias  
**Prioridade:** 🔴 CRITICAL  
**Pré-requisito:** Fase 1 e Fase 2 completas

---

## 📋 ÍNDICE

1. [Contexto e Pré-requisitos](#1-contexto-e-pré-requisitos)
2. [Objetivo da Fase 3](#2-objetivo-da-fase-3)
3. [Arquitetura das Rotas Públicas](#3-arquitetura-das-rotas-públicas)
4. [Layout Público](#4-layout-público)
5. [Landing Page - Componentes](#5-landing-page---componentes)
6. [Sistema de Chat](#6-sistema-de-chat)
7. [API Routes](#7-api-routes)
8. [Hooks Customizados](#8-hooks-customizados)
9. [Integração com Supabase](#9-integração-com-supabase)
10. [Responsividade e Mobile](#10-responsividade-e-mobile)
11. [SEO e Performance](#11-seo-e-performance)
12. [Checklist de Validação](#12-checklist-de-validação)

---

## 1. CONTEXTO E PRÉ-REQUISITOS

### 1.1 Resumo do Projeto

**Caroline Premium Cleaning** é uma plataforma de atendimento e gestão para serviços de limpeza residencial/comercial nos EUA (Miami/Florida).

**Objetivo desta fase:** Criar a interface pública que converte visitantes em leads através do chat com Carol (IA).

### 1.2 Pré-requisitos

**Fase 1 completa:**
- [x] Next.js 15 com App Router configurado
- [x] Design System "Summer Nude" implementado
- [x] Componentes shadcn/ui instalados
- [x] Tailwind CSS configurado
- [x] Fontes Playfair Display e Inter

**Fase 2 completa:**
- [x] Todas as tabelas criadas no Supabase
- [x] Funções e views funcionando
- [x] RLS configurado
- [x] Seeds inseridos
- [x] TypeScript types gerados

### 1.3 Persona do Cliente (Referência)

**Sarah Mitchell** - Cliente típica:
- Mulher, 35-55 anos
- Subúrbio americano (Miami)
- Prefere resolver pelo celular/chat
- Espera respostas rápidas (Amazon mindset)
- Valoriza tempo acima de dinheiro

**O que ela quer:**
- Saber se atendem a região dela
- Ter ideia de preço
- Agendar rápido
- Confiar em quem vai entrar na casa

### 1.4 Persona da Carol (IA)

**Carol** - Secretária virtual:
- Simpática, profissional, eficiente
- Tom amigável mas não forçado
- Respostas concisas, não textões
- Uma pergunta por vez
- Sabe quando escalar para humano

**Exemplo de tom:**
```
❌ Errado:
"Hello! 🎉 Welcome to Caroline Premium Cleaning! We are SO EXCITED to hear from you! How can I help you today?! 😊✨"

✅ Certo:
"Hi! I'm Carol from Caroline Premium Cleaning. How can I help you today?"
```

---

## 2. OBJETIVO DA FASE 3

### 2.1 Escopo

Implementar toda a **interface pública** do sistema:

✅ Landing Page completa e responsiva  
✅ Chat Widget flutuante  
✅ Chat Fullscreen (mobile)  
✅ API Route para chat  
✅ Persistência de sessão do chat  
✅ Integração com Supabase (mensagens)  
✅ SEO otimizado  

### 2.2 NÃO está no escopo desta fase

❌ Painel Admin (Fase 4)  
❌ Carol IA real no n8n (Fase 6) - usaremos mock  
❌ Envio de SMS/Email (Fase 6)  
❌ Deploy em produção (Fase 7)  

### 2.3 Entregáveis

Ao final da Fase 3:
1. Landing Page funcionando em `/`
2. Chat Widget abrindo/fechando
3. Chat Fullscreen em `/chat`
4. Mensagens sendo salvas no Supabase
5. Sessão persistida no localStorage
6. Design responsivo (mobile-first)

---

## 3. ARQUITETURA DAS ROTAS PÚBLICAS

### 3.1 Estrutura de Arquivos

```
app/
├── (public)/
│   ├── layout.tsx              # Layout público
│   ├── page.tsx                # / Landing Page
│   └── chat/
│       └── page.tsx            # /chat Fullscreen
│
├── api/
│   ├── chat/
│   │   └── route.ts            # POST /api/chat
│   └── slots/
│       └── route.ts            # GET /api/slots
│
components/
├── landing/
│   ├── header.tsx
│   ├── hero.tsx
│   ├── trust-badges.tsx
│   ├── services.tsx
│   ├── how-it-works.tsx
│   ├── testimonials.tsx
│   ├── faq.tsx
│   ├── cta-section.tsx
│   └── footer.tsx
│
├── chat/
│   ├── chat-widget.tsx
│   ├── chat-window.tsx
│   ├── chat-header.tsx
│   ├── chat-messages.tsx
│   ├── message-bubble.tsx
│   ├── typing-indicator.tsx
│   └── chat-input.tsx
│
hooks/
│   ├── use-chat.ts
│   └── use-chat-session.ts
│
lib/
│   └── chat-session.ts
```

### 3.2 Fluxo de Navegação

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROTAS PÚBLICAS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /  ──────────────────►  Landing Page                          │
│   │                       │                                     │
│   │                       ├── Header (fixo)                     │
│   │                       ├── Hero Section                      │
│   │                       ├── Trust Badges                      │
│   │                       ├── Services                          │
│   │                       ├── How it Works                      │
│   │                       ├── Testimonials                      │
│   │                       ├── FAQ                               │
│   │                       ├── CTA Section                       │
│   │                       └── Footer                            │
│   │                                                             │
│   │   [Chat Widget flutuante em todas as páginas]               │
│   │                                                             │
│   └──►  /chat  ────────►  Chat Fullscreen (mobile-first)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. LAYOUT PÚBLICO

### 4.1 app/(public)/layout.tsx

```tsx
// app/(public)/layout.tsx
import { ChatWidget } from '@/components/chat/chat-widget'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-desert-storm">
      {children}
      <ChatWidget />
    </div>
  )
}
```

---

## 5. LANDING PAGE - COMPONENTES

### 5.1 Página Principal - app/(public)/page.tsx

```tsx
// app/(public)/page.tsx
import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { TrustBadges } from '@/components/landing/trust-badges'
import { Services } from '@/components/landing/services'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Testimonials } from '@/components/landing/testimonials'
import { FAQ } from '@/components/landing/faq'
import { CTASection } from '@/components/landing/cta-section'
import { Footer } from '@/components/landing/footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBadges />
        <Services />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
```

### 5.2 Header - components/landing/header.tsx

```tsx
// components/landing/header.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Phone, MessageCircle, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-heading text-h4 md:text-h3 text-brandy-rose-600">
              Caroline
            </span>
            <span className="hidden sm:inline font-heading text-h4 md:text-h3 text-foreground">
              Premium Cleaning
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('services')}
              className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Reviews
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+13055551234"
              className="flex items-center gap-2 text-body-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-4 h-4" />
              (305) 555-1234
            </a>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                // Trigger chat widget
                window.dispatchEvent(new CustomEvent('open-chat'))
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Chat with Carol
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-pampas shadow-lg animate-slide-up">
            <nav className="container py-4 flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('services')}
                className="text-body text-left py-2"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-body text-left py-2"
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-body text-left py-2"
              >
                Reviews
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-body text-left py-2"
              >
                FAQ
              </button>
              <hr className="border-pampas" />
              <a
                href="tel:+13055551234"
                className="flex items-center gap-2 text-body py-2"
              >
                <Phone className="w-4 h-4" />
                (305) 555-1234
              </a>
              <Button
                className="gap-2 w-full"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  window.dispatchEvent(new CustomEvent('open-chat'))
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Chat with Carol
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
```

### 5.3 Hero - components/landing/hero.tsx

```tsx
// components/landing/hero.tsx
'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Star, Shield, Clock, Award } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  const openChat = () => {
    window.dispatchEvent(new CustomEvent('open-chat'))
  }

  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-pot-pourri/30 to-desert-storm" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-brandy-rose-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pot-pourri rounded-full blur-3xl opacity-30" />

      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm mb-6">
            <span className="flex items-center gap-1 text-caption font-medium text-brandy-rose-600">
              <Star className="w-3.5 h-3.5 fill-brandy-rose-500 text-brandy-rose-500" />
              4.9/5 from 200+ reviews
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-display md:text-[56px] md:leading-[64px] text-foreground mb-6 text-balance">
            Premium House Cleaning,
            <br />
            <span className="text-brandy-rose-500">Scheduled in Minutes</span>
          </h1>

          {/* Subheadline */}
          <p className="text-body-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Professional cleaning service available 24/7. Chat with Carol, our 
            virtual assistant, to book your free estimate — no forms, no waiting.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="gap-2 text-body h-12 px-8"
              onClick={openChat}
            >
              <MessageCircle className="w-5 h-5" />
              Chat with Carol Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-body h-12 px-8"
              asChild
            >
              <Link href="#services">
                Explore Services
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-body-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              <span>Fully Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-success" />
              <span>24/7 Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-success" />
              <span>Satisfaction Guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

### 5.4 Trust Badges - components/landing/trust-badges.tsx

```tsx
// components/landing/trust-badges.tsx
import { Shield, UserCheck, Sparkles, Clock } from 'lucide-react'

const badges = [
  {
    icon: Shield,
    title: 'Fully Insured',
    description: 'Your home is protected',
  },
  {
    icon: UserCheck,
    title: 'Background Checked',
    description: 'Trusted professionals',
  },
  {
    icon: Sparkles,
    title: '100% Satisfaction',
    description: 'Guaranteed results',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Book anytime, 24/7',
  },
]

export function TrustBadges() {
  return (
    <section className="py-12 bg-white border-y border-pampas">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-pot-pourri flex items-center justify-center mb-3">
                <badge.icon className="w-6 h-6 text-brandy-rose-600" />
              </div>
              <h3 className="text-body font-semibold text-foreground mb-1">
                {badge.title}
              </h3>
              <p className="text-caption text-muted-foreground">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### 5.5 Services - components/landing/services.tsx

```tsx
// components/landing/services.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Home, Building2, Key, MessageCircle } from 'lucide-react'

const services = [
  {
    icon: Sparkles,
    title: 'Regular Cleaning',
    description: 'Weekly or bi-weekly maintenance cleaning to keep your home fresh and tidy. Perfect for busy families.',
    badge: 'Most Popular',
    badgeVariant: 'default' as const,
    color: 'text-service-regular',
    bgColor: 'bg-service-regular-light',
    features: ['Dusting & Vacuuming', 'Kitchen & Bathrooms', 'Mopping Floors', 'Making Beds'],
  },
  {
    icon: Sparkles,
    title: 'Deep Cleaning',
    description: 'Thorough top-to-bottom cleaning including hard-to-reach areas. Ideal for first-time or seasonal cleaning.',
    badge: 'Best Value',
    badgeVariant: 'secondary' as const,
    color: 'text-service-deep',
    bgColor: 'bg-service-deep-light',
    features: ['Inside Appliances', 'Baseboards & Blinds', 'Cabinet Fronts', 'Detailed Scrubbing'],
  },
  {
    icon: Home,
    title: 'Move-in/Move-out',
    description: 'Complete cleaning for empty homes. Perfect for moving day or preparing for new tenants.',
    badge: null,
    color: 'text-service-moveinout',
    bgColor: 'bg-service-moveinout-light',
    features: ['Empty Home Cleaning', 'Inside All Cabinets', 'Appliance Cleaning', 'Window Tracks'],
  },
  {
    icon: Building2,
    title: 'Office Cleaning',
    description: 'Professional cleaning for commercial spaces. Keep your workplace clean and productive.',
    badge: null,
    color: 'text-service-office',
    bgColor: 'bg-service-office-light',
    features: ['Workstation Cleaning', 'Common Areas', 'Restroom Sanitation', 'Trash Removal'],
  },
]

export function Services() {
  const openChat = () => {
    window.dispatchEvent(new CustomEvent('open-chat'))
  }

  return (
    <section id="services" className="py-16 md:py-24 bg-desert-storm">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-h1 text-foreground mb-4">
            Our Services
          </h2>
          <p className="text-body-lg text-muted-foreground">
            From regular maintenance to deep cleaning, we offer services tailored 
            to your needs. All backed by our satisfaction guarantee.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {services.map((service) => (
            <Card 
              key={service.title}
              className="relative overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg ${service.bgColor} flex items-center justify-center`}>
                    <service.icon className={`w-6 h-6 ${service.color}`} />
                  </div>
                  {service.badge && (
                    <Badge variant={service.badgeVariant}>
                      {service.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-h4 mt-4">{service.title}</CardTitle>
                <CardDescription className="text-body">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li 
                      key={feature}
                      className="flex items-center gap-2 text-body-sm text-muted-foreground"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${service.color} bg-current`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-body text-muted-foreground mb-4">
            Not sure which service you need? Chat with Carol for a personalized recommendation.
          </p>
          <Button onClick={openChat} className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Get a Free Quote
          </Button>
        </div>
      </div>
    </section>
  )
}
```

### 5.6 How It Works - components/landing/how-it-works.tsx

```tsx
// components/landing/how-it-works.tsx
'use client'

import { MessageCircle, CalendarCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    number: '01',
    icon: MessageCircle,
    title: 'Chat with Carol',
    description: 'Tell us about your home and cleaning needs. Carol, our virtual assistant, is available 24/7 to help.',
  },
  {
    number: '02',
    icon: CalendarCheck,
    title: 'Book Your Visit',
    description: 'Schedule a free 15-minute estimate visit. We\'ll assess your home and provide an accurate quote.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Enjoy Your Clean Home',
    description: 'Relax while our professional team makes your home sparkle. Satisfaction guaranteed!',
  },
]

export function HowItWorks() {
  const openChat = () => {
    window.dispatchEvent(new CustomEvent('open-chat'))
  }

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading text-h1 text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-body-lg text-muted-foreground">
            Getting your home cleaned has never been easier. 
            Three simple steps to a spotless space.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {/* Connector Line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-pampas" />
              )}
              
              {/* Step Number */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-pot-pourri mb-6">
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brandy-rose-500 text-white text-caption font-bold flex items-center justify-center">
                  {step.number}
                </span>
                <step.icon className="w-10 h-10 text-brandy-rose-600" />
              </div>

              {/* Content */}
              <h3 className="text-h4 text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-body text-muted-foreground max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" onClick={openChat} className="gap-2">
            <MessageCircle className="w-5 h-5" />
            Start Now — It's Free
          </Button>
        </div>
      </div>
    </section>
  )
}
```

### 5.7 Testimonials - components/landing/testimonials.tsx

```tsx
// components/landing/testimonials.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Sarah M.',
    location: 'Miami Beach',
    rating: 5,
    text: 'Amazing service! Thayna is professional and thorough. My house has never been cleaner. I love that I can book anytime through Carol.',
    date: 'November 2024',
  },
  {
    id: 2,
    name: 'Jennifer K.',
    location: 'Coral Gables',
    rating: 5,
    text: 'I\'ve tried many cleaning services, but Caroline Premium Cleaning is by far the best. The attention to detail is incredible.',
    date: 'October 2024',
  },
  {
    id: 3,
    name: 'Michael R.',
    location: 'Brickell',
    rating: 5,
    text: 'The convenience of booking through the chat is a game-changer. Fast, professional, and my apartment looks brand new every time.',
    date: 'November 2024',
  },
  {
    id: 4,
    name: 'Amanda L.',
    location: 'Coconut Grove',
    rating: 5,
    text: 'Reliable, trustworthy, and excellent work. I\'ve been using their bi-weekly service for 6 months and couldn\'t be happier.',
    date: 'September 2024',
  },
  {
    id: 5,
    name: 'David S.',
    location: 'Doral',
    rating: 5,
    text: 'Finally found a cleaning service that meets my high standards. The deep cleaning was worth every penny. Highly recommend!',
    date: 'October 2024',
  },
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  const nextSlide = () => {
    setDirection('right')
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setDirection('left')
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-pot-pourri/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-h1 text-foreground mb-4">
            What Our Clients Say
          </h2>
          <p className="text-body-lg text-muted-foreground">
            Don't just take our word for it. Here's what our happy clients have to say.
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="relative overflow-hidden">
            <CardContent className="pt-8 pb-6 px-6 md:px-10">
              {/* Quote Icon */}
              <Quote className="absolute top-6 left-6 w-8 h-8 text-brandy-rose-200" />

              {/* Stars */}
              <div className="flex gap-1 mb-4 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < currentTestimonial.rating
                        ? 'fill-brandy-rose-500 text-brandy-rose-500'
                        : 'text-pampas'
                    }`}
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-body-lg text-foreground text-center mb-6 min-h-[80px]">
                "{currentTestimonial.text}"
              </blockquote>

              {/* Author */}
              <div className="text-center">
                <p className="text-body font-semibold text-foreground">
                  {currentTestimonial.name}
                </p>
                <p className="text-body-sm text-muted-foreground">
                  {currentTestimonial.location} • {currentTestimonial.date}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex
                      ? 'bg-brandy-rose-500'
                      : 'bg-pampas hover:bg-akaroa'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Google Reviews Link */}
        <div className="text-center mt-8">
          <a
            href="https://g.page/r/caroline-cleaning/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-body-sm text-brandy-rose-600 hover:text-brandy-rose-700 transition-colors"
          >
            <Star className="w-4 h-4" />
            See all reviews on Google
          </a>
        </div>
      </div>
    </section>
  )
}
```

### 5.8 FAQ - components/landing/faq.tsx

```tsx
// components/landing/faq.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Do you bring your own cleaning supplies?',
    answer: 'Yes! We bring all cleaning products and equipment needed. Our products are professional-grade and eco-friendly. If you have specific products you\'d prefer us to use, just let us know.',
  },
  {
    question: 'Are you insured?',
    answer: 'Yes, we are fully insured and bonded for your peace of mind. This covers any accidental damage that may occur during our cleaning service.',
  },
  {
    question: 'Do I need to be home during the cleaning?',
    answer: 'Not necessarily! Many of our clients provide us with a key, garage code, or lockbox access. You can also let us in and leave — whatever works best for you.',
  },
  {
    question: 'What if I have pets?',
    answer: 'We love pets! Just let us know about any furry friends so we can be careful with doors and give them extra attention. We\'re experienced working in homes with dogs, cats, and other pets.',
  },
  {
    question: 'How much does it cost?',
    answer: 'Every home is a little different, which is why we offer free estimate visits. Generally, regular cleaning for a 3-bedroom home starts around $150-180. Deep cleaning and other services are priced based on the scope of work.',
  },
  {
    question: 'Can I skip or reschedule a cleaning?',
    answer: 'Of course! We just ask for 24 hours notice to avoid any cancellation fees. You can easily reschedule through Carol, our chat assistant, anytime.',
  },
  {
    question: 'What areas do you serve?',
    answer: 'We currently serve Miami, Miami Beach, Coral Gables, Brickell, Coconut Grove, Doral, and Aventura. Not sure if we cover your area? Just ask Carol!',
  },
  {
    question: 'What forms of payment do you accept?',
    answer: 'We accept Cash and Zelle for your convenience. Payment is due after each cleaning service is completed.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-h1 text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-body-lg text-muted-foreground">
            Got questions? We've got answers. If you don't find what you're 
            looking for, just ask Carol!
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-desert-storm rounded-lg px-6 border-none"
              >
                <AccordionTrigger className="text-body font-medium text-foreground hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-body text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
```

### 5.9 CTA Section - components/landing/cta-section.tsx

```tsx
// components/landing/cta-section.tsx
'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Phone, ArrowRight } from 'lucide-react'

export function CTASection() {
  const openChat = () => {
    window.dispatchEvent(new CustomEvent('open-chat'))
  }

  return (
    <section className="py-16 md:py-24 bg-brandy-rose-500">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-h1 text-white mb-4">
            Ready for a Cleaner Home?
          </h2>
          <p className="text-body-lg text-white/90 mb-8">
            Book your free estimate today. No commitment, no hassle — just a 
            cleaner, happier home waiting for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 text-body h-12 px-8 bg-white text-brandy-rose-600 hover:bg-white/90"
              onClick={openChat}
            >
              <MessageCircle className="w-5 h-5" />
              Chat with Carol
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-body h-12 px-8 border-white text-white hover:bg-white/10"
              asChild
            >
              <a href="tel:+13055551234">
                <Phone className="w-5 h-5" />
                Call (305) 555-1234
              </a>
            </Button>
          </div>

          <p className="text-body-sm text-white/70 mt-6">
            Available 24/7 • Free Estimates • No Contracts Required
          </p>
        </div>
      </div>
    </section>
  )
}
```

### 5.10 Footer - components/landing/footer.tsx

```tsx
// components/landing/footer.tsx
import Link from 'next/link'
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brandy-rose-950 text-white">
      <div className="container py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-heading text-h3 text-white">
                Caroline Premium Cleaning
              </span>
            </Link>
            <p className="text-body text-white/70 max-w-md mb-6">
              Professional house cleaning services in Miami. 
              Making homes sparkle since 2020.
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com/carolinecleaning"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/carolinecleaning"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-body font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#services"
                  className="text-body-sm text-white/70 hover:text-white transition-colors"
                >
                  Our Services
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-body-sm text-white/70 hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="#testimonials"
                  className="text-body-sm text-white/70 hover:text-white transition-colors"
                >
                  Reviews
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-body-sm text-white/70 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-body font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+13055551234"
                  className="flex items-center gap-2 text-body-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  (305) 555-1234
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@carolinecleaning.com"
                  className="flex items-center gap-2 text-body-sm text-white/70 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  hello@carolinecleaning.com
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2 text-body-sm text-white/70">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>
                    Serving Miami, Miami Beach,<br />
                    Coral Gables & surrounding areas
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-caption text-white/50">
              © {currentYear} Caroline Premium Cleaning. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-caption text-white/50 hover:text-white/70 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-caption text-white/50 hover:text-white/70 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

---

## 6. SISTEMA DE CHAT

### 6.1 Chat Widget - components/chat/chat-widget.tsx

```tsx
// components/chat/chat-widget.tsx
'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatWindow } from './chat-window'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useRouter } from 'next/navigation'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const router = useRouter()

  // Listen for open-chat events
  useEffect(() => {
    const handleOpenChat = () => {
      if (isMobile) {
        router.push('/chat')
      } else {
        setIsOpen(true)
      }
    }

    window.addEventListener('open-chat', handleOpenChat)
    return () => window.removeEventListener('open-chat', handleOpenChat)
  }, [isMobile, router])

  // Reset new message indicator when opened
  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (isMobile) {
      router.push('/chat')
    } else {
      setIsOpen(!isOpen)
    }
  }

  return (
    <>
      {/* Chat Window (Desktop only) */}
      {!isMobile && isOpen && (
        <div className="fixed bottom-24 right-6 z-50 animate-slide-up">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleToggle}
          size="lg"
          className={cn(
            'rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all',
            isOpen && !isMobile ? 'bg-muted hover:bg-muted' : ''
          )}
        >
          {isOpen && !isMobile ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6" />
              {hasNewMessage && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white" />
              )}
            </>
          )}
        </Button>

        {/* Tooltip (when closed) */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap animate-fade-in">
            <div className="bg-foreground text-white text-caption px-3 py-1.5 rounded-lg shadow-lg">
              Chat with Carol 💬
              <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-foreground" />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
```

### 6.2 Chat Window - components/chat/chat-window.tsx

```tsx
// components/chat/chat-window.tsx
'use client'

import { useRef, useEffect } from 'react'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { useChat } from '@/hooks/use-chat'
import { Card } from '@/components/ui/card'

interface ChatWindowProps {
  onClose?: () => void
  fullscreen?: boolean
}

export function ChatWindow({ onClose, fullscreen = false }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, sendMessage } = useChat()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const containerClass = fullscreen
    ? 'flex flex-col h-full'
    : 'flex flex-col w-[380px] h-[600px] max-h-[80vh]'

  const content = (
    <div className={containerClass}>
      <ChatHeader onClose={onClose} />
      
      <div className="flex-1 overflow-y-auto bg-desert-storm">
        <ChatMessages messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  )

  if (fullscreen) {
    return content
  }

  return (
    <Card className="overflow-hidden shadow-xl border-pampas">
      {content}
    </Card>
  )
}
```

### 6.3 Chat Header - components/chat/chat-header.tsx

```tsx
// components/chat/chat-header.tsx
'use client'

import { X, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface ChatHeaderProps {
  onClose?: () => void
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-pampas">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 bg-pot-pourri">
          <AvatarFallback className="bg-pot-pourri text-brandy-rose-600 font-semibold">
            C
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-body font-semibold text-foreground">Carol</h3>
          <p className="text-caption text-success flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            Online now
          </p>
        </div>
      </div>
      
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}
```

### 6.4 Chat Messages - components/chat/chat-messages.tsx

```tsx
// components/chat/chat-messages.tsx
'use client'

import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import { ChatMessage } from '@/types'

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  // Show welcome message if no messages
  const showWelcome = messages.length === 0

  return (
    <div className="p-4 space-y-4">
      {showWelcome && (
        <MessageBubble
          role="assistant"
          content="Hi! I'm Carol from Caroline Premium Cleaning. How can I help you today? 😊"
          timestamp={new Date()}
        />
      )}
      
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
          status={message.status}
        />
      ))}
      
      {isLoading && <TypingIndicator />}
    </div>
  )
}
```

### 6.5 Message Bubble - components/chat/message-bubble.tsx

```tsx
// components/chat/message-bubble.tsx
'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, AlertCircle } from 'lucide-react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

export function MessageBubble({ role, content, timestamp, status }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      {!isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-pot-pourri text-brandy-rose-600 text-caption font-semibold">
            C
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-white border border-pampas rounded-bl-sm'
        )}
      >
        <p className="text-body whitespace-pre-wrap">{content}</p>
        
        {/* Timestamp & Status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {formatTime(timestamp)}
          </span>
          
          {isUser && status && (
            <span className="text-primary-foreground/70">
              {status === 'sending' && <Check className="w-3 h-3" />}
              {status === 'sent' && <CheckCheck className="w-3 h-3" />}
              {status === 'error' && <AlertCircle className="w-3 h-3 text-destructive" />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
```

### 6.6 Typing Indicator - components/chat/typing-indicator.tsx

```tsx
// components/chat/typing-indicator.tsx
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="bg-pot-pourri text-brandy-rose-600 text-caption font-semibold">
          C
        </AvatarFallback>
      </Avatar>
      
      <div className="bg-white border border-pampas rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-akaroa animate-pulse-dot" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-akaroa animate-pulse-dot" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-akaroa animate-pulse-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
```

### 6.7 Chat Input - components/chat/chat-input.tsx

```tsx
// components/chat/chat-input.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-pampas">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading}
          className={cn(
            'min-h-[44px] max-h-[120px] resize-none py-3',
            'focus-visible:ring-1 focus-visible:ring-primary'
          )}
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isLoading}
          className="flex-shrink-0 h-11 w-11"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  )
}
```

### 6.8 Chat Fullscreen Page - app/(public)/chat/page.tsx

```tsx
// app/(public)/chat/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ChatWindow } from '@/components/chat/chat-window'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ChatPage() {
  const router = useRouter()

  return (
    <div className="h-screen flex flex-col bg-desert-storm">
      {/* Back Button Header */}
      <div className="flex items-center gap-2 p-4 bg-white border-b border-pampas">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-body font-medium">Back to Home</span>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow fullscreen />
      </div>
    </div>
  )
}
```

---

## 7. API ROUTES

### 7.1 Chat API - app/api/chat/route.ts

```tsx
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge' // Optional: use edge runtime for faster response

interface ChatRequest {
  message: string
  sessionId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, sessionId } = body

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Save user message to database
    const { error: userMsgError } = await supabase
      .from('mensagens_chat')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
    }

    // For now, we'll use a mock response
    // In Phase 6, this will call n8n webhook
    const assistantResponse = await getMockResponse(message)

    // Save assistant message to database
    const { error: assistantMsgError } = await supabase
      .from('mensagens_chat')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: assistantResponse,
      })

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError)
    }

    return NextResponse.json({
      success: true,
      message: assistantResponse,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mock response function - will be replaced by n8n in Phase 6
async function getMockResponse(userMessage: string): Promise<string> {
  const message = userMessage.toLowerCase()

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Simple intent matching
  if (message.includes('price') || message.includes('cost') || message.includes('how much')) {
    return "Every home is a little different, so prices vary based on size and condition. For a typical 3-bedroom home, regular cleaning starts around $150-180. Would you like to schedule a free estimate visit so we can give you an accurate quote?"
  }

  if (message.includes('area') || message.includes('location') || message.includes('zip') || message.includes('where')) {
    return "We currently serve Miami, Miami Beach, Coral Gables, Brickell, Coconut Grove, Doral, and Aventura. What's your zip code? I can check if we cover your area!"
  }

  if (message.includes('book') || message.includes('schedule') || message.includes('appointment')) {
    return "Great! I'd be happy to help you schedule. First, could you tell me your name and the best phone number to reach you?"
  }

  if (message.includes('service') || message.includes('offer') || message.includes('do you')) {
    return "We offer several cleaning services:\n\n• **Regular Cleaning** - Weekly or bi-weekly maintenance\n• **Deep Cleaning** - Thorough top-to-bottom cleaning\n• **Move-in/Move-out** - Perfect for moving day\n• **Office Cleaning** - For commercial spaces\n\nWhich service interests you?"
  }

  if (message.includes('pet') || message.includes('dog') || message.includes('cat')) {
    return "We love pets! 🐕 Just let us know about your furry friends so we can be careful with doors. We're experienced working in homes with all kinds of pets."
  }

  if (message.includes('supply') || message.includes('product') || message.includes('equipment')) {
    return "Yes! We bring all our own cleaning products and equipment. Our products are professional-grade and eco-friendly. If you have specific products you'd prefer us to use, just let us know."
  }

  if (message.includes('insur')) {
    return "Yes, we're fully insured and bonded for your peace of mind. This covers any accidental damage that may occur during our cleaning service."
  }

  if (message.includes('cancel') || message.includes('reschedule')) {
    return "Of course! We just ask for 24 hours notice to avoid any cancellation fees. You can easily reschedule by chatting with me anytime."
  }

  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hello! 👋 Thanks for reaching out to Caroline Premium Cleaning. I'm Carol, your virtual assistant. How can I help you today?"
  }

  if (message.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with?"
  }

  // Default response
  return "Thanks for your message! I'd be happy to help. Are you looking to:\n\n1. Get a quote for cleaning services\n2. Schedule an estimate visit\n3. Learn more about our services\n\nJust let me know!"
}
```

### 7.2 Slots API - app/api/slots/route.ts

```tsx
// app/api/slots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '180')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Call the database function to get available slots
    const { data, error } = await supabase
      .rpc('get_available_slots', {
        p_data: date,
        p_duracao_minutos: duration,
      })

    if (error) {
      console.error('Error fetching slots:', error)
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      date,
      slots: data || [],
    })

  } catch (error) {
    console.error('Slots API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 8. HOOKS CUSTOMIZADOS

### 8.1 useChat Hook - hooks/use-chat.ts

```tsx
// hooks/use-chat.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChatMessage } from '@/types'
import { useChatSession } from './use-chat-session'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { sessionId, loadMessages, saveMessage } = useChatSession()

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = loadMessages()
    if (savedMessages.length > 0) {
      setMessages(savedMessages)
    }
  }, [loadMessages])

  const sendMessage = useCallback(async (content: string) => {
    // Create user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sending',
    }

    // Add user message to state
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId,
        }),
      })

      const data = await response.json()

      // Update user message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      )

      if (data.success) {
        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }

        setMessages((prev) => {
          const newMessages = [...prev, assistantMessage]
          // Save to localStorage
          saveMessage(newMessages)
          return newMessages
        })
      } else {
        throw new Error(data.error || 'Failed to send message')
      }

    } catch (error) {
      console.error('Error sending message:', error)
      // Update user message status to error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, status: 'error' as const }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, saveMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
    localStorage.removeItem(`chat_messages_${sessionId}`)
  }, [sessionId])

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
```

### 8.2 useChatSession Hook - hooks/use-chat-session.ts

```tsx
// hooks/use-chat-session.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChatMessage } from '@/types'

const SESSION_KEY = 'carol_chat_session'
const MESSAGES_KEY = 'carol_chat_messages'

export function useChatSession() {
  const [sessionId, setSessionId] = useState<string>('')

  // Initialize or retrieve session ID
  useEffect(() => {
    let id = localStorage.getItem(SESSION_KEY)
    
    if (!id) {
      id = generateSessionId()
      localStorage.setItem(SESSION_KEY, id)
    }
    
    setSessionId(id)
  }, [])

  const loadMessages = useCallback((): ChatMessage[] => {
    try {
      const saved = localStorage.getItem(`${MESSAGES_KEY}_${sessionId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
    return []
  }, [sessionId])

  const saveMessage = useCallback((messages: ChatMessage[]) => {
    try {
      localStorage.setItem(
        `${MESSAGES_KEY}_${sessionId}`,
        JSON.stringify(messages)
      )
    } catch (error) {
      console.error('Error saving messages:', error)
    }
  }, [sessionId])

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(`${MESSAGES_KEY}_${sessionId}`)
    const newId = generateSessionId()
    localStorage.setItem(SESSION_KEY, newId)
    setSessionId(newId)
  }, [sessionId])

  return {
    sessionId,
    loadMessages,
    saveMessage,
    clearSession,
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
```

### 8.3 useMediaQuery Hook - hooks/use-media-query.ts

```tsx
// hooks/use-media-query.ts
'use client'

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    media.addEventListener('change', listener)

    // Cleanup
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}
```

---

## 9. INTEGRAÇÃO COM SUPABASE

### 9.1 Atualizar types/index.ts

Adicionar os tipos do chat:

```tsx
// types/index.ts (adicionar ao existente)

// Chat Message (local state)
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

// Chat Message (database)
export interface DbChatMessage {
  id: string
  session_id: string
  cliente_id: string | null
  role: 'user' | 'assistant' | 'system'
  content: string
  intent: string | null
  entities: Record<string, any>
  confidence: number | null
  tool_calls: any[]
  tool_results: any[]
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// API Response types
export interface ChatApiResponse {
  success: boolean
  message?: string
  error?: string
}

export interface SlotsApiResponse {
  success: boolean
  date: string
  slots: {
    slot_inicio: string
    slot_fim: string
    disponivel: boolean
  }[]
  error?: string
}
```

---

## 10. RESPONSIVIDADE E MOBILE

### 10.1 Breakpoints de Referência

| Breakpoint | Width | Uso |
|------------|-------|-----|
| Mobile | < 640px | Layout de coluna única |
| Tablet | 640px - 1024px | Grid adaptativo |
| Desktop | > 1024px | Layout completo |

### 10.2 Considerações Mobile

1. **Header**
   - Menu hamburger em mobile
   - Logo reduzido
   - CTAs compactos

2. **Hero**
   - Texto menor
   - CTAs empilhados verticalmente
   - Trust indicators em 2 colunas

3. **Services**
   - Cards em coluna única
   - Scroll horizontal opcional

4. **Chat**
   - Mobile: redireciona para `/chat` (fullscreen)
   - Desktop: widget flutuante

### 10.3 Classes Responsivas Importantes

```tsx
// Exemplos de classes responsivas usadas

// Container
className="container px-4 sm:px-6 lg:px-8"

// Grid
className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"

// Typography
className="text-display md:text-[56px]"

// Visibility
className="hidden md:flex" // Só desktop
className="md:hidden" // Só mobile

// Spacing
className="py-12 md:py-24"

// Flex direction
className="flex flex-col sm:flex-row"
```

---

## 11. SEO E PERFORMANCE

### 11.1 Metadata - app/(public)/page.tsx

```tsx
// app/(public)/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Caroline Premium Cleaning | Professional House Cleaning in Miami',
  description: 'Professional house cleaning services in Miami, Miami Beach, Coral Gables & surrounding areas. Book your free estimate 24/7. Fully insured, satisfaction guaranteed.',
  keywords: [
    'house cleaning Miami',
    'cleaning service Miami Beach',
    'maid service Coral Gables',
    'professional cleaning Florida',
    'deep cleaning Miami',
    'move out cleaning',
    'residential cleaning service',
  ],
  openGraph: {
    title: 'Caroline Premium Cleaning | Professional House Cleaning in Miami',
    description: 'Professional house cleaning services in Miami. Book your free estimate 24/7 through our chat assistant Carol.',
    url: 'https://carolinecleaning.com',
    siteName: 'Caroline Premium Cleaning',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Caroline Premium Cleaning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Caroline Premium Cleaning',
    description: 'Professional house cleaning services in Miami. Book 24/7!',
    images: ['/images/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://carolinecleaning.com',
  },
}
```

### 11.2 Structured Data (JSON-LD)

Adicionar ao `app/(public)/page.tsx`:

```tsx
// Adicionar ao componente HomePage

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Caroline Premium Cleaning',
  description: 'Professional house cleaning services in Miami',
  url: 'https://carolinecleaning.com',
  telephone: '+1-305-555-1234',
  email: 'hello@carolinecleaning.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Miami',
    addressRegion: 'FL',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '25.7617',
    longitude: '-80.1918',
  },
  areaServed: [
    'Miami',
    'Miami Beach',
    'Coral Gables',
    'Brickell',
    'Coconut Grove',
    'Doral',
    'Aventura',
  ],
  priceRange: '$$',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '08:00',
    closes: '18:00',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '200',
  },
}

// No JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

### 11.3 Performance Optimizations

```tsx
// 1. Image Optimization - usar next/image
import Image from 'next/image'

<Image
  src="/images/hero.jpg"
  alt="Clean home"
  width={600}
  height={400}
  priority // Para imagens above-the-fold
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// 2. Font Optimization (já configurado no layout)
import { Playfair_Display, Inter } from 'next/font/google'

// 3. Component lazy loading
import dynamic from 'next/dynamic'

const Testimonials = dynamic(() => import('@/components/landing/testimonials'), {
  loading: () => <div className="animate-pulse h-96 bg-pampas" />,
})

// 4. Prefetch links
import Link from 'next/link'

<Link href="/chat" prefetch>
  Chat
</Link>
```

---

## 12. CHECKLIST DE VALIDAÇÃO

### 12.1 Estrutura de Arquivos

- [ ] `app/(public)/layout.tsx` criado
- [ ] `app/(public)/page.tsx` criado
- [ ] `app/(public)/chat/page.tsx` criado
- [ ] `app/api/chat/route.ts` criado
- [ ] `app/api/slots/route.ts` criado

### 12.2 Componentes Landing Page

- [ ] `components/landing/header.tsx`
- [ ] `components/landing/hero.tsx`
- [ ] `components/landing/trust-badges.tsx`
- [ ] `components/landing/services.tsx`
- [ ] `components/landing/how-it-works.tsx`
- [ ] `components/landing/testimonials.tsx`
- [ ] `components/landing/faq.tsx`
- [ ] `components/landing/cta-section.tsx`
- [ ] `components/landing/footer.tsx`

### 12.3 Componentes Chat

- [ ] `components/chat/chat-widget.tsx`
- [ ] `components/chat/chat-window.tsx`
- [ ] `components/chat/chat-header.tsx`
- [ ] `components/chat/chat-messages.tsx`
- [ ] `components/chat/message-bubble.tsx`
- [ ] `components/chat/typing-indicator.tsx`
- [ ] `components/chat/chat-input.tsx`

### 12.4 Hooks

- [ ] `hooks/use-chat.ts`
- [ ] `hooks/use-chat-session.ts`
- [ ] `hooks/use-media-query.ts`

### 12.5 Funcionalidades

- [ ] Landing Page renderiza corretamente
- [ ] Header fixo com scroll
- [ ] Menu mobile funciona
- [ ] Navegação por seções (scroll suave)
- [ ] Chat Widget abre/fecha
- [ ] Chat redireciona para fullscreen no mobile
- [ ] Mensagens são enviadas
- [ ] Resposta mock retorna
- [ ] Mensagens são salvas no Supabase
- [ ] Sessão persiste no localStorage
- [ ] Typing indicator aparece
- [ ] Scroll automático para novas mensagens

### 12.6 Responsividade

- [ ] Mobile (< 640px) - layout funcional
- [ ] Tablet (640px - 1024px) - grid adapta
- [ ] Desktop (> 1024px) - layout completo
- [ ] Chat Widget: mobile → fullscreen
- [ ] Chat Widget: desktop → popup

### 12.7 SEO

- [ ] Metadata configurada
- [ ] Open Graph tags
- [ ] Twitter Cards
- [ ] JSON-LD structured data
- [ ] Imagens com alt text
- [ ] Links com prefetch

### 12.8 Testes Manuais

```bash
# 1. Iniciar servidor de desenvolvimento
npm run dev

# 2. Acessar http://localhost:3000

# 3. Verificar:
- [ ] Página carrega sem erros
- [ ] Console sem erros
- [ ] Todas as seções visíveis
- [ ] Chat widget aparece
- [ ] Chat abre ao clicar
- [ ] Mensagem pode ser enviada
- [ ] Resposta retorna
- [ ] Mobile: chat vai para /chat
- [ ] Recarregar página: mensagens persistem
```

### 12.9 Verificar no Supabase

```sql
-- Verificar se mensagens estão sendo salvas
SELECT * FROM public.mensagens_chat 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ✅ DEFINIÇÃO DE PRONTO

A Fase 3 está **COMPLETA** quando:

1. ✅ Landing Page completa com todas as seções
2. ✅ Design responsivo (mobile, tablet, desktop)
3. ✅ Header com navegação e menu mobile
4. ✅ Chat Widget funcionando no desktop
5. ✅ Chat Fullscreen funcionando no mobile
6. ✅ Mensagens sendo enviadas e recebidas (mock)
7. ✅ Mensagens salvas no Supabase
8. ✅ Sessão do chat persistida no localStorage
9. ✅ SEO configurado (metadata, OG, JSON-LD)
10. ✅ Sem erros no console
11. ✅ Build passa sem erros (`npm run build`)

---

## 📝 NOTAS IMPORTANTES

1. **Mock responses**: A Carol ainda usa respostas mockadas. A integração real com n8n será na Fase 6.

2. **Imagens**: Criar imagens placeholder ou usar serviço como Unsplash para desenvolvimento.

3. **Testes**: Testar em diferentes navegadores (Chrome, Safari, Firefox).

4. **Acessibilidade**: Verificar navegação por teclado e uso de screen readers.

5. **Analytics**: Preparar para Google Analytics (implementar na Fase 7).

---

## 🔗 PRÓXIMA FASE

Após completar a Fase 3, prossiga para:

**FASE 4: Painel Admin - Core**
- Autenticação (Login)
- Layout Admin com Sidebar
- Dashboard
- Agenda (Calendário)
- CRUD de Clientes

---

**— FIM DA FASE 3 —**
