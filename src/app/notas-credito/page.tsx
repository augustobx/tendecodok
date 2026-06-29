"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { History, FileText, Loader2, RefreshCcw } from "lucide-react";

import { getHistorialNotasCredito } from "@/app/actions/cuentas-corrientes";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HistorialNotasCreditoPage() {
    const [isPending, startTransition] = useTransition();
    const [notas, setNotas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarHistorial = () => {
        setLoading(true);
        startTransition(async () => {
            const res = await getHistorialNotasCredito();
            if (res.success && res.data) setNotas(res.data);
            else toast.error(res.error);
            setLoading(false);
        });
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto min-h-[calc(100vh-6rem)]">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl">
                        <History className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Historial de Notas de Crédito</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Consultá todas las devoluciones a Cuenta Corriente registradas en el sistema.</p>
                    </div>
                </div>
                <Button onClick={cargarHistorial} disabled={loading} variant="outline" className="h-10 text-slate-600">
                    <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                </Button>
            </div>

            {/* TABLA */}
            <Card className="flex-1 shadow-sm border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-zinc-800/50 sticky top-0 z-10 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Fecha</th>
                                <th className="px-6 py-4 font-semibold">Cliente</th>
                                <th className="px-6 py-4 font-semibold">Venta Origen</th>
                                <th className="px-6 py-4 font-semibold">Notas</th>
                                <th className="px-6 py-4 font-semibold text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-16"><Loader2 className="animate-spin h-8 w-8 text-indigo-500 mx-auto" /></td></tr>
                            ) : notas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-slate-400">
                                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-base font-medium">No se encontraron notas de crédito registradas.</p>
                                    </td>
                                </tr>
                            ) : (
                                notas.map((n) => (
                                    <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {new Date(n.fecha).toLocaleDateString('es-AR')}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {new Date(n.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">{n.cliente.nombre_razon_social}</p>
                                            <p className="text-[11px] text-slate-500">DNI/CUIT: {n.cliente.dni_cuit || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {n.venta ? (
                                                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                                    {n.venta.tipo_comprobante.replace('_', ' ')} Nº 000{n.venta.punto_venta}-{String(n.venta.numero_comprobante).padStart(8, '0')}
                                                </p>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] text-slate-600 italic whitespace-pre-wrap">{n.notas || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-black text-lg text-emerald-600">${n.monto.toFixed(2)}</p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
