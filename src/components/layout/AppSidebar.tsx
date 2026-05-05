"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  History,
  ClipboardList,
  PieChart,
  LogOut,
  ChevronRight
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
        title: "Personal",
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
    ]

    return allItems.filter(item => item.roles.includes(user.role))
  }, [user])

  if (!user) return null

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-lg shadow-black/10 transition-transform hover:scale-105">
            <Image 
              src="/images/logo.jpeg" 
              alt="SyncStock Logo" 
              width={32} 
              height={32} 
              className="object-contain"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xl font-bold tracking-tight text-white">SyncStock</span>
            <span className="text-[9px] text-white/60 uppercase font-bold tracking-[0.25em]">Inventario</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden font-bold text-[10px] uppercase tracking-[0.3em] px-4 mb-4 text-white/40">Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-12 rounded-xl transition-all duration-200 hover:bg-white/10 data-[active=true]:bg-primary data-[active=true]:text-white group/item"
                  >
                    <Link href={item.url} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <item.icon strokeWidth={1.5} className="h-5 w-5" />
                        <span className="font-medium text-sm">{item.title}</span>
                      </div>
                      <ChevronRight className={`h-3 w-3 opacity-0 transition-all group-hover/item:opacity-40 group-data-[collapsible=icon]:hidden ${pathname === item.url ? 'hidden' : ''}`} />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/5 p-4 flex flex-col gap-4">
        <div className="group-data-[collapsible=icon]:hidden px-2 flex items-center gap-3">
           <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
              {user.nombre.charAt(0)}
           </div>
           <div className="flex flex-col min-w-0">
             <p className="text-xs font-bold text-white truncate">{user.nombre}</p>
             <p className="text-[9px] text-white/50 uppercase font-bold tracking-tighter">{user.role}</p>
           </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={logout}
              className="h-11 rounded-xl text-white/80 hover:bg-destructive hover:text-white transition-colors"
            >
              <LogOut strokeWidth={1.5} className="h-5 w-5" />
              <span className="font-semibold text-sm">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 text-[8px] text-white/20 font-bold uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden">
          <p>© 2024 SyncStock Inventario</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}