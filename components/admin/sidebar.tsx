'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { TranslationKeys } from '@/lib/admin-i18n/translations'
import { signOut } from '@/lib/actions/auth'
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
    ChevronDown,
    ChevronUp,
    Bot,
    UserCircle,
    Package,
    MapPin,
    UserCog,
    Tag,
    Scissors,
    LogOut,
} from 'lucide-react'

type NavigationItem = {
    key: keyof TranslationKeys['sidebar']
    href: string
    icon: any
    dividerBefore?: boolean
    submenu?: {
        key: keyof TranslationKeys['sidebar']
        href: string
        icon: any
    }[]
}

const navigation: NavigationItem[] = [
    // Core Operations
    { key: 'overview',   href: '/admin',           icon: LayoutDashboard },
    { key: 'scheduling', href: '/admin/agenda',     icon: Calendar },
    { key: 'clients',    href: '/admin/clientes',   icon: Users },
    { key: 'leads',      href: '/admin/leads',      icon: UserPlus },

    // Business
    { key: 'services',   href: '/admin/servicos',   icon: Sparkles,      dividerBefore: true },
    { key: 'contracts',  href: '/admin/contratos',  icon: FileText },
    { key: 'finance',    href: '/admin/financeiro', icon: DollarSign },

    // Communication
    { key: 'messages',   href: '/admin/mensagens',  icon: MessageSquare, dividerBefore: true },
    { key: 'chatLogs',   href: '/admin/chat-logs',  icon: Bot },

    // Team & Analytics
    { key: 'team',       href: '/admin/equipe',     icon: Users2,        dividerBefore: true },
    { key: 'analytics',  href: '/admin/analytics',  icon: BarChart3 },

    // Settings (expandable)
    {
        key: 'settings',
        href: '/admin/configuracoes',
        icon: Settings,
        dividerBefore: true,
        submenu: [
            { key: 'settingsCompany',  href: '/admin/configuracoes/empresa',        icon: Building2 },
            { key: 'settingsLanding',  href: '/admin/configuracoes/pagina-inicial', icon: Layout },
            { key: 'settingsServices', href: '/admin/configuracoes/servicos',       icon: Scissors },
            { key: 'settingsAddons',   href: '/admin/configuracoes/addons',         icon: Package },
            { key: 'settingsAreas',    href: '/admin/configuracoes/areas',          icon: MapPin },
            { key: 'settingsTeam',     href: '/admin/configuracoes/equipe',         icon: UserCog },
            { key: 'settingsPricing',  href: '/admin/configuracoes/pricing',        icon: Tag },
            { key: 'settingsSystem',   href: '/admin/configuracoes/sistema',        icon: Cog },
            { key: 'settingsTracking', href: '/admin/configuracoes/trackeamento',   icon: BarChart3 },
        ],
    },

]

interface SidebarContentProps {
    pathname: string
    user: any
    onLinkClick?: () => void
}

function SidebarContent({ pathname, user, onLinkClick }: SidebarContentProps) {
    const { t } = useAdminI18n()
    const sidebar = t('sidebar')
    const common = t('common')
    const initials = (user?.email as string | undefined)
        ?.split('@')[0]
        ?.slice(0, 2)
        ?.toUpperCase() ?? 'A'
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
                    <span className="font-heading text-2xl text-[#C48B7F]">Chesque</span>
                    <span className="font-heading text-2xl text-[#5D5D5D]">Admin</span>
                </Link>
            </div>
            <ScrollArea className="flex-1 py-4">
                <nav className="px-3 space-y-1">

                    {navigation.map((item) => {
                        const hasSubmenu = !!item.submenu
                        const isActive =
                            pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href))

                        if (hasSubmenu) {
                            return (
                                <div key={item.key}>
                                    {item.dividerBefore && (
                                        <hr className="my-2 border-[#EAE0D5]" />
                                    )}
                                    <div className="space-y-1">
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
                                            <ChevronDown
                                                className={cn(
                                                    'w-4 h-4 transition-transform duration-200',
                                                    isSettingsOpen && 'rotate-180'
                                                )}
                                            />
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
                                </div>
                            )
                        }

                        return (
                            <div key={item.key}>
                                {item.dividerBefore && (
                                    <hr className="my-2 border-[#EAE0D5]" />
                                )}
                                <Link
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
                            </div>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* User footer */}
            <div className="border-t border-[#EAE0D5] p-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <div className="w-8 h-8 rounded-full bg-[#C48B7F] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate leading-tight">
                                    {user?.email ?? ''}
                                </p>
                                <p className="text-xs text-muted-foreground leading-tight">{common.admin}</p>
                            </div>
                            <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/admin/conta" onClick={onLinkClick} className="cursor-pointer">
                                <UserCircle className="mr-2 h-4 w-4" />
                                {common.myAccount}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => signOut()}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            {common.signOut}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

export function Sidebar({ user }: { user: any }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const pathname = usePathname()

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-[#EAE0D5]">
                <SidebarContent pathname={pathname} user={user} />
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
                        user={user}
                        onLinkClick={() => setIsMobileOpen(false)}
                    />
                </SheetContent>
            </Sheet>
        </>
    )
}
