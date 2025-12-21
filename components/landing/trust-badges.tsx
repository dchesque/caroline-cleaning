import { Shield, UserCheck, Sparkles, Clock } from 'lucide-react'

const badges = [
    {
        icon: Shield,
        title: 'Fully Bonded & Insured',
        description: 'Complete protection for your home',
    },
    {
        icon: UserCheck,
        title: 'Background-Checked',
        description: 'Verified through national databases',
    },
    {
        icon: Sparkles,
        title: '100% Satisfaction Guarantee',
        description: 'Not happy? We\'ll re-clean for free',
    },
    {
        icon: Clock,
        title: 'No Contracts Ever',
        description: 'Cancel or pause anytime',
    },
]

export function TrustBadges() {
    return (
        <section className="py-20 bg-white border-y border-pampas">
            <div className="container">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
                    {badges.map((badge) => (
                        <div
                            key={badge.title}
                            className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 hover:scale-105 transition-transform"
                        >
                            <div className="w-16 h-16 rounded-full bg-pot-pourri flex items-center justify-center mb-6 shadow-sm">
                                <badge.icon className="w-8 h-8 text-brandy-rose-600" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3 font-heading">
                                {badge.title}
                            </h3>
                            <p className="text-base text-muted-foreground max-w-[200px] leading-relaxed">
                                {badge.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
