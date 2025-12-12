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
                        <span className="font-heading text-xl md:text-2xl font-semibold text-brandy-rose-600">
                            Caroline
                        </span>
                        <span className="hidden sm:inline font-heading text-xl md:text-2xl text-foreground">
                            Premium Cleaning
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => scrollToSection('services')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Services
                        </button>
                        <button
                            onClick={() => scrollToSection('how-it-works')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            How it Works
                        </button>
                        <button
                            onClick={() => scrollToSection('testimonials')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Reviews
                        </button>
                        <button
                            onClick={() => scrollToSection('faq')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            FAQ
                        </button>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <a
                            href="tel:+13055551234"
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Phone className="w-4 h-4" />
                            (305) 555-1234
                        </a>
                        <Button
                            size="sm"
                            className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
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
                        className="md:hidden p-2 text-foreground"
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
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-pampas shadow-lg animate-in slide-in-from-top-2 duration-200">
                        <nav className="container py-4 flex flex-col gap-4">
                            <button
                                onClick={() => scrollToSection('services')}
                                className="text-base font-medium text-left py-2 text-foreground"
                            >
                                Services
                            </button>
                            <button
                                onClick={() => scrollToSection('how-it-works')}
                                className="text-base font-medium text-left py-2 text-foreground"
                            >
                                How it Works
                            </button>
                            <button
                                onClick={() => scrollToSection('testimonials')}
                                className="text-base font-medium text-left py-2 text-foreground"
                            >
                                Reviews
                            </button>
                            <button
                                onClick={() => scrollToSection('faq')}
                                className="text-base font-medium text-left py-2 text-foreground"
                            >
                                FAQ
                            </button>
                            <hr className="border-pampas" />
                            <a
                                href="tel:+13055551234"
                                className="flex items-center gap-2 text-base font-medium py-2 text-foreground"
                            >
                                <Phone className="w-4 h-4" />
                                (305) 555-1234
                            </a>
                            <Button
                                className="gap-2 w-full bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
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
