# DESIGN SYSTEM - CAROLINE PREMIUM CLEANING

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Paleta Base:** Summer Nude

---

## ÍNDICE

- [1. Filosofia de Design](#1-filosofia-de-design)
- [2. Paleta de Cores](#2-paleta-de-cores)
- [3. Tipografia](#3-tipografia)
- [4. Espaçamento](#4-espaçamento)
- [5. Bordas e Sombras](#5-bordas-e-sombras)
- [6. Breakpoints](#6-breakpoints)
- [7. Componentes](#7-componentes)
- [8. Ícones](#8-ícones)
- [9. Animações](#9-animações)
- [10. Configuração Tailwind](#10-configuração-tailwind)
- [11. Exemplos de Uso](#11-exemplos-de-uso)

---

## 1. FILOSOFIA DE DESIGN

### Princípios

| Princípio | Descrição |
|-----------|-----------|
| **Elegância** | Visual sofisticado que transmite premium e confiança |
| **Calma** | Tons neutros que passam tranquilidade e organização |
| **Clareza** | Informação hierarquizada e fácil de ler |
| **Acessibilidade** | Contraste adequado e navegação intuitiva |

### Mood Board

- Casa limpa e organizada
- Luz natural
- Texturas suaves
- Minimalismo acolhedor
- Profissionalismo com toque pessoal

### Tom de Voz Visual

> "Premium, mas acessível. Profissional, mas acolhedor."

---

## 2. PALETA DE CORES

### Cores Principais (Summer Nude)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │          │ │          │ │          │ │          │ │        ││
│  │ DESERT   │ │ PAMPAS   │ │ POT      │ │ AKAROA   │ │ BRANDY ││
│  │ STORM    │ │          │ │ POURRI   │ │          │ │ ROSE   ││
│  │          │ │          │ │          │ │          │ │        ││
│  │ #F8F8F7  │ │ #ECE9E4  │ │ #F3E8DC  │ │ #D8C4B2  │ │ #BE9982││
│  │          │ │          │ │          │ │          │ │        ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                 │
│  Background   Surface     Accent      Muted       Primary      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Aplicação das Cores

| Nome | Hex | RGB | Uso Principal |
|------|-----|-----|---------------|
| **Desert Storm** | `#F8F8F7` | `rgb(248, 248, 247)` | Background principal, fundo de páginas |
| **Pampas** | `#ECE9E4` | `rgb(236, 233, 228)` | Cards, surfaces, inputs, separadores |
| **Pot Pourri** | `#F3E8DC` | `rgb(243, 232, 220)` | Hover states, highlights suaves, badges |
| **Akaroa** | `#D8C4B2` | `rgb(216, 196, 178)` | Bordas, texto secundário, ícones |
| **Brandy Rose** | `#BE9982` | `rgb(190, 153, 130)` | CTA principal, links, elementos de destaque |

### Variações de Intensidade

#### Brandy Rose (Primary)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  50       100      200      300      400      500 (base)        │
│  #FAF7F5  #F2EBE6  #E8D9CF  #D9C1B0  #CCAB96  #BE9982          │
│                                                                 │
│  600      700      800      900      950                        │
│  #A88470  #8F6D5B  #755848  #5E483A  #4A3A2E                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cores Semânticas

| Cor | Hex | Uso |
|-----|-----|-----|
| **Success** | `#6B8E6B` | Confirmações, status ativo, concluído |
| **Success Light** | `#E8F0E8` | Background de alertas success |
| **Warning** | `#D4A574` | Alertas, pendências |
| **Warning Light** | `#FDF6EE` | Background de alertas warning |
| **Error** | `#C17B7B` | Erros, cancelamentos |
| **Error Light** | `#FCF0F0` | Background de alertas error |
| **Info** | `#7B9EB8` | Informações, dicas |
| **Info Light** | `#F0F5F8` | Background de alertas info |

### Cores de Texto

| Tipo | Hex | Uso |
|------|-----|-----|
| **Text Primary** | `#4A3A2E` | Títulos, texto principal |
| **Text Secondary** | `#755848` | Subtítulos, descrições |
| **Text Muted** | `#A88470` | Placeholders, texto auxiliar |
| **Text Inverse** | `#FFFFFF` | Texto sobre fundos escuros |

### Cores dos Tipos de Serviço

| Serviço | Cor | Hex | Badge BG |
|---------|-----|-----|----------|
| Regular | Verde Sage | `#6B8E6B` | `#E8F0E8` |
| Deep | Dourado | `#C4A35A` | `#FAF6EB` |
| Move-in/out | Azul Dusty | `#7B9EB8` | `#F0F5F8` |
| Office | Lavanda | `#9B8BB8` | `#F5F3F8` |
| Airbnb | Coral | `#C4856B` | `#FCF3EF` |
| Visit | Cinza | `#8E8E8E` | `#F5F5F5` |

---

## 3. TIPOGRAFIA

### Font Stack

```css
/* Headings - Elegant Serif */
--font-heading: 'Playfair Display', 'Georgia', serif;

/* Body - Clean Sans */
--font-body: 'Inter', 'Helvetica Neue', sans-serif;

/* Monospace - Code */
--font-mono: 'JetBrains Mono', 'Consolas', monospace;
```

### Escala Tipográfica

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Display                                                        │
│  ═══════════════════════════════════════════════════════════   │
│  48px / 56px / Playfair Display / 600 / -0.02em                │
│                                                                 │
│  H1 - Page Title                                                │
│  ════════════════════════════════════════════════              │
│  36px / 44px / Playfair Display / 600 / -0.02em                │
│                                                                 │
│  H2 - Section Title                                             │
│  ═══════════════════════════════════════                       │
│  28px / 36px / Playfair Display / 600 / -0.01em                │
│                                                                 │
│  H3 - Subsection                                                │
│  ══════════════════════════════                                │
│  22px / 30px / Inter / 600 / 0                                 │
│                                                                 │
│  H4 - Card Title                                                │
│  ═════════════════════════                                     │
│  18px / 26px / Inter / 600 / 0                                 │
│                                                                 │
│  Body Large                                                     │
│  ═══════════════════                                           │
│  18px / 28px / Inter / 400 / 0                                 │
│                                                                 │
│  Body                                                           │
│  ════════════════                                              │
│  16px / 24px / Inter / 400 / 0                                 │
│                                                                 │
│  Body Small                                                     │
│  ════════════                                                  │
│  14px / 20px / Inter / 400 / 0                                 │
│                                                                 │
│  Caption                                                        │
│  ══════════                                                    │
│  12px / 16px / Inter / 400 / 0.01em                            │
│                                                                 │
│  Overline                                                       │
│  ════════                                                      │
│  11px / 16px / Inter / 500 / 0.08em / UPPERCASE                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tabela de Tipografia

| Token | Font | Size | Line Height | Weight | Letter Spacing |
|-------|------|------|-------------|--------|----------------|
| `display` | Playfair Display | 48px | 56px | 600 | -0.02em |
| `h1` | Playfair Display | 36px | 44px | 600 | -0.02em |
| `h2` | Playfair Display | 28px | 36px | 600 | -0.01em |
| `h3` | Inter | 22px | 30px | 600 | 0 |
| `h4` | Inter | 18px | 26px | 600 | 0 |
| `body-lg` | Inter | 18px | 28px | 400 | 0 |
| `body` | Inter | 16px | 24px | 400 | 0 |
| `body-sm` | Inter | 14px | 20px | 400 | 0 |
| `caption` | Inter | 12px | 16px | 400 | 0.01em |
| `overline` | Inter | 11px | 16px | 500 | 0.08em |

---

## 4. ESPAÇAMENTO

### Escala de Espaçamento

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Token    Value    Visual                                       │
│  ─────────────────────────────────────────────────────────────  │
│  0        0        │                                            │
│  px       1px      ▏                                            │
│  0.5      2px      ▎                                            │
│  1        4px      ▍                                            │
│  1.5      6px      ▌                                            │
│  2        8px      █                                            │
│  2.5      10px     █▎                                           │
│  3        12px     █▌                                           │
│  4        16px     ██                                           │
│  5        20px     ██▌                                          │
│  6        24px     ███                                          │
│  8        32px     ████                                         │
│  10       40px     █████                                        │
│  12       48px     ██████                                       │
│  16       64px     ████████                                     │
│  20       80px     ██████████                                   │
│  24       96px     ████████████                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Uso Recomendado

| Contexto | Token | Pixels |
|----------|-------|--------|
| Espaço interno mínimo | `1` | 4px |
| Padding de ícones | `2` | 8px |
| Gap entre elementos inline | `2` | 8px |
| Padding de botões (horizontal) | `4` | 16px |
| Padding de botões (vertical) | `2.5` | 10px |
| Padding de cards | `6` | 24px |
| Gap entre cards | `4` | 16px |
| Margin entre seções | `12` | 48px |
| Padding de página (mobile) | `4` | 16px |
| Padding de página (desktop) | `8` | 32px |
| Margin entre seções (hero) | `20` | 80px |

---

## 5. BORDAS E SOMBRAS

### Border Radius

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  none     sm       base     md       lg       xl       full     │
│                                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐  │
│  │      │ │      │ │      │ │      │ │      │ │      │ │    │  │
│  │      │ │      │ │      │ │      │ │      │ │      │ │    │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └────┘  │
│                                                                 │
│  0        2px      4px      6px      8px      12px     9999px  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Token | Valor | Uso |
|-------|-------|-----|
| `none` | 0 | Elementos sem arredondamento |
| `sm` | 2px | Badges, chips pequenos |
| `DEFAULT` | 4px | Botões, inputs |
| `md` | 6px | Cards, modais |
| `lg` | 8px | Cards grandes |
| `xl` | 12px | Imagens, banners |
| `2xl` | 16px | Elementos destacados |
| `full` | 9999px | Avatars, pills |

### Sombras

```css
/* Sombras suaves para design elegante */

--shadow-sm: 0 1px 2px 0 rgba(74, 58, 46, 0.03);

--shadow-base: 0 1px 3px 0 rgba(74, 58, 46, 0.04),
               0 1px 2px -1px rgba(74, 58, 46, 0.04);

--shadow-md: 0 4px 6px -1px rgba(74, 58, 46, 0.05),
             0 2px 4px -2px rgba(74, 58, 46, 0.05);

--shadow-lg: 0 10px 15px -3px rgba(74, 58, 46, 0.06),
             0 4px 6px -4px rgba(74, 58, 46, 0.06);

--shadow-xl: 0 20px 25px -5px rgba(74, 58, 46, 0.08),
             0 8px 10px -6px rgba(74, 58, 46, 0.08);

--shadow-inner: inset 0 2px 4px 0 rgba(74, 58, 46, 0.04);
```

| Token | Uso |
|-------|-----|
| `shadow-sm` | Inputs em foco, badges |
| `shadow` | Cards, botões hover |
| `shadow-md` | Cards elevados, dropdowns |
| `shadow-lg` | Modais, popovers |
| `shadow-xl` | Elementos flutuantes, dialogs |
| `shadow-inner` | Inputs, elementos pressionados |

### Bordas

```css
/* Border colors */
--border-default: #ECE9E4;     /* Pampas */
--border-muted: #D8C4B2;       /* Akaroa */
--border-focus: #BE9982;       /* Brandy Rose */
--border-hover: #A88470;       /* Brandy Rose 600 */
```

| Tipo | Cor | Uso |
|------|-----|-----|
| Default | `#ECE9E4` | Bordas de cards, inputs, separadores |
| Muted | `#D8C4B2` | Bordas sutis, divisores |
| Focus | `#BE9982` | Ring de foco, seleção |
| Hover | `#A88470` | Hover em elementos com borda |

---

## 6. BREAKPOINTS

### Definição

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  xs        sm        md        lg        xl        2xl          │
│  │         │         │         │         │         │            │
│  │◄──────►│◄───────►│◄───────►│◄───────►│◄───────►│◄────────►  │
│  0   320  375  640  768  1024  1280  1536  ...                  │
│                                                                 │
│  Mobile    Mobile    Tablet    Desktop   Large     Extra        │
│  Small     Large     /iPad     Base      Desktop   Large        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Token | Min Width | Descrição |
|-------|-----------|-----------|
| `xs` | 0 | Mobile pequeno (< 375px) |
| `sm` | 640px | Mobile grande / Landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop grande |
| `2xl` | 1536px | Telas extra grandes |

### Container

| Breakpoint | Max Width | Padding |
|------------|-----------|---------|
| Default | 100% | 16px |
| `sm` | 640px | 24px |
| `md` | 768px | 32px |
| `lg` | 1024px | 32px |
| `xl` | 1280px | 32px |
| `2xl` | 1400px | 32px |

---

## 7. COMPONENTES

### 7.1 Botões

#### Variantes

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PRIMARY                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Schedule Your Cleaning                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│  bg: #BE9982  text: #FFFFFF  hover: #A88470                    │
│                                                                 │
│  SECONDARY                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Learn More                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│  bg: #F3E8DC  text: #755848  hover: #ECE9E4  border: #D8C4B2  │
│                                                                 │
│  OUTLINE                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Cancel                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  bg: transparent  text: #BE9982  border: #BE9982              │
│                                                                 │
│  GHOST                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   View All                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  bg: transparent  text: #BE9982  hover: #FAF7F5               │
│                                                                 │
│  DESTRUCTIVE                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Delete                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  bg: #C17B7B  text: #FFFFFF  hover: #A86B6B                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Tamanhos

| Size | Height | Padding X | Font Size | Icon Size |
|------|--------|-----------|-----------|-----------|
| `sm` | 32px | 12px | 14px | 16px |
| `default` | 40px | 16px | 16px | 20px |
| `lg` | 48px | 24px | 18px | 24px |
| `icon` | 40px | 0 (square) | - | 20px |

#### Estados

```css
/* Primary Button States */
.btn-primary {
  background: #BE9982;
  color: #FFFFFF;
}

.btn-primary:hover {
  background: #A88470;
}

.btn-primary:focus {
  outline: none;
  ring: 2px solid #BE9982;
  ring-offset: 2px;
}

.btn-primary:active {
  background: #8F6D5B;
}

.btn-primary:disabled {
  background: #D8C4B2;
  cursor: not-allowed;
}
```

### 7.2 Inputs

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  DEFAULT                                                        │
│  Email                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ your@email.com                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  bg: #FFFFFF  border: #ECE9E4  text: #4A3A2E                   │
│                                                                 │
│  FOCUSED                                                        │
│  Email                                                          │
│  ┌═════════════════════════════════════════════════════════┐   │
│  │ your@email.com                                          │   │
│  └═════════════════════════════════════════════════════════┘   │
│  border: #BE9982  ring: 2px #BE9982/20                         │
│                                                                 │
│  ERROR                                                          │
│  Email                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ invalid-email                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Please enter a valid email                                    │
│  border: #C17B7B  text-error: #C17B7B                         │
│                                                                 │
│  DISABLED                                                       │
│  Email                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ disabled@email.com                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  bg: #F8F8F7  text: #A88470  cursor: not-allowed              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Especificações

```css
.input {
  height: 44px;
  padding: 10px 14px;
  font-size: 16px;
  background: #FFFFFF;
  border: 1px solid #ECE9E4;
  border-radius: 4px;
  color: #4A3A2E;
  transition: all 150ms ease;
}

.input::placeholder {
  color: #A88470;
}

.input:focus {
  border-color: #BE9982;
  box-shadow: 0 0 0 3px rgba(190, 153, 130, 0.15);
  outline: none;
}
```

### 7.3 Cards

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  DEFAULT CARD                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Card Title                                             │   │
│  │                                                         │   │
│  │  Card description text goes here with more details      │   │
│  │  about the content inside this card.                    │   │
│  │                                                         │   │
│  │                           [Action Button]               │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  bg: #FFFFFF  border: #ECE9E4  shadow: shadow-sm               │
│                                                                 │
│  ELEVATED CARD (hover)                                          │
│  ┌═════════════════════════════════════════════════════════┐   │
│  ║                                                         ║   │
│  ║  Card Title                                             ║   │
│  ║                                                         ║   │
│  ║  Card description text goes here.                       ║   │
│  ║                                                         ║   │
│  └═════════════════════════════════════════════════════════┘   │
│  shadow: shadow-md  transform: translateY(-2px)                │
│                                                                 │
│  HIGHLIGHTED CARD                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │
│  │                                                         │   │
│  │  Featured Service                                       │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  bg: #F3E8DC  border: #D8C4B2                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Badges

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  STATUS BADGES                                                  │
│                                                                 │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌─────────┐  ┌────────┐  │
│  │ Active │  │  Lead  │  │ Paused │  │Canceled │  │Inactive│  │
│  └────────┘  └────────┘  └────────┘  └─────────┘  └────────┘  │
│   #6B8E6B    #BE9982     #D4A574     #C17B7B      #8E8E8E     │
│                                                                 │
│  SERVICE BADGES                                                 │
│                                                                 │
│  ┌─────────┐  ┌──────┐  ┌──────────┐  ┌────────┐  ┌────────┐  │
│  │ Regular │  │ Deep │  │Move-in/out│  │ Office │  │ Airbnb │  │
│  └─────────┘  └──────┘  └──────────┘  └────────┘  └────────┘  │
│   #6B8E6B    #C4A35A    #7B9EB8      #9B8BB8     #C4856B     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Especificações

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
}

.badge-active {
  background: #E8F0E8;
  color: #6B8E6B;
}

.badge-lead {
  background: #FAF7F5;
  color: #BE9982;
}
```

### 7.5 Chat Bubble

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ASSISTANT (Carol)                                              │
│  ┌────────────────────────────────────┐                        │
│  │ Hi! I'm Carol from Caroline        │                        │
│  │ Premium Cleaning. How can I        │                        │
│  │ help you today?                    │                        │
│  └────────────────────────────────────┘                        │
│  🤖 Carol · just now                                           │
│  bg: #F3E8DC  text: #4A3A2E  radius: 16px 16px 16px 4px       │
│                                                                 │
│  USER                                                           │
│                    ┌────────────────────────────────┐          │
│                    │ I'm looking for house cleaning │          │
│                    └────────────────────────────────┘          │
│                                          You · 2:34 PM         │
│  bg: #BE9982  text: #FFFFFF  radius: 16px 16px 4px 16px       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.6 Calendar Event

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │▎ 9:00 AM                                                │   │
│  │▎ Sarah Mitchell                                         │   │
│  │▎ 123 Ocean Dr, Miami Beach                              │   │
│  │▎ Regular · 3BR/2BA                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Regular:    border-left: 4px solid #6B8E6B; bg: #E8F0E8      │
│  Deep:       border-left: 4px solid #C4A35A; bg: #FAF6EB      │
│  Move-in:    border-left: 4px solid #7B9EB8; bg: #F0F5F8      │
│  Visit:      border-left: 4px solid #8E8E8E; bg: #F5F5F5      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.7 Stats Card

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌───────────────────────────┐                                 │
│  │                           │                                 │
│  │  Today's Cleanings        │                                 │
│  │                           │                                 │
│  │         4                 │                                 │
│  │                           │                                 │
│  │  ▲ 2 more than yesterday  │                                 │
│  │                           │                                 │
│  └───────────────────────────┘                                 │
│                                                                 │
│  bg: #FFFFFF                                                   │
│  title: #755848 (text-secondary)                               │
│  value: #4A3A2E (text-primary) / Playfair Display / 36px      │
│  change: #6B8E6B (success)                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. ÍCONES

### Biblioteca

**Lucide React** - Ícones minimalistas que combinam com a estética clean.

```bash
npm install lucide-react
```

### Ícones Principais

| Contexto | Ícone | Nome |
|----------|-------|------|
| Dashboard | 📊 | `LayoutDashboard` |
| Agenda | 📅 | `Calendar` |
| Clientes | 👥 | `Users` |
| Contratos | 📄 | `FileText` |
| Financeiro | 💰 | `DollarSign` |
| Configurações | ⚙️ | `Settings` |
| Chat | 💬 | `MessageCircle` |
| Telefone | 📞 | `Phone` |
| Email | ✉️ | `Mail` |
| Localização | 📍 | `MapPin` |
| Casa | 🏠 | `Home` |
| Limpeza | ✨ | `Sparkles` |
| Adicionar | ➕ | `Plus` |
| Editar | ✏️ | `Pencil` |
| Deletar | 🗑️ | `Trash2` |
| Fechar | ✕ | `X` |
| Check | ✓ | `Check` |
| Alerta | ⚠️ | `AlertTriangle` |
| Info | ℹ️ | `Info` |
| Star | ⭐ | `Star` |
| Clock | 🕐 | `Clock` |
| User | 👤 | `User` |
| Menu | ☰ | `Menu` |
| Search | 🔍 | `Search` |
| Filter | 🔽 | `Filter` |
| Logout | 🚪 | `LogOut` |

### Tamanhos

| Size | Pixels | Uso |
|------|--------|-----|
| `sm` | 16px | Inline com texto, badges |
| `default` | 20px | Botões, inputs |
| `md` | 24px | Cards, navegação |
| `lg` | 32px | Empty states, destacados |
| `xl` | 48px | Hero, features |

---

## 9. ANIMAÇÕES

### Transições Base

```css
/* Transições padrão */
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;

/* Timing functions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Animações Definidas

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide In from Right */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Pulse (typing indicator) */
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* Spin (loading) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Uso

| Contexto | Animação | Duração |
|----------|----------|---------|
| Modal aparecer | `fadeIn` + `slideUp` | 200ms |
| Toast/Notificação | `slideInRight` | 300ms |
| Hover em cards | `transform: translateY(-2px)` | 150ms |
| Botão hover | `background-color` | 150ms |
| Input focus | `border-color`, `box-shadow` | 150ms |
| Typing indicator | `pulse` (dots) | 1.4s infinite |
| Loading spinner | `spin` | 1s infinite |

---

## 10. CONFIGURAÇÃO TAILWIND

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        md: '2rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Summer Nude Palette
        'desert-storm': '#F8F8F7',
        'pampas': '#ECE9E4',
        'pot-pourri': '#F3E8DC',
        'akaroa': '#D8C4B2',
        'brandy-rose': {
          50: '#FAF7F5',
          100: '#F2EBE6',
          200: '#E8D9CF',
          300: '#D9C1B0',
          400: '#CCAB96',
          500: '#BE9982',
          600: '#A88470',
          700: '#8F6D5B',
          800: '#755848',
          900: '#5E483A',
          950: '#4A3A2E',
        },
        
        // Semantic Colors
        background: '#F8F8F7',
        foreground: '#4A3A2E',
        
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#4A3A2E',
        },
        
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#4A3A2E',
        },
        
        primary: {
          DEFAULT: '#BE9982',
          foreground: '#FFFFFF',
          hover: '#A88470',
        },
        
        secondary: {
          DEFAULT: '#F3E8DC',
          foreground: '#755848',
        },
        
        muted: {
          DEFAULT: '#ECE9E4',
          foreground: '#A88470',
        },
        
        accent: {
          DEFAULT: '#F3E8DC',
          foreground: '#755848',
        },
        
        destructive: {
          DEFAULT: '#C17B7B',
          foreground: '#FFFFFF',
          light: '#FCF0F0',
        },
        
        success: {
          DEFAULT: '#6B8E6B',
          foreground: '#FFFFFF',
          light: '#E8F0E8',
        },
        
        warning: {
          DEFAULT: '#D4A574',
          foreground: '#FFFFFF',
          light: '#FDF6EE',
        },
        
        info: {
          DEFAULT: '#7B9EB8',
          foreground: '#FFFFFF',
          light: '#F0F5F8',
        },
        
        border: '#ECE9E4',
        input: '#ECE9E4',
        ring: '#BE9982',
        
        // Service Colors
        service: {
          regular: '#6B8E6B',
          'regular-light': '#E8F0E8',
          deep: '#C4A35A',
          'deep-light': '#FAF6EB',
          move: '#7B9EB8',
          'move-light': '#F0F5F8',
          office: '#9B8BB8',
          'office-light': '#F5F3F8',
          airbnb: '#C4856B',
          'airbnb-light': '#FCF3EF',
          visit: '#8E8E8E',
          'visit-light': '#F5F5F5',
        },
      },
      
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Helvetica Neue', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        'display': ['48px', { lineHeight: '56px', fontWeight: '600', letterSpacing: '-0.02em' }],
        'h1': ['36px', { lineHeight: '44px', fontWeight: '600', letterSpacing: '-0.02em' }],
        'h2': ['28px', { lineHeight: '36px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h3': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        'body': ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        'caption': ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'overline': ['11px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.08em' }],
      },
      
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(74, 58, 46, 0.03)',
        'DEFAULT': '0 1px 3px 0 rgba(74, 58, 46, 0.04), 0 1px 2px -1px rgba(74, 58, 46, 0.04)',
        'md': '0 4px 6px -1px rgba(74, 58, 46, 0.05), 0 2px 4px -2px rgba(74, 58, 46, 0.05)',
        'lg': '0 10px 15px -3px rgba(74, 58, 46, 0.06), 0 4px 6px -4px rgba(74, 58, 46, 0.06)',
        'xl': '0 20px 25px -5px rgba(74, 58, 46, 0.08), 0 8px 10px -6px rgba(74, 58, 46, 0.08)',
        'inner': 'inset 0 2px 4px 0 rgba(74, 58, 46, 0.04)',
      },
      
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-in-right': 'slide-in-right 300ms ease-out',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 97%;
    --foreground: 25 23% 24%;
    
    --card: 0 0% 100%;
    --card-foreground: 25 23% 24%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 25 23% 24%;
    
    --primary: 22 32% 63%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 28 38% 91%;
    --secondary-foreground: 22 23% 39%;
    
    --muted: 30 12% 91%;
    --muted-foreground: 22 23% 55%;
    
    --accent: 28 38% 91%;
    --accent-foreground: 22 23% 39%;
    
    --destructive: 0 30% 62%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 30 12% 91%;
    --input: 30 12% 91%;
    --ring: 22 32% 63%;
    
    --radius: 0.375rem;
  }
  
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground font-sans;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  h1, h2 {
    @apply font-heading;
  }
}

@layer components {
  .container {
    @apply mx-auto px-4 sm:px-6 lg:px-8;
    max-width: 1400px;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

---

## 11. EXEMPLOS DE USO

### Landing Page Hero

```tsx
<section className="bg-desert-storm py-20">
  <div className="container">
    <h1 className="font-heading text-display text-foreground mb-6">
      Premium House Cleaning,
      <br />
      <span className="text-brandy-rose-500">Scheduled in Minutes</span>
    </h1>
    <p className="text-body-lg text-muted-foreground max-w-xl mb-8">
      Professional cleaning service available 24/7. 
      Chat with Carol to book your free estimate.
    </p>
    <button className="bg-primary text-primary-foreground hover:bg-primary-hover px-6 py-3 rounded-md text-body font-medium transition-colors">
      💬 Chat with Carol Now
    </button>
  </div>
</section>
```

### Card de Serviço

```tsx
<div className="bg-card border border-border rounded-md shadow-sm hover:shadow-md transition-shadow p-6">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-full bg-service-regular-light flex items-center justify-center">
      <Sparkles className="w-5 h-5 text-service-regular" />
    </div>
    <h3 className="text-h4 text-foreground">Regular Cleaning</h3>
  </div>
  <p className="text-body-sm text-muted-foreground mb-4">
    Weekly or bi-weekly maintenance cleaning to keep your home fresh.
  </p>
  <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-service-regular-light text-service-regular">
    Most Popular
  </span>
</div>
```

### Chat Bubble

```tsx
{/* Assistant message */}
<div className="flex gap-3 mb-4">
  <div className="w-8 h-8 rounded-full bg-pot-pourri flex items-center justify-center flex-shrink-0">
    <Bot className="w-4 h-4 text-brandy-rose-600" />
  </div>
  <div className="bg-pot-pourri rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
    <p className="text-body text-foreground">
      Hi! I'm Carol from Caroline Premium Cleaning. How can I help you today?
    </p>
  </div>
</div>

{/* User message */}
<div className="flex gap-3 mb-4 justify-end">
  <div className="bg-primary rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
    <p className="text-body text-primary-foreground">
      I'm looking for house cleaning services
    </p>
  </div>
</div>
```

### Status Badge

```tsx
const statusStyles = {
  active: 'bg-success-light text-success',
  lead: 'bg-brandy-rose-50 text-brandy-rose-500',
  paused: 'bg-warning-light text-warning',
  canceled: 'bg-destructive-light text-destructive',
  inactive: 'bg-muted text-muted-foreground',
}

<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium ${statusStyles[status]}`}>
  {status}
</span>
```

### Input com Label

```tsx
<div className="space-y-2">
  <label htmlFor="email" className="text-body-sm font-medium text-foreground">
    Email
  </label>
  <input
    type="email"
    id="email"
    placeholder="your@email.com"
    className="w-full h-11 px-4 text-body bg-white border border-input rounded-sm 
               placeholder:text-muted-foreground
               focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/15
               disabled:bg-desert-storm disabled:cursor-not-allowed
               transition-colors"
  />
</div>
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Configuração Inicial

- [ ] Instalar fontes (Google Fonts: Playfair Display, Inter)
- [ ] Configurar `tailwind.config.ts` com as cores
- [ ] Criar `globals.css` com variáveis CSS
- [ ] Instalar `lucide-react` para ícones
- [ ] Instalar `tailwindcss-animate` para animações

### Componentes shadcn/ui para Customizar

- [ ] Button (variantes primary, secondary, outline, ghost, destructive)
- [ ] Input (estados default, focus, error, disabled)
- [ ] Card (default, elevated, highlighted)
- [ ] Badge (status, service types)
- [ ] Dialog/Modal
- [ ] Dropdown Menu
- [ ] Tabs
- [ ] Table
- [ ] Calendar
- [ ] Toast

### Fontes a Adicionar no Layout

```tsx
// app/layout.tsx
import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-heading',
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

---

**— FIM DO DESIGN SYSTEM —**
