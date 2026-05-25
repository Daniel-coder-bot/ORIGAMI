import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { AuthProvider } from '@/context/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'SyncStock Inventario',
  description: 'Sistema Profesional de Gestión de Inventarios y Personal',
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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-M2Z8J67Q');
          `}
        </Script>
        {/* End Google Tag Manager */}
      </head>
      <body className="font-body antialiased bg-background selection:bg-primary/30 selection:text-primary-foreground">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-M2Z8J67Q"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <FirebaseClientProvider>
          <AuthProvider>
            <ProtectedRoute>
              <SidebarProvider defaultOpen={true}>
                <AppSidebar />
                <SidebarInset>
                  <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-30 px-4">
                    <SidebarTrigger className="text-secondary" />
                    <div className="flex-1 flex justify-center md:justify-start">
                       <span className="text-xs font-semibold text-secondary uppercase tracking-[0.2em] hidden md:block">Sistema de Gestión · SyncStock</span>
                       <span className="text-xs font-semibold text-secondary uppercase tracking-[0.2em] md:hidden">SyncStock</span>
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
