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
      {/* Left Side: Auth Card with gradient background */}
      <div className="relative flex items-center justify-center min-h-screen lg:min-h-0 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 60% 40%, #E8D9CF 0%, #ECE9E4 40%, #F8F8F7 100%)',
          }}
        />
        {/* Decorative blobs */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-40 blur-3xl"
          style={{ background: '#E8D9CF' }}
        />
        <div
          className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-30 blur-3xl"
          style={{ background: '#D9C1B0' }}
        />
        {/* Glass card */}
        <div className="relative z-10 w-full max-w-[420px]">
          <div
            className="rounded-2xl border border-white/40 shadow-lg p-8 sm:p-10"
            style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(8px)' }}
          >
            {/* Logo mark */}
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="h-10 w-10 rounded-full bg-brandy-rose-500 flex items-center justify-center shadow-sm">
                <span className="font-heading font-bold text-white text-lg">C</span>
              </div>
              <span className="font-heading text-sm font-medium tracking-wide text-brandy-rose-700">
                Chesque Premium
              </span>
            </div>

            <LoginCard initialMode={mode} initialError={initialError} />
          </div>
        </div>
      </div>

      {/* Right Side: Brand Panel Repaginado */}
      <div className="hidden lg:flex relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-brandy-rose-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-brandy-rose-800/80 via-brandy-rose-900 to-brandy-rose-950" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <span className="font-heading font-bold text-white">C</span>
            </div>
            <span className="font-heading text-lg font-medium tracking-tight">
              Chesque Premium Cleaning
            </span>
          </div>

          {/* Center: Tagline */}
          <div className="space-y-4 max-w-sm">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-brandy-rose-300">
              Admin Portal
            </p>
            <h2 className="font-heading text-4xl leading-tight font-semibold">
              Premium cleaning you can trust.
            </h2>
            <p className="text-white/60 text-base leading-relaxed">
              Manage your operations with elegance. Everything you need to run
              a world-class cleaning service, in one place.
            </p>
          </div>

          {/* Bottom: Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '4.9★', label: 'Rating' },
              { value: '150+', label: 'Reviews' },
              { value: '2+', label: 'Years' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
              >
                <p className="font-heading text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/50 mt-1 tracking-wide uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
