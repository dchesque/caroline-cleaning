import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy | Chesque Premium Cleaning',
    description: 'Privacy Policy for Chesque Premium Cleaning. Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
    return (
        <main className="py-20 md:py-32">
            <div className="container max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-heading text-foreground mb-8 text-center">Privacy Policy</h1>
                <p className="text-sm text-brandy-rose-400 mb-12 text-center uppercase tracking-widest font-semibold">Last Updated: December 21, 2025</p>

                <div className="prose prose-brandy-rose max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">1. Introduction</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            At Chesque Premium Cleaning ("we," "our," or "us"), we value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, store, and share your data when you visit our website or use our cleaning services in North Carolina and South Carolina.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">2. Information We Collect</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed mb-4">
                            We may collect the following types of personal information:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-brandy-rose-900/80">
                            <li><strong>Contact Details:</strong> Name, email address, phone number, and physical service address.</li>
                            <li><strong>Service Preferences:</strong> Information about your home, cleaning requirements, and scheduling preferences.</li>
                            <li><strong>Payment Information:</strong> We use third-party payment processors to handle secure transactions; we do not store full credit card details on our servers.</li>
                            <li><strong>Device Information:</strong> IP address, browser type, and usage patterns collected via cookies and similar technologies.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">3. How We Use Your Information</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed mb-4">
                            Your information is used to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-brandy-rose-900/80">
                            <li>Provide and manage your cleaning services.</li>
                            <li>Process payments and provide invoices.</li>
                            <li>Communicate with you regarding appointments, updates, and promotions.</li>
                            <li>Improve our website and service offerings.</li>
                            <li>Comply with legal obligations in North Carolina and South Carolina.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">4. Data Sharing and Security</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed mb-4">
                            We do not sell your personal information to third parties. We may share data with trusted service providers who assist us in operating our business (e.g., payment processors, CRM tools).
                        </p>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            We implement industry-standard security measures to protect your data, though no method of electronic transmission is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">5. Your Rights</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            Depending on your location, you may have the right to access, correct, or delete your personal information. You can opt-out of marketing communications at any time by following the unsubscribe instructions in our emails.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">6. Contact Us</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at:
                            <br /><br />
                            <strong>Email:</strong> contact@chesquecleaning.com<br />
                            <strong>Phone:</strong> (551) 389-7394
                        </p>
                    </section>
                </div>
            </div>
        </main>
    )
}
