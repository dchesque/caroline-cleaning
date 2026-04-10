import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'
import { Toaster } from 'sonner'
import { AdminI18nProvider } from '@/lib/admin-i18n/context'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single()

    return (
        <AdminI18nProvider>
            <div className="min-h-screen bg-[#FDF8F6]">
                <Sidebar user={user} profile={profile} />
                <div className="lg:pl-64">
                    <AdminHeader />
                    <main className="p-4 lg:p-6">{children}</main>
                </div>
                <Toaster richColors position="top-right" />
            </div>
        </AdminI18nProvider>
    )
}
