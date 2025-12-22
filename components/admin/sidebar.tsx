'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
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
    Users2  // Ícone para Equipe
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Agenda', href: '/admin/agenda', icon: Calendar },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Leads', href: '/admin/leads', icon: UserPlus },
    { name: 'Contratos', href: '/admin/contratos', icon: FileText },
    { name: 'Financeiro', href: '/admin/financeiro', icon: DollarSign },
    { name: 'Mensagens', href: '/admin/mensagens', icon: MessageSquare },
    { name: 'Equipe', href: '/admin/equipe', icon: Users2 },  // NOVO
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]

interface SidebarContentProps {
    pathname: string
    onLinkClick?: () => void
}

function SidebarContent({ pathname, onLinkClick }: SidebarContentProps) {
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
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.name}
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
                                {item.name}
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
                    <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                    <SidebarContent
                        pathname={pathname}
                        onLinkClick={() => setIsMobileOpen(false)}
                    />
                </SheetContent>
            </Sheet>
        </>
    )
}
