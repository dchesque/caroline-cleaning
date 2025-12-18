import { Shield, UserCheck, Sparkles, Clock } from 'lucide-react'

const badges = [
    {
        icon: Shield,
        title: 'Fully Insured',
        description: 'Your home is protected',
    },
    {
        icon: UserCheck,
        title: 'Background Checked',
        description: 'Trusted professionals',
    },
    {
        icon: Sparkles,
        title: '100% Satisfaction',
        description: 'Guaranteed results',
    },
    {
        icon: Clock,
        title: 'Flexible Scheduling',
        description: 'Book anytime, 24/7',
    },
]

export function TrustBadges() {
    return (
        <section className="py-12 bg-white border-y border-pampas">
            <div className="container">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {badges.map((badge) => (
                        <div
                            key={badge.title}
                            className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 hover:scale-105 transition-transform"
                        >
                            <div className="w-12 h-12 rounded-full bg-pot-pourri flex items-center justify-center mb-3">
                                <badge.icon className="w-6 h-6 text-brandy-rose-600" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground mb-1">
                                {badge.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {badge.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
