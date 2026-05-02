
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Warehouse,
  History,
  ClipboardList,
  PieChart,
  LogOut,
  Database
} from "lucide-react"
import { useAuth } from "@/context/auth-context"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const items = React.useMemo(() => {
    if (!user) return []

    const allItems = [
      {
        title: "Panel de Control",
        url: "/dashboard",
        icon: LayoutDashboard,
        roles: ["Administrador", "Gestor de Proyecto"],
      },
      {
        title: "Trabajadores",
        url: "/trabajadores",
        icon: Users,
        roles: ["Administrador"],
      },
      {
        title: "Inventario",
        url: "/inventario",
        icon: Package,
        roles: ["Administrador", "Gestor de Proyecto"],
      },
      {
        title: "Operaciones",
        url: "/movimientos",
        icon: History,
        roles: ["Administrador", "Gestor de Proyecto", "Trabajador"],
      },
      {
        title: "Historial",
        url: "/historial",
        icon: ClipboardList,
        roles: ["Administrador", "Gestor de Proyecto"],
      },
      {
        title: "Análisis Personal",
        url: "/analisis-personal",
        icon: PieChart,
        roles: ["Administrador", "Gestor de Proyecto"],
      },
      {
        title: "Generar Datos",
        url: "/seed",
        icon: Database,
        roles: ["Administrador"],
      },
    ]

    return allItems.filter(item => item.roles.includes(user.role))
  }, [user])

  if (!user) return null

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-primary/5">
      <SidebarHeader className="px-4 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105">
            <Warehouse strokeWidth={1.5} className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-black tracking-tight text-primary">Gestor Stock</span>
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">{user.role}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden font-black text-[10px] uppercase tracking-widest px-4 mb-4 text-primary/40">Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-11 rounded-xl transition-all duration-300 hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary group/item"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${pathname === item.url ? 'bg-primary/10' : 'group-hover/item:bg-primary/5'}`}>
                        <item.icon strokeWidth={1.5} className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-primary/5 p-4 flex flex-col gap-4">
        <div className="group-data-[collapsible=icon]:hidden px-2">
          <p className="text-[10px] font-black uppercase text-muted-foreground truncate">{user.nombre}</p>
        </div>
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={logout}
              className="h-11 rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <div className="p-1.5 rounded-lg">
                <LogOut strokeWidth={1.5} className="h-5 w-5" />
              </div>
              <span className="font-bold text-sm">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 text-[9px] text-muted-foreground font-black uppercase tracking-widest group-data-[collapsible=icon]:hidden">
          <p>© 2024 Gestor Stock</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
