// app/(auth)/login/page.tsx
import { LoginCard, type LoginMode } from '@/components/auth/login-card'

const VALID_MODES: LoginMode[] = [
  'password',
  'otp-request',
  'otp-verify',
  'forgot',
  'new-password',
]

const ERROR_MESSAGES: Record<string, string> = {
  recovery_expired:
    'Your reset link has expired or is invalid. Please request a new one.',
}

interface PageProps {
  searchParams: Promise<{ mode?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const mode = (VALID_MODES as string[]).includes(params.mode ?? '')
    ? (params.mode as LoginMode)
    : 'password'
  const initialError = params.error ? ERROR_MESSAGES[params.error] ?? null : null

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Left Side: Login Card */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-desert-storm">
        <LoginCard initialMode={mode} initialError={initialError} />
      </div>

      {/* Right Side: Brand Panel (unchanged) */}
      <div className="hidden bg-muted lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-brandy-rose-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-brandy-rose-950/90 to-brandy-rose-900/50" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="font-heading font-bold text-white">C</span>
            </div>
            <span className="font-heading text-xl font-medium tracking-tight">
              Chesque Premium Cleaning
            </span>
          </div>
          <div className="space-y-6 max-w-lg">
            <blockquote className="space-y-2">
              <p className="font-heading text-3xl leading-snug">
                &ldquo;Efficiency is not just about speed, it&apos;s about
                minimizing the friction for our clients. Manage your operations
                with elegance.&rdquo;
              </p>
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-brandy-rose-900 bg-brandy-rose-800 flex items-center justify-center text-xs font-medium"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-white/80">
                <div className="font-medium text-white">Trusted by our team</div>
                <div>Admin Portal v1.0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
