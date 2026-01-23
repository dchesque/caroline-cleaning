'use client'

import { Check, Plus } from 'lucide-react'
import { useBusinessSettings } from '@/lib/context/business-settings-context'

export function WhatsIncluded() {
    const settings = useBusinessSettings()

    const standardItems = settings.whats_included_standard?.length > 0
        ? settings.whats_included_standard
        : [
            'Kitchen cleaning (sinks and external surfaces)',
            'Bathroom cleaning (sinks, toilets, mirrors, and surfaces)',
            'Cleaning of accessible surfaces',
            'Vacuuming of floors and carpets',
            'Floor cleaning (when applicable)',
            'Trash removal (upon request)',
        ]

    const optionalItems = settings.whats_included_optional?.length > 0
        ? settings.whats_included_optional
        : [
            'Interior oven or refrigerator cleaning',
            'Interior cleaning of empty cabinets',
            'Interior window cleaning',
            'Areas requiring extra attention',
            'Office cleaning outside business hours',
        ]

    return (
        <section className="py-20 bg-white">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
                        {settings.whats_included_title || "What's Included in Every Cleaning"}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {settings.whats_included_subtitle || 'We follow a consistent cleaning standard for every visit. Final details are always confirmed by message before the service.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Standard in Every Visit */}
                    <div className="bg-desert-storm p-8 md:p-10 rounded-3xl border border-pampas shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-xl bg-success/10 text-success">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-foreground">
                                Included in Every Cleaning
                            </h3>
                        </div>
                        <ul className="space-y-4">
                            {standardItems.map((item, index) => (
                                <li key={index} className="flex gap-3 text-base text-muted-foreground italic">
                                    <span className="text-brandy-rose-400 font-bold">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Optional Add-Ons */}
                    <div className="bg-brandy-rose-50 p-8 md:p-10 rounded-3xl border border-brandy-rose-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-xl bg-brandy-rose-500/10 text-brandy-rose-600">
                                <Plus className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-foreground">
                                Additional Services (Extras)
                            </h3>
                        </div>
                        <ul className="space-y-4">
                            {optionalItems.map((item, index) => (
                                <li key={index} className="flex gap-3 text-base text-muted-foreground italic">
                                    <span className="text-brandy-rose-400 font-bold">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}
