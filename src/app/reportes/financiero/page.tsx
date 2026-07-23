"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { 
    CalendarIcon, Download, Loader2, DollarSign, 
    TrendingUp, Percent, Receipt, FileBarChart2 
} from "lucide-react";

import { getReporteFinanciero } from "@/app/actions/reportes";
import { getListasPrecio } from "@/app/actions/configuracion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReporteFinancieroPage() {
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    
    const [fechaDesde, setFechaDesde] = useState(() => {
        const d = new Date();
        d.setDate(1); // Primer día del mes actual
        return d.toISOString().split('T')[0];
    });
    const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().split('T')[0]);
    const [listaPrecioId, setListaPrecioId] = useState<string>("TODAS");
    
    const [listasPrecios, setListasPrecios] = useState<any[]>([]);
    const [reporteData, setReporteData] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            const listas = await getListasPrecio();
            setListasPrecios(listas);
            await cargarReporte();
        };
        init();
    }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

    const cargarReporte = async (listaIdParam = listaPrecioId) => {
        setLoading(true);
        startTransition(async () => {
            const filtros = {
                fechaDesde,
                fechaHasta,
                listaPrecioId: listaIdParam !== "TODAS" ? Number(listaIdParam) : undefined
            };
            const res = await getReporteFinanciero(filtros);
            if (res.success && res.data) {
                setReporteData(res.data);
            } else {
                toast.error(res.error || "Error al cargar el reporte");
            }
            setLoading(false);
        });
    };

    const handleFiltrar = (e: React.FormEvent) => {
        e.preventDefault();
        cargarReporte();
    };

    return (
        <div className="flex flex-col gap-6 w-full min-h-[calc(100vh-6rem)] max-w-7xl mx-auto p-4 md:p-6">
            
            {/* ENCABEZADO Y FILTROS */}
            <Card className="shadow-sm border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl">
                            <FileBarChart2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Módulo Financiero</CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Análisis de rentabilidad y márgenes de ganancia</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <form onSubmit={handleFiltrar} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-1.5 flex-1">
                            <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Desde</Label>
                            <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="h-11" required />
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Hasta</Label>
                            <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="h-11" required />
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lista de Precios</Label>
                            <Select value={listaPrecioId} onValueChange={(val) => setListaPrecioId(val || "TODAS")}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Todas las listas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODAS">Todas las listas</SelectItem>
                                    {listasPrecios.map(l => (
                                        <SelectItem key={l.id} value={String(l.id)}>{l.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" disabled={isPending || loading} className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white font-medium">
                            {isPending || loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarIcon className="h-4 w-4 mr-2" />}
                            Filtrar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {loading && !reporteData ? (
                <div className="flex justify-center mt-12"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>
            ) : reporteData ? (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card className="shadow-sm border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg"><DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Ingresos Totales</p>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">${(reporteData.kpis.ingresosTotales || 0).toFixed(2)}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="shadow-sm border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Costo (CMV)</p>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">${(reporteData.kpis.costoTotal || 0).toFixed(2)}</h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 rounded-lg"><Percent className="h-5 w-5 text-orange-600 dark:text-orange-400" /></div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Descuentos</p>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">${(reporteData.kpis.descuentosTotales || 0).toFixed(2)}</h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg"><Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Impuestos (IVA)</p>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">${(reporteData.kpis.impuestosTotales || 0).toFixed(2)}</h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 col-span-1 lg:col-span-1">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">Ganancia Neta</p>
                                    <h3 className="text-2xl font-black text-emerald-700 mt-1">${(reporteData.kpis.gananciaNetaTotal || 0).toFixed(2)}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* TABLA DE DETALLES */}
                    <Card className="shadow-sm border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex-1">
                        <CardHeader className="bg-slate-50/50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 p-4">
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Desglose de Operaciones</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Fecha</th>
                                        <th className="px-4 py-3 font-semibold">Comprobante</th>
                                        <th className="px-4 py-3 font-semibold">Cliente</th>
                                        <th className="px-4 py-3 font-semibold text-right">Ingreso Bruto</th>
                                        <th className="px-4 py-3 font-semibold text-right">Costo</th>
                                        <th className="px-4 py-3 font-semibold text-right">Impuestos</th>
                                        <th className="px-4 py-3 font-semibold text-right text-emerald-600 dark:text-emerald-500">Ganancia Neta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                    {reporteData.detalles.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">No hay ventas en este período para los filtros seleccionados.</td>
                                        </tr>
                                    ) : (
                                        reporteData.detalles.map((v: any) => (
                                            <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{v.comprobante}</td>
                                                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{v.cliente}</td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">${v.total.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right text-xs text-red-600 dark:text-red-400">-${v.costo.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right text-xs text-purple-600 dark:text-purple-400">-${v.impuestos.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">${v.ganancia_neta.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
