'use client'

import { useState, useEffect } from 'react'
import { getBusinessSettingsClient } from '@/lib/business-config'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export function FAQ() {
    const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([])
    const [faqTitle, setFaqTitle] = useState('Frequently Asked Questions')
    const [faqSubtitle, setFaqSubtitle] = useState('Common questions about our cleaning services.')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getBusinessSettingsClient()
            if (settings.faq_items) {
                setFaqItems(settings.faq_items)
            }
            if (settings.faq_title) {
                setFaqTitle(settings.faq_title)
            }
            if (settings.faq_subtitle) {
                setFaqSubtitle(settings.faq_subtitle)
            }
            setIsLoading(false)
        }
        loadSettings()
    }, [])

    if (isLoading) return null

    return (
        <section id="faq" className="py-12 md:py-16 bg-white">
            <div className="container max-w-3xl">
                <div className="text-center mb-10">
                    <h2 className="font-body text-3xl md:text-4xl text-foreground mb-4 font-bold">
                        {faqTitle}
                    </h2>
                    <p className="text-base text-muted-foreground">
                        {faqSubtitle}
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((faq, index) => (
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
