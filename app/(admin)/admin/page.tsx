export default function AdminDashboard() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                <p className="text-2xl font-bold text-primary mt-2">$45,231.89</p>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground">Active Clients</h3>
                <p className="text-2xl font-bold text-primary mt-2">+2350</p>
            </div>
        </div>
    )
}
