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
        answer: "We serve Charlotte, NC, Fort Mill, SC, and nearby cities in the surrounding region. Text us your area and we'll confirm availability.",
    },
    {
        question: "Do you clean both homes and offices?",
        answer: "Yes. We offer residential and office cleaning with flexible scheduling options.",
    },
    {
        question: "Are you insured?",
        answer: "Yes — our service is insured for peace of mind.",
    },
    {
        question: "Are your cleaners background-checked?",
        answer: "Yes. We work with vetted professionals you can trust.",
    },
    {
        question: "What's included in a regular cleaning?",
        answer: "A standard clean covers key living areas, kitchen, bathrooms, dusting, and floors. We confirm your checklist by text.",
    },
    {
        question: "What's the difference between deep cleaning and regular cleaning?",
        answer: "Deep cleaning focuses on buildup, detail work, edges, and extra scrubbing — ideal for first-time or seasonal resets.",
    },
    {
        question: "Do you bring supplies and equipment?",
        answer: "Yes — we bring professional supplies and equipment unless you request otherwise.",
    },
    {
        question: "Do you clean homes with pets?",
        answer: "Yes. Just let us know what pets you have so we can plan accordingly.",
    },
    {
        question: "Do I need to be home during the cleaning?",
        answer: "Not necessarily. Many clients provide entry instructions. We'll coordinate everything by text.",
    },
    {
        question: "What if I'm not satisfied?",
        answer: "We offer a satisfaction guarantee — if we miss something, let us know and we'll make it right.",
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
