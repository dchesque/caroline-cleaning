import { Button } from "@/components/ui/button"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar Placeholder */}
            <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:block">
                <div className="p-6 border-b border-sidebar-border">
                    <h2 className="text-lg font-heading text-sidebar-primary-foreground bg-primary px-2 py-1 rounded">CPC Admin</h2>
                </div>
                <nav className="p-4 space-y-2">
                    <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    <Button variant="ghost" className="w-full justify-start">Agenda</Button>
                    <Button variant="ghost" className="w-full justify-start">Clientes</Button>
                    <Button variant="ghost" className="w-full justify-start">Contratos</Button>
                    <Button variant="ghost" className="w-full justify-start">Financeiro</Button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-background">
                <header className="h-16 border-b border-border flex items-center px-6">
                    <h1 className="text-xl font-heading">Dashboard</h1>
                </header>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
