import Link from 'next/link'
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-foreground text-brandy-rose-100 py-12 md:py-16">
            <div className="container">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="inline-block mb-6">
                            <span className="font-heading text-2xl text-white">Caroline</span>
                            <br />
                            <span className="font-heading text-2xl text-brandy-rose-400">Premium Cleaning</span>
                        </Link>
                        <p className="text-sm text-brandy-rose-200/80 mb-6">
                            Serving Charlotte, NC, Fort Mill, SC, and nearby cities with premium cleaning services tailored to your lifestyle.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-6">Company</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link href="#services" className="hover:text-white transition-colors">Services</Link></li>
                            <li><Link href="#about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="#careers" className="hover:text-white transition-colors">Careers</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-6">Services</h3>
                        <ul className="space-y-4 text-sm">
                            <li>Regular Cleaning</li>
                            <li>Deep Cleaning</li>
                            <li>Move-in/Move-out</li>
                            <li>Office Cleaning</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-6">Contact</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex gap-3">
                                <Phone className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                                <span>Text: [add later]</span>
                            </li>
                            <li className="flex gap-3">
                                <Mail className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                                <span>contact@carolinecleaning.com</span>
                            </li>
                            <li className="flex gap-3">
                                <MapPin className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                                <span>Charlotte, NC • Fort Mill, SC<br />Nearby cities</span>
                            </li>
                            <li className="text-brandy-rose-200/80 pt-2 border-t border-white/5">
                                Hours: By appointment
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brandy-rose-200/60">
                    <p>© 2024 Caroline Premium Cleaning. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
