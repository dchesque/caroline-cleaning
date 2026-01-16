'use client'

import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, User, Settings } from 'lucide-react'
import { LanguageSelector } from './language-selector'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AdminHeader({ user }: { user: any }) {
    const { t } = useAdminI18n();
    const common = t('common');

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-[#EAE0D5] px-4 sm:px-6 h-16 flex items-center justify-between lg:justify-end">
            {/* Spacer for mobile menu trigger */}
            <div className="lg:hidden w-8" />

            <div className="flex items-center gap-4">
                <LanguageSelector />
                <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-foreground">{user?.email}</p>
                        <p className="text-xs text-muted-foreground">{common.admin}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full bg-[#FDF8F6] text-[#C48B7F]">
                                <User className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{common.myAccount}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/admin/conta" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    {common.settings}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                {common.signOut}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
