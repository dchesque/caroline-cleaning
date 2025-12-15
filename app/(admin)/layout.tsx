import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'
import { Toaster } from 'sonner'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
        <div className="min-h-screen bg-[#FDF8F6]">
            <Sidebar />
            <div className="lg:pl-64">
                <AdminHeader user={user} />
                <main className="p-4 lg:p-6">{children}</main>
            </div>
            <Toaster richColors position="top-right" />
        </div>
    )
}
