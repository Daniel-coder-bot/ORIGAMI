
import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { AuthProvider } from '@/context/auth-context';
import { ProtectedRoute } from '@/components/protected-route';

export const metadata: Metadata = {
  title: 'Gestor de Stock y Personal',
  description: 'Sistema de control de inventario y gestión de trabajadores',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📦</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background selection:bg-accent/30 selection:text-accent-foreground">
        <FirebaseClientProvider>
          <AuthProvider>
            <ProtectedRoute>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <header className="flex h-16 shrink-0 items-center gap-2 border-b border-primary/5 px-4 md:hidden">
                    <SidebarTrigger className="-ml-1 text-primary" />
                    <div className="flex-1 flex justify-center">
                       <span className="text-sm font-black text-primary uppercase tracking-widest">Gestor Stock</span>
                    </div>
                  </header>
                  <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
            </ProtectedRoute>
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
