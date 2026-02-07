'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
                return
            }

            if (data.user) {
                router.push('/admin')
                router.refresh()
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* Left Side: Login Form */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-desert-storm">
                <div className="mx-auto grid w-full max-w-[400px] gap-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access the admin dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="grid gap-4">
                        {error && (
                            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-white border-pampas focus-visible:ring-brandy-rose-500"
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-muted-foreground"
                                >
                                    Forgot your password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-white border-pampas focus-visible:ring-brandy-rose-500"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-brandy-rose-600 transition-colors">
                            &larr; Back to website
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Side: Brand Panel */}
            <div className="hidden bg-muted lg:block relative overflow-hidden">
                {/* Background Image/Gradient */}
                <div className="absolute inset-0 bg-brandy-rose-900" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandy-rose-950/90 to-brandy-rose-900/50" />

                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />

                <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <span className="font-heading font-bold text-white">C</span>
                        </div>
                        <span className="font-heading text-xl font-medium tracking-tight">Caroline Premium Cleaning</span>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <blockquote className="space-y-2">
                            <p className="font-heading text-3xl leading-snug">
                                &ldquo;Efficiency is not just about speed, it's about minimizing the friction for our clients. Manage your operations with elegance.&rdquo;
                            </p>
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-10 w-10 rounded-full border-2 border-brandy-rose-900 bg-brandy-rose-800 flex items-center justify-center text-xs font-medium">
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
