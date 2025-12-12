'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "Do I need to be home during the cleaning?",
        answer: "No, you don't need to be home! Many of our clients provide us with a key or access code. We are fully insured and background checked for your peace of mind.",
    },
    {
        question: "Are your cleaning products safe for pets and children?",
        answer: "Yes! We prioritize the health of your family. We use high-quality, eco-friendly products that are effective yet safe for pets and children.",
    },
    {
        question: "How do I pay for the service?",
        answer: "We accept all major credit cards. Payment is securely processed after the cleaning is completed to your satisfaction.",
    },
    {
        question: "What if I'm not satisfied with the cleaning?",
        answer: "Your satisfaction is our priority. If you're not happy with any aspect of our service, let us know within 24 hours and we will return to reclean the area for free.",
    },
    {
        question: "Do you bring your own supplies?",
        answer: "Yes, we bring all necessary professional-grade equipment and supplies. If you have special products you'd like us to use, just let us know!",
    },
]

export function FAQ() {
    return (
        <section id="faq" className="py-16 md:py-24 bg-white">
            <div className="container max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Common questions about our cleaning services.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-pampas">
                            <AccordionTrigger className="text-left text-foreground hover:text-brandy-rose-600 hover:no-underline">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
