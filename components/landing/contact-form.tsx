'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Phone, User, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useBusinessSettings } from '@/lib/context/business-settings-context'

export function ContactForm() {
    const settings = useBusinessSettings()
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        cidade: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Reset status when user starts typing again
        if (submitStatus !== 'idle') {
            setSubmitStatus('idle')
            setErrorMessage('')
        }
    }

    const formatPhone = (value: string) => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '')

        // Formatar como (XXX) XXX-XXXX
        if (numbers.length <= 3) return numbers
        if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value)
        setFormData(prev => ({ ...prev, telefone: formatted }))
        if (submitStatus !== 'idle') {
            setSubmitStatus('idle')
            setErrorMessage('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMessage('')

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                setSubmitStatus('success')
                setFormData({ nome: '', telefone: '', cidade: '' })
            } else {
                setSubmitStatus('error')
                setErrorMessage(result.error || 'Something went wrong')
            }
        } catch (error) {
            setSubmitStatus('error')
            setErrorMessage('Failed to submit. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="py-16 bg-pot-pourri/30">
            <div className="container">
                <div className="max-w-xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
                            {settings.contact_title || 'Prefer a Callback?'}
                        </h2>
                        <p className="text-muted-foreground">
                            {settings.contact_subtitle || "Leave your info and we'll reach out to you — no chat required."}
                        </p>
                    </div>

                    {/* Success State */}
                    {submitStatus === 'success' ? (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-pampas text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Thank you!
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                We received your info and will contact you soon.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setSubmitStatus('idle')}
                            >
                                Submit Another
                            </Button>
                        </div>
                    ) : (
                        /* Form */
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-pampas"
                        >
                            <div className="space-y-4">
                                {/* Nome */}
                                <div className="space-y-2">
                                    <Label htmlFor="nome" className="text-sm font-medium">
                                        Your Name *
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="nome"
                                            name="nome"
                                            type="text"
                                            placeholder="John Smith"
                                            value={formData.nome}
                                            onChange={handleChange}
                                            required
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Telefone */}
                                <div className="space-y-2">
                                    <Label htmlFor="telefone" className="text-sm font-medium">
                                        Phone Number *
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="telefone"
                                            name="telefone"
                                            type="tel"
                                            placeholder="(555) 123-4567"
                                            value={formData.telefone}
                                            onChange={handlePhoneChange}
                                            required
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Cidade */}
                                <div className="space-y-2">
                                    <Label htmlFor="cidade" className="text-sm font-medium">
                                        City
                                    </Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="cidade"
                                            name="cidade"
                                            type="text"
                                            placeholder="Charlotte, NC"
                                            value={formData.cidade}
                                            onChange={handleChange}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Error Message */}
                                {submitStatus === 'error' && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {errorMessage}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Request a Callback'
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    We'll contact you within 24 hours. No spam, ever.
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </section>
    )
}
