import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | Carolina Premium Cleaning',
    description: 'Terms of Service for Carolina Premium Cleaning. Understanding our cleaning service agreements, policies, and conditions.',
}

export default function TermsOfServicePage() {
    return (
        <main className="py-20 md:py-32">
            <div className="container max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-heading text-foreground mb-8 text-center">Terms of Service</h1>
                <p className="text-sm text-brandy-rose-400 mb-12 text-center uppercase tracking-widest font-semibold">Last Updated: December 21, 2025</p>

                <div className="prose prose-brandy-rose max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">1. Acceptance of Terms</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            By booking services with Carolina Premium Cleaning, you agree to comply with and be bound by the following terms and conditions. These terms govern our professional relationship with you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">2. Services and Scope</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            We provide premium residential and commercial cleaning services. The specific scope of work is defined during the booking process or in a separate Service Agreement. Any tasks outside the agreed scope may require additional fees and scheduling.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">3. Payments and Cancellation</h2>
                        <ul className="list-disc pl-6 space-y-2 text-brandy-rose-900/80">
                            <li><strong>Payments:</strong> Payment is due upon completion of services unless otherwise agreed. We accept major credit cards and electronic payments.</li>
                            <li><strong>Cancellation Policy:</strong> Please provide at least 24 hours' notice for cancellations or rescheduling. Cancellations made with less than 24 hours' notice may be subject to a cancellation fee.</li>
                            <li><strong>Lock-out Fee:</strong> If our team is unable to access the property at the scheduled time, a lock-out fee may apply.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">4. Client Responsibilities</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed mb-4">
                            To ensure the best possible results, we ask that you:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-brandy-rose-900/80">
                            <li>Provide access to the property (keys, codes, or presence).</li>
                            <li>Secure any pets that may interfere with the cleaning process.</li>
                            <li>Ensure basic utilities (water, electricity, HVAC) are operational.</li>
                            <li>Declutter areas to be cleaned to maximize efficiency.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">5. Satisfaction Guarantee</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            Your satisfaction is our priority. If you are not completely satisfied with an area we cleaned, please notify us within 24 hours. We will return to re-clean the area at no additional cost.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">6. Liability and Damages</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            While we take extreme care, we are not responsible for pre-existing damage, wear and tear, or items not properly secured. We are fully insured for your peace of mind.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">7. Governing Law</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            These terms shall be governed by and construed in accordance with the laws of the State of North Carolina or South Carolina, depending on the location of the service provided.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading text-foreground mb-4">8. Changes to Terms</h2>
                        <p className="text-brandy-rose-900/80 leading-relaxed">
                            Carolina Premium Cleaning reserves the right to update these terms at any time. Changes will be effective immediately upon posting to our website.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    )
}
