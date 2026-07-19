"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut, LayoutDashboard, ShoppingCart, Package,
  History, Users, Settings, BarChart4, Store, Wallet, ShieldCheck,
  Building2, Tag, Contact, ClipboardList, Replace, HardDrive,
  Menu, ChevronLeft, Moon, Sun
} from "lucide-react";
import { useTheme } from "next-themes";
import { logout } from "@/app/actions/auth";

export function AppSidebar({
  esAdmin,
  permisos,
  nombreUsuario
}: {
  esAdmin: boolean;
  permisos: string[];
  nombreUsuario: string;
}) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme, setTheme } = useTheme();

  const NavItem = ({ href, icon: Icon, label, colorClass = "text-slate-600 hover:bg-slate-100 hover:text-slate-900", activeClass = "bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-900/30 dark:text-indigo-300" }: any) => {
    const isActive = pathname === href;
    const finalClass = isActive ? activeClass : colorClass;
    
    return (
      <Link href={href} className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${finalClass} ${isExpanded ? '' : 'justify-center'}`} title={!isExpanded ? label : undefined}>
        <Icon className={`h-5 w-5 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
        {isExpanded && <span>{label}</span>}
      </Link>
    );
  };

  return (
    <aside className={`bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex-col hidden md:flex shrink-0 print:hidden transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
      
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center overflow-hidden">
          <Store className="h-6 w-6 text-indigo-600 shrink-0" />
          {isExpanded && <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white ml-2 whitespace-nowrap">Tendeco</span>}
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-1 rounded-md shrink-0 transition-colors">
          {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={`px-4 py-5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0 overflow-hidden transition-all ${isExpanded ? '' : 'flex justify-center'}`}>
        {isExpanded ? (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operador Activo</p>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{nombreUsuario}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${esAdmin ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${esAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {esAdmin ? 'Dueño (Admin)' : 'Cajero'}
              </span>
            </div>
          </div>
        ) : (
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${esAdmin ? 'bg-indigo-500' : 'bg-emerald-500'}`} title={nombreUsuario}>
            {nombreUsuario.substring(0,2).toUpperCase()}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6 hide-scrollbar overflow-x-hidden">
        
        {/* BLOQUE 1: INICIO */}
        <div className="space-y-1">
          <NavItem href="/" icon={LayoutDashboard} label="Panel Principal" />
        </div>

        {/* BLOQUE 2: OPERACIONES DIARIAS */}
        {(esAdmin || permisos.includes("VENTAS") || permisos.includes("CAJA") || permisos.includes("HISTORIAL")) && (
          <div className="space-y-1">
            {isExpanded && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Operaciones</p>}
            
            {(esAdmin || permisos.includes("VENTAS")) && (
              <NavItem href="/ventas" icon={ShoppingCart} label="Punto de Venta" />
            )}
            {(esAdmin || permisos.includes("CAJA")) && (
              <NavItem href="/caja" icon={Wallet} label="Caja Diaria" />
            )}
            {(esAdmin || permisos.includes("HISTORIAL")) && (
              <NavItem href="/historial" icon={History} label="Historial de Ventas" />
            )}
            {(esAdmin || permisos.includes("PRESUPUESTOS")) && (
              <NavItem href="/presupuestos" icon={ClipboardList} label="Presupuestos" />
            )}
          </div>
        )}

        {/* BLOQUE 3: GESTIÓN COMERCIAL */}
        {(esAdmin || permisos.includes("INVENTARIO") || permisos.includes("CLIENTES")) && (
          <div className="space-y-1">
            {isExpanded && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Comercial</p>}
            
            {(esAdmin || permisos.includes("INVENTARIO")) && (
              <>
                <NavItem href="/inventario" icon={Package} label="Productos y Stock" />
                <NavItem href="/transferencias" icon={Replace} label="Movimientos y Transf." />
                <NavItem href="/listas-precio" icon={Tag} label="Listas de Precios" />
                <NavItem href="/proveedores" icon={Building2} label="Marcas y Proveedores" />
              </>
            )}

            {(esAdmin || permisos.includes("CLIENTES")) && (
              <>
                <NavItem href="/clientes" icon={Contact} label="Directorio Clientes" />
                <NavItem href="/cuentas-corrientes" icon={Users} label="Cuentas Corrientes" />
                <NavItem href="/notas-credito" icon={History} label="Notas de Crédito" />
              </>
            )}
          </div>
        )}

        {/* BLOQUE 4: GERENCIA Y SISTEMA */}
        {(esAdmin || permisos.includes("REPORTES") || permisos.includes("CONFIGURACION")) && (
          <div className="space-y-1">
            {isExpanded && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Gerencia</p>}
            
            {(esAdmin || permisos.includes("REPORTES")) && (
              <NavItem href="/reportes" icon={BarChart4} label="Reportes Maestros" />
            )}
            {esAdmin && (
              <NavItem href="/importar" icon={HardDrive} label="Importar Excel" />
            )}
            {esAdmin && (
              <NavItem href="/usuarios" icon={ShieldCheck} label="Control de Accesos" />
            )}
            {esAdmin && (
              <NavItem href="/configuracion" icon={Settings} label="Empresa (General)" />
            )}
            {esAdmin && (
              <NavItem href="/configuracion/sucursales" icon={Store} label="Sucursales" />
            )}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0 flex flex-col gap-2">
        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm ${isExpanded ? 'justify-center' : 'justify-center'}`} title={!isExpanded ? "Cambiar Tema" : undefined}>
          <Moon className="h-5 w-5 shrink-0 hidden dark:block" />
          <Sun className="h-5 w-5 shrink-0 block dark:hidden" />
          {isExpanded && <span>Modo Oscuro</span>}
        </button>
        <form action={logout}>
          <button type="submit" className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-bold text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 dark:bg-zinc-900 dark:border-red-900 dark:hover:bg-red-950 rounded-xl transition-all shadow-sm ${isExpanded ? 'justify-center' : 'justify-center'}`} title={!isExpanded ? "Cerrar Sesión" : undefined}>
            <LogOut className="h-5 w-5 shrink-0" /> {isExpanded && <span>Salir</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
