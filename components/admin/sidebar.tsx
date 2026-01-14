'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { TranslationKeys } from '@/lib/admin-i18n/translations'
import {
    LayoutDashboard,
    Calendar,
    Users,
    FileText,
    DollarSign,
    Settings,
    Menu,
    MessageSquare,
    BarChart3,
    UserPlus,
    Users2,
    Sparkles,
    Building2,
    Layout,
    Cog,
    ChevronDown
} from 'lucide-react'

type NavigationItem = {
    key: keyof TranslationKeys['sidebar']
    href: string
    icon: any
    submenu?: {
        key: keyof TranslationKeys['sidebar']
        href: string
        icon: any
    }[]
}

const navigation: NavigationItem[] = [
    { key: 'overview', href: '/admin', icon: LayoutDashboard },
    { key: 'scheduling', href: '/admin/agenda', icon: Calendar },
    { key: 'services', href: '/admin/servicos', icon: Sparkles },
    { key: 'clients', href: '/admin/clientes', icon: Users },
    { key: 'leads', href: '/admin/leads', icon: UserPlus },
    { key: 'contracts', href: '/admin/contratos', icon: FileText },
    { key: 'finance', href: '/admin/financeiro', icon: DollarSign },
    { key: 'messages', href: '/admin/mensagens', icon: MessageSquare },
    { key: 'team', href: '/admin/equipe', icon: Users2 },
    { key: 'analytics', href: '/admin/analytics', icon: BarChart3 },
    {
        key: 'settings',
        href: '/admin/configuracoes',
        icon: Settings,
        submenu: [
            { key: 'settingsCompany', href: '/admin/configuracoes/empresa', icon: Building2 },
            { key: 'settingsLanding', href: '/admin/configuracoes/pagina-inicial', icon: Layout },
            { key: 'settingsSystem', href: '/admin/configuracoes/sistema', icon: Cog },
        ]
    },
]

interface SidebarContentProps {
    pathname: string
    onLinkClick?: () => void
}

function SidebarContent({ pathname, onLinkClick }: SidebarContentProps) {
    const { t } = useAdminI18n();
    const sidebar = t('sidebar');
    const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.startsWith('/admin/configuracoes'))

    useEffect(() => {
        if (pathname.startsWith('/admin/configuracoes')) {
            setIsSettingsOpen(true)
        }
    }, [pathname])

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center h-16 px-6 border-b border-[#EAE0D5]">
                <Link href="/admin" className="flex items-center gap-2">
                    <span className="font-heading text-2xl text-[#C48B7F]">Caroline</span>
                    <span className="font-heading text-2xl text-[#5D5D5D]">Admin</span>
                </Link>
            </div>
            <ScrollArea className="flex-1 py-4">
                <nav className="px-3 space-y-1">
                    {navigation.map((item) => {
                        const hasSubmenu = !!item.submenu
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href))

                        if (hasSubmenu) {
                            return (
                                <div key={item.key} className="space-y-1">
                                    <button
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className={cn(
                                            'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                            isActive && !isSettingsOpen
                                                ? 'bg-[#FDF8F6] text-[#C48B7F]'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            {sidebar[item.key]}
                                        </div>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 transition-transform duration-200",
                                            isSettingsOpen && "rotate-180"
                                        )} />
                                    </button>

                                    {isSettingsOpen && (
                                        <div className="pl-4 space-y-1">
                                            {item.submenu?.map((subitem) => {
                                                const isSubActive = pathname === subitem.href
                                                return (
                                                    <Link
                                                        key={subitem.key}
                                                        href={subitem.href}
                                                        onClick={onLinkClick}
                                                        className={cn(
                                                            'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                                                            isSubActive
                                                                ? 'bg-[#FDF8F6] text-[#C48B7F]'
                                                                : 'text-gray-500 hover:bg-gray-50'
                                                        )}
                                                    >
                                                        <subitem.icon className="w-4 h-4" />
                                                        {sidebar[subitem.key]}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                onClick={onLinkClick}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-[#FDF8F6] text-[#C48B7F]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {sidebar[item.key]}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>
        </div>
    )
}

export function Sidebar() {
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const pathname = usePathname()

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-[#EAE0D5]">
                <SidebarContent pathname={pathname} />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden fixed top-3 left-3 z-50"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <SheetTitle className="sr-only">
                        {useAdminI18n().t('sidebar').menu}
                    </SheetTitle>
                    <SidebarContent
                        pathname={pathname}
                        onLinkClick={() => setIsMobileOpen(false)}
                    />
                </SheetContent>
            </Sheet>
        </>
    )
}

