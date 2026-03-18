import Link from 'next/link'
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

import { getBusinessSettingsServer } from '@/lib/business-config-server'
import { Button } from '@/components/ui/button'

async function getFooterData() {
    const supabase = await createClient()

    const settings = await getBusinessSettingsServer()

    const { data: areas } = await supabase
        .from('areas_atendidas')
        .select('nome, cidade')
        .eq('ativo', true)
        .order('nome')

    return {
        config: settings,
        areas: areas || []
    }
}

export async function Footer() {
    const { config, areas } = await getFooterData()

    return (
        <footer className="bg-foreground text-brandy-rose-100 py-12 md:py-16">
            <div className="container">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="inline-block mb-6">
                            <span className="font-heading text-2xl text-white">
                                {config.business_name || 'Chesque'}
                            </span>
                            <br />
                            <span className="font-heading text-2xl text-brandy-rose-400">
                                {config.business_subtitle || 'Premium Cleaning'}
                            </span>
                        </Link>
                        <p className="text-sm text-brandy-rose-200/80 mb-6">
                            {config.business_description || 'Serving Fort Mill, SC, Charlotte, NC, and nearby cities with premium cleaning services tailored to your lifestyle.'}
                        </p>
                        <div className="flex gap-4">
                            {config.social_facebook && (
                                <a href={config.social_facebook} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                                    <Facebook className="w-5 h-5" />
                                </a>
                            )}
                            {config.social_instagram && (
                                <a href={config.social_instagram} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                                    <Instagram className="w-5 h-5" />
                                </a>
                            )}
                            {config.social_twitter && (
                                <a href={config.social_twitter} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                                    <Twitter className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-6">Company</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link href="#services" className="hover:text-white transition-colors">Services</Link></li>
                            <li><Link href="#about" className="hover:text-white transition-colors">About Us</Link></li>
                        </ul>
                    </div>

                    {/* Service Areas (Updated to be dynamic) */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-6">Service Areas</h3>
                        <ul className="space-y-4 text-sm">
                            {areas.length > 0 ? (
                                areas.slice(0, 5).map((area, idx) => (
                                    <li key={idx}>{area.nome}, {area.cidade}</li>
                                ))
                            ) : (
                                <>
                                    <li>Fort Mill, SC</li>
                                    <li>Charlotte, NC</li>
                                    <li>Matthews, NC</li>
                                    <li>Pineville, NC</li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-6">Contact</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex gap-3">
                                <Phone className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                                <a href={`tel:${config.business_phone || '+15513897394'}`} className="hover:text-white transition-colors">
                                    {config.business_phone_display || '(551) 389-7394'}
                                </a>
                            </li>
                            <li className="flex gap-3">
                                <MessageCircle className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                                <a href={`sms:${config.business_phone || '+15513897394'}`} className="hover:text-white transition-colors">
                                    Text: {config.business_phone_display || '(551) 389-7394'}
                                </a>
                            </li>
                            <li className="flex gap-3">
                                <Mail className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                                <span>{config.business_email || 'contact@chesquecleaning.com'}</span>
                            </li>
                            <li className="flex gap-3">
                                <MapPin className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                                <span>{config.business_address || 'Fort Mill, SC • Charlotte, NC'}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brandy-rose-200/60">
                    <p>© {new Date().getFullYear()} {config.business_name || 'Chesque Premium Cleaning'}. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
