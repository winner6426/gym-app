import { Menu } from "lucide-react"
import { useState } from "react"
import { Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext.jsx"
import { Sidebar } from "./Sidebar.jsx"


export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:ml-64 lg:px-8">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Mở menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <p className="hidden text-sm text-muted-foreground sm:block">Hệ thống quản lý trung tâm thể hình</p>
        
      </header>
      <main className="lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
