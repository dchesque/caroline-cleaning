# Development Guide - Chesque Premium Cleaning

**Purpose**: Development workflow, contributing guidelines, and best practices  
**Last Updated**: April 2026

---

## Table of Contents
1. [Development Workflow](#development-workflow)
2. [Code Standards](#code-standards)
3. [Project Structure](#project-structure)
4. [Testing](#testing)
5. [Debugging](#debugging)
6. [Git Workflow](#git-workflow)

---

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

**Output**: App runs on http://localhost:3000

### 2. Make Code Changes

- Edit files in `app/`, `components/`, `lib/`, etc.
- Changes are hot-reloaded (Turbopack)
- TypeScript errors show in terminal + browser overlay

### 3. Test Changes

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### 4. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat(chat): add message history to Carol AI"
```

### 5. Create Pull Request

```bash
git push origin feature-branch
# Then create PR on GitHub
```

---

## Code Standards

### TypeScript

- **Strict mode** enabled (`tsconfig.json`)
- Use explicit types, avoid `any`
- Export types from components

```tsx
// ❌ Bad
export function Button({ props }: any) { ... }

// ✅ Good
export interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) { ... }
```

### React Components

- **Server Components by default** (no `'use client'` unless needed)
- Use `'use client'` only for:
  - Event listeners (onClick, onChange)
  - Hooks (useState, useEffect, useContext)
  - Browser APIs (window, localStorage)

```tsx
// ✅ Server Component (default)
export async function PostList() {
  const posts = await fetchPosts();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}

// ✅ Client Component (with 'use client')
'use client'

export function CommentForm() {
  const [text, setText] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    submitComment(text);
  };
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Styling

- Use **Tailwind CSS** exclusively
- Use `cn()` utility for conditional classes
- Avoid inline styles

```tsx
// ✅ Good
import { cn } from '@/lib/utils';

export function Button({ variant, className }: Props) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200',
        className
      )}
    >
      Click me
    </button>
  );
}

// ❌ Bad
<button style={{ backgroundColor: variant === 'primary' ? 'blue' : 'gray' }} />
```

### File Naming

- **Components**: PascalCase (`ChatWidget.tsx`)
- **Utils**: camelCase (`formatCurrency.ts`)
- **Hooks**: camelCase with `use` prefix (`useChat.ts`)
- **Types**: PascalCase (`ChatMessage.ts`)
- **Folders**: kebab-case (`/components/chat-widget/`)

### Exports

- **Prefer named exports**
- Use index files to organize exports

```tsx
// components/chat/index.tsx
export { ChatWidget } from './chat-widget';
export { ChatMessage } from './chat-message';
export type { ChatMessageProps } from './chat-message';

// Usage
import { ChatWidget, ChatMessage, type ChatMessageProps } from '@/components/chat';
```

### API Routes

- **Validate inputs** with Zod
- **Use Server Actions** for mutations
- **Return consistent response format**

```ts
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = chatSchema.parse(await request.json());
    
    // Process request
    const response = await callCarolAI(body.message);
    
    return Response.json({ success: true, data: response });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Project Structure

### Recommended Organization

```
app/
├── (public)/              # Public pages (no auth required)
│   ├── page.tsx           # Homepage
│   ├── chat/page.tsx      # Fullscreen chat
│   └── layout.tsx         # Public header/footer
│
├── (admin)/               # Protected pages (admin only)
│   ├── admin/page.tsx     # Dashboard
│   ├── admin/agenda/      # Scheduling module
│   └── layout.tsx         # Admin sidebar + header
│
├── api/                   # API routes
│   ├── chat/route.ts      # Chat endpoint
│   ├── webhook/n8n/       # Webhooks
│   └── health/route.ts    # Health check
│
└── layout.tsx             # Root layout (metadata, providers)

components/
├── chat/                  # Chat-related components
│   ├── chat-widget.tsx
│   ├── chat-message.tsx
│   └── index.ts
│
├── admin/                 # Admin panel components
│   ├── admin-header.tsx
│   ├── admin-sidebar.tsx
│   └── index.ts
│
├── ui/                    # Base UI components (shadcn)
│   ├── button.tsx
│   ├── input.tsx
│   └── index.ts
│
└── landing/               # Landing page sections
    ├── hero.tsx
    ├── services.tsx
    └── index.ts

lib/
├── supabase/              # Database clients
│   ├── server.ts
│   └── client.ts
│
├── config/                # Configuration
│   └── webhooks.ts
│
├── actions/               # Server Actions
│   └── webhook.ts
│
└── utils.ts               # Utilities

hooks/
├── use-chat.ts            # Chat state
├── use-webhook.ts         # Webhook notifications
└── use-appointment-form.ts

types/
├── index.ts               # Main type exports
├── webhook.ts             # Webhook types
└── supabase.ts            # Database schema types
```

---

## Testing

### Type Checking

```bash
npm run type-check
```

Catches TypeScript errors without running the app.

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality.

### Manual Testing

1. **Public pages**: http://localhost:3000
2. **Chat**: http://localhost:3000/chat
3. **Admin**: http://localhost:3000/admin (requires login)
4. **API endpoints**: Use curl or Postman

**Example API test**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Carol","sessionId":"test-123"}'
```

### Environment for Testing

Use `.env.local` with test credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key
# ... other test values
```

---

## Debugging

### Browser DevTools

1. Open http://localhost:3000
2. Press F12 to open DevTools
3. Check **Console** for errors
4. Check **Network** tab for API calls
5. Use **Application** tab to inspect localStorage

### Server-side Logging

```ts
import { Logger } from '@/lib/logger';

const logger = new Logger();

// In API route
export async function POST(request: Request) {
  logger.info('Chat request received', { sessionId: body.sessionId });
  
  try {
    const response = await callCarolAI(body.message);
    logger.info('Carol AI responded', { response });
    return Response.json({ data: response });
  } catch (error) {
    logger.error('Chat error', { error });
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### VS Code Debug

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

Then press F5 to start debugging.

### Database Debugging

```bash
# Connect to Supabase directly
psql postgresql://user:password@db.supabase.co:5432/postgres

# View tables
\dt

# Run query
SELECT * FROM clientes;
```

---

## Git Workflow

### Branch Naming

```
feature/chat-improvements
bugfix/login-error
refactor/api-routes
docs/api-documentation
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(chat): add message history to Carol AI
fix(agenda): resolve timezone issue in appointments
refactor(components): simplify button styling
docs(api): add webhook setup instructions
```

### Pull Request Checklist

- [ ] Code follows style guide
- [ ] Type checking passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Changes tested locally
- [ ] Related docs updated (if applicable)
- [ ] Commit messages are descriptive

### Before Merging

1. Ensure all CI checks pass
2. Get code review approval
3. Squash commits if needed
4. Merge to main

---

## Performance Tips

- **Lazy load components**:
  ```tsx
  import dynamic from 'next/dynamic';
  const HeavyComponent = dynamic(() => import('@/components/heavy'), { ssr: false });
  ```

- **Use Server Components** by default (they don't download JavaScript to client)

- **Memoize expensive computations**:
  ```tsx
  const memoizedValue = useMemo(() => expensiveCalculation(a, b), [a, b]);
  ```

- **Check bundle size**:
  ```bash
  npm run build
  # Check .next/static size
  ```

---

## Common Tasks

### Add a New Page

1. Create file: `app/(admin)/admin/newpage/page.tsx`
2. Add to admin sidebar navigation
3. Implement page component
4. Add TypeScript types in `types/`
5. Update `docs/ROUTES_SCREENS.md`

### Add a New API Endpoint

1. Create file: `app/api/newfeature/route.ts`
2. Add Zod validation schema
3. Implement handler
4. Document in `docs/API.md`
5. Test with curl/Postman

### Add a New Component

1. Create directory: `components/feature-name/`
2. Create component file: `component-name.tsx`
3. Create index: `index.ts`
4. Add TypeScript props interface
5. Export from component `index.ts`

### Update Database Schema

1. Create migration file in `supabase/migrations/`
2. Write SQL changes
3. Test migration: `supabase db reset`
4. Update `types/supabase.ts`
5. Document in `docs/DATABASE.md`

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Module not found | Run `npm install` and restart dev server |
| Type errors | Run `npm run type-check` to see all errors |
| Styling not applied | Check class name with `cn()` utility, restart dev server |
| API 404 error | Verify route file location and filename (`route.ts`) |
| Supabase auth fails | Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_*` values |
| Hot reload not working | Restart dev server with Ctrl+C and `npm run dev` |

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Next**: [TESTING.md](TESTING.md) for more testing strategies or [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.
