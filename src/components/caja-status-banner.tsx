"use client";

import { useEffect, useState } from "react";
import { getCajaActiva } from "@/app/actions/caja";
import { getSucursales } from "@/app/actions/configuracion";
import { AlertTriangle } from "lucide-react";
import { usePathname } from "next/navigation";

export function CajaStatusBanner({ sucursalId }: { sucursalId: number | null }) {
    const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(true); // Por defecto true para no parpadear
    const pathname = usePathname();

    useEffect(() => {
        const checkCaja = async () => {
            try {
                let activeSucursalId = sucursalId;
                if (!activeSucursalId) {
                    const sucursales = await getSucursales();
                    if (sucursales && sucursales.length > 0) {
                        activeSucursalId = sucursales[0].id;
                    }
                }
                
                if (!activeSucursalId) {
                    setCajaAbierta(true); // Si no hay sucursales en el sistema, no molestamos
                    return;
                }

                const caja = await getCajaActiva(activeSucursalId);
                setCajaAbierta(!!caja?.data);
            } catch (e) {
                console.error("Error al verificar caja:", e);
            }
        };

        checkCaja();
        // Revisar cada 2 minutos
        const interval = setInterval(checkCaja, 120000);
        return () => clearInterval(interval);
    }, [sucursalId, pathname]); // Dependencia de pathname para que refresque al navegar

    if (cajaAbierta || cajaAbierta === null) return null;
    
    // No mostrar en la pantalla de login ni en la de caja
    if (pathname === '/login' || pathname === '/caja') return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600/90 backdrop-blur text-white p-1 text-center font-bold text-xs flex items-center justify-center gap-2 shadow-md">
            <AlertTriangle className="h-4 w-4 animate-pulse" />
            ATENCIÓN: CAJA CERRADA. Recuerde abrir el turno para registrar ventas.
        </div>
    );
}
