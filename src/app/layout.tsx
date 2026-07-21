import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import {
  LogOut, LayoutDashboard, ShoppingCart, Package,
  History, Users, Settings, BarChart4, Store, Wallet, ShieldCheck,
  Building2, Tag, Contact, ClipboardList, Replace, HardDrive
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import Link from "next/link";
import { CajaStatusBanner } from "@/components/caja-status-banner";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tendeco POS",
  description: "Sistema de Gestión y Facturación",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Evita zoom accidental en móviles
  userScalable: false,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {

  const cookieStore = await cookies();
  const token = cookieStore.get('tendeco_session')?.value;

  let esAdmin = false;
  let permisos: string[] = [];
  let isLogueado = false;
  let nombreUsuario = "";
  let sucursalId: number | null = null;

  if (token) {
    try {
      const secretKey = process.env.SESSION_SECRET || 'tendeco-super-secret-key-2024';
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secretKey));
      esAdmin = payload.rol === 'ADMIN';
      permisos = (payload.permisos as string[]) || [];
      nombreUsuario = payload.nombre as string;
      sucursalId = payload.sucursalId ? Number(payload.sucursalId) : null;
      isLogueado = true;
    } catch (error) {
      isLogueado = false;
    }
  }

  // suppressHydrationWarning evita errores por extensiones de Chrome que inyectan código
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {!isLogueado ? (
            <main className="w-full min-h-screen">
              {children}
            </main>
          ) : (
            <div className="flex h-screen overflow-hidden print:h-auto print:block print:overflow-visible">

              {/* SIDEBAR CORPORATIVO (PC/TABLET) - AHORA COMO COMPONENTE */}
              <AppSidebar esAdmin={esAdmin} permisos={permisos} nombreUsuario={nombreUsuario} />

              {/* ÁREA DE CONTENIDO PRINCIPAL */}
              <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 min-w-0 p-4 md:p-6 pb-28 md:pb-6 bg-slate-50/50 dark:bg-zinc-950 relative print:overflow-visible print:p-0 print:bg-white">
                {children}
              </main>

              {/* BARRA INFERIOR MÓVIL (PWA) */}
              <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 flex justify-around items-center h-20 z-50 px-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-indigo-600">
                  <LayoutDashboard className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-bold">Inicio</span>
                </Link>

                <Link href="/inventario" className="flex flex-col items-center justify-center w-full h-full text-indigo-600">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-xl mb-1">
                    <Package className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase">Inventario</span>
                </Link>

                <Link href="/ventas" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-indigo-600">
                  <ShoppingCart className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-bold">Venta</span>
                </Link>

                <form action={logout} className="w-full h-full flex items-center justify-center">
                  <button type="submit" className="flex flex-col items-center justify-center w-full h-full text-red-400 hover:text-red-600">
                    <LogOut className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-bold">Salir</span>
                  </button>
                </form>
              </nav>

            </div>
          )}

          <CajaStatusBanner sucursalId={sucursalId} />
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}