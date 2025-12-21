'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "Which areas do you serve?",
        answer: "We serve Charlotte, NC, Fort Mill, SC, and nearby cities in the surrounding region. Text us your ZIP code and we'll confirm availability.",
    },
    {
        question: "Do you clean both homes and offices?",
        answer: "Yes! We offer residential and office cleaning with flexible scheduling options for both.",
    },
    {
        question: "Are you insured?",
        answer: "Yes — we're fully bonded and insured for your complete peace of mind.",
    },
    {
        question: "Are your cleaners background-checked?",
        answer: "Absolutely. Every team member passes a thorough background check through national databases before joining us.",
    },
    {
        question: "What's your cancellation policy?",
        answer: "Life happens! You can reschedule or cancel with 24-hour notice — no fees, no hassle. We understand plans change.",
    },
    {
        question: "Do I need to sign a contract?",
        answer: "No long-term contracts, ever. You can pause or cancel your service anytime. We believe in earning your business every visit.",
    },
    {
        question: "What's included in a regular cleaning?",
        answer: "A standard clean covers key living areas, kitchen, bathrooms, dusting, and floors. We confirm your exact checklist by text before each appointment.",
    },
    {
        question: "What's the difference between deep cleaning and regular cleaning?",
        answer: "Deep cleaning focuses on buildup, detail work, edges, and extra scrubbing — ideal for first-time cleans or seasonal resets. Regular cleaning maintains that freshness.",
    },
    {
        question: "Do you bring supplies and equipment?",
        answer: "Yes — we bring all professional-grade supplies and equipment. If you prefer we use specific products, just let us know!",
    },
    {
        question: "Do you clean homes with pets?",
        answer: "Of course! Just let us know what pets you have so we can plan accordingly. We love furry friends.",
    },
    {
        question: "Will I have the same cleaner every time?",
        answer: "We aim for consistency! Your preferences and home details are saved and shared with your regular cleaning team. Most clients see the same professionals each visit.",
    },
    {
        question: "Do I need to be home during the cleaning?",
        answer: "Not at all. Many clients provide entry instructions (lockbox, garage code, etc.). We'll coordinate everything by text.",
    },
    {
        question: "What if I'm not satisfied?",
        answer: "We stand behind our work with a 100% satisfaction guarantee. If we miss something, let us know within 24 hours and we'll re-clean the area for free.",
    },
]

export function FAQ() {
    return (
        <section id="faq" className="py-12 md:py-16 bg-white">
            <div className="container max-w-3xl">
                <div className="text-center mb-10">
                    <h2 className="font-body text-3xl md:text-4xl text-foreground mb-4 font-bold">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-base text-muted-foreground">
                        Common questions about our cleaning services.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-pampas">
                            <AccordionTrigger className="text-left text-base font-body text-foreground hover:text-brandy-rose-600 hover:no-underline py-4">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-base font-body text-muted-foreground pb-4">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
