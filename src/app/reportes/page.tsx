"use client";

import { useState, useEffect, useTransition } from "react";
import {
    BarChart4, Calendar, Loader2, TrendingUp, TrendingDown,
    Package, Users, Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Tag,
    LineChart, ArrowUpCircle, Droplets
} from "lucide-react";
import Link from "next/link";

import { getReporteMaestro, getReporteVolumetrico } from "@/app/actions/reportes";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function ReportesMaestrosPage() {
    const [isPending, startTransition] = useTransition();
    const [datos, setDatos] = useState<any>(null);
    const [datosVolumen, setDatosVolumen] = useState<any>(null); // NUEVO ESTADO PARA VOLUMETRIA

    // Filtros de fecha (Por defecto: Mes actual)
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

    const [fechaDesde, setFechaDesde] = useState(primerDiaMes);
    const [fechaHasta, setFechaHasta] = useState(ultimoDiaMes);

    // Navegación interna (Pestañas) - INCLUYE 'VOLUMEN' AHORA
    const [tabActiva, setTabActiva] = useState<"RESUMEN" | "PRODUCTOS" | "CLIENTES" | "FINANZAS" | "INFLACION" | "VOLUMEN">("RESUMEN");

    const cargarDatos = () => {
        startTransition(async () => {
            // Hacemos las dos consultas a la base de datos al mismo tiempo
            const [resMaestro, resVolumen] = await Promise.all([
                getReporteMaestro({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta }),
                getReporteVolumetrico(fechaDesde, fechaHasta)
            ]);

            if (resMaestro.success) setDatos(resMaestro.data);
            if (resVolumen.success) setDatosVolumen(resVolumen.data);
        });
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    if (!datos && isPending) {
        return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>;
    }

    if (!datos) return null;

    const kpis = datos.kpis;
    const ranks = datos.rankings;

    // Utilidad para calcular el máximo de una lista (para las barras de progreso)
    const maxCantProd = Math.max(...ranks.topProductosVendidos.map((p: any) => p.cantidad), 1);
    const maxRentProd = Math.max(...ranks.topProductosRentables.map((p: any) => p.rentabilidad), 1);
    const maxRecaudoProv = Math.max(...ranks.topProveedores.map((p: any) => p.recaudado), 1);
    const maxClienteComp = Math.max(...ranks.topClientes.map((c: any) => c.comprado), 1);

    return (
        <div className="flex flex-col gap-6 max-w-[1400px] mx-auto min-h-[calc(100vh-6rem)] pb-12 overflow-x-hidden">

            {/* 1. HEADER Y SUPER FILTRO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl gap-4 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl hidden sm:block">
                        <BarChart4 className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Inteligencia de Negocio</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Analíticas completas. Los números no mienten.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto bg-slate-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400 ml-2" />
                        <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="h-9 bg-white border-none shadow-sm text-xs font-bold" />
                        <span className="text-slate-400 font-medium text-xs">A</span>
                        <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="h-9 bg-white border-none shadow-sm text-xs font-bold" />
                    </div>
                    <Button onClick={cargarDatos} disabled={isPending} className="w-full sm:w-auto h-9 bg-slate-900 text-white font-bold text-xs shadow-sm px-6">
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Analizar"}
                    </Button>
                </div>
            </div>

            {/* 2. PESTAÑAS DE NAVEGACIÓN */}
            <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                <Button variant={tabActiva === "RESUMEN" ? "default" : "outline"} onClick={() => setTabActiva("RESUMEN")} className={`h-11 rounded-xl px-6 font-bold whitespace-nowrap ${tabActiva === "RESUMEN" ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                    <TrendingUp className="h-4 w-4 mr-2" /> Visión Global
                </Button>
                <Button variant={tabActiva === "PRODUCTOS" ? "default" : "outline"} onClick={() => setTabActiva("PRODUCTOS")} className={`h-11 rounded-xl px-6 font-bold whitespace-nowrap ${tabActiva === "PRODUCTOS" ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                    <Package className="h-4 w-4 mr-2" /> Productos y Stock
                </Button>
                <Button variant={tabActiva === "CLIENTES" ? "default" : "outline"} onClick={() => setTabActiva("CLIENTES")} className={`h-11 rounded-xl px-6 font-bold whitespace-nowrap ${tabActiva === "CLIENTES" ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                    <Users className="h-4 w-4 mr-2" /> Top Clientes
                </Button>
                <Button variant={tabActiva === "FINANZAS" ? "default" : "outline"} onClick={() => setTabActiva("FINANZAS")} className={`h-11 rounded-xl px-6 font-bold whitespace-nowrap ${tabActiva === "FINANZAS" ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                    <Wallet className="h-4 w-4 mr-2" /> Finanzas y Caja
                </Button>
                <Button variant={tabActiva === "INFLACION" ? "default" : "outline"} onClick={() => setTabActiva("INFLACION")} className={`h-11 rounded-xl px-6 font-bold whitespace-nowrap ${tabActiva === "INFLACION" ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border-red-100 hover:bg-red-50 hover:text-red-700'}`}>
                    <LineChart className="h-4 w-4 mr-2" /> Auditoría de Inflación
                </Button>
                <Button variant={tabActiva === "VOLUMEN" ? "default" : "outline"} onClick={() => setTabActiva("VOLUMEN")} className={`h-11 rounded-xl px-6 font-bold whitespace-nowrap ${tabActiva === "VOLUMEN" ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700'}`}>
                    <Droplets className="h-4 w-4 mr-2" /> Volumen Proveedores
                </Button>
            </div>

            {/* =========================================================
                VISTA 1: RESUMEN GLOBAL (KPIs de Alto Impacto)
                ========================================================= */}
            {tabActiva === "RESUMEN" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold uppercase text-indigo-600/80 dark:text-indigo-400 tracking-wider">Facturación Total</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">${kpis.ingresosTotales.toFixed(2)}</h3>
                                <p className="text-xs font-semibold text-slate-500 mt-2">{kpis.ventasTotales} ventas concretadas</p>
                            </CardContent>
                        </Card>

                        <Card className="border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold uppercase text-emerald-600/80 dark:text-emerald-400 tracking-wider flex items-center justify-between">Ganancia Bruta <ArrowUpRight className="h-4 w-4" /></p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">${kpis.gananciaBruta.toFixed(2)}</h3>
                                <p className="text-xs font-semibold text-slate-500 mt-2">Margen promedio del <span className="text-emerald-600 dark:text-emerald-400 font-bold">{kpis.margenPromedio.toFixed(1)}%</span></p>
                            </CardContent>
                        </Card>

                        <Card className="border-orange-100 dark:border-orange-500/20 bg-orange-50/30 dark:bg-orange-500/5">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold uppercase text-orange-600/80 dark:text-orange-400 tracking-wider flex items-center justify-between">Ticket Promedio <Tag className="h-4 w-4" /></p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">${kpis.ticketPromedio.toFixed(2)}</h3>
                                <p className="text-xs font-semibold text-slate-500 mt-2">Gasto promedio por cliente</p>
                            </CardContent>
                        </Card>

                        <Card className="border-red-100 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold uppercase text-red-600/80 dark:text-red-400 tracking-wider flex items-center justify-between">Fugas de Capital <ArrowDownRight className="h-4 w-4" /></p>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-sm"><span className="font-medium text-slate-600 dark:text-slate-400">Gastos de Caja:</span><span className="font-bold text-red-600 dark:text-red-400">${kpis.totalGastosCaja.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="font-medium text-slate-600 dark:text-slate-400">Descuentos:</span><span className="font-bold text-red-600 dark:text-red-400">${kpis.totalDescuentosOtorgados.toFixed(2)}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
                            <CardHeader className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 p-4"><CardTitle className="text-sm">🔥 Los 5 Más Vendidos (Volumen)</CardTitle></CardHeader>
                            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-zinc-800">
                                {ranks.topProductosVendidos.slice(0, 5).map((p: any, i: number) => (
                                    <div key={i} className="p-4 flex items-center justify-between gap-2">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate flex-1 min-w-0">{i + 1}. {p.nombre}</span>
                                        <Badge className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 shrink-0 font-black">{p.cantidad} uds</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
                            <CardHeader className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 p-4"><CardTitle className="text-sm">👑 Los 5 Mejores Clientes</CardTitle></CardHeader>
                            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-zinc-800">
                                {ranks.topClientes.slice(0, 5).map((c: any, i: number) => (
                                    <div key={i} className="p-4 flex items-center justify-between gap-2">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate flex-1 min-w-0">{i + 1}. {c.nombre}</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">${c.comprado.toFixed(2)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* =========================================================
                VISTA 2: PRODUCTOS (La cruda realidad del stock)
                ========================================================= */}
            {tabActiva === "PRODUCTOS" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-w-0">

                    {/* TOP RENTABLES */}
                    <Card className="shadow-sm border-emerald-200 dark:border-emerald-500/20 min-w-0 overflow-hidden">
                        <CardHeader className="bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20 p-5">
                            <CardTitle className="text-base text-emerald-800 dark:text-emerald-300 flex items-center gap-2"><DollarSign className="h-5 w-5" /> Los que dejan más plata (Ganancia Neta)</CardTitle>
                            <CardDescription>Productos que mayor rentabilidad acumularon en el período.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            {ranks.topProductosRentables.map((p: any, index: number) => (
                                <div key={index} className="space-y-1.5">
                                    <div className="flex justify-between text-sm gap-2">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">{index + 1}. {p.nombre}</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">${p.rentabilidad.toFixed(2)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.rentabilidad / maxRentProd) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="space-y-6 min-w-0">
                        {/* TOP VENDIDOS */}
                        <Card className="shadow-sm border-slate-200 dark:border-zinc-800 overflow-hidden">
                            <CardHeader className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 p-5">
                                <CardTitle className="text-base text-slate-800 dark:text-slate-200 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-indigo-500" /> Los que más rotan (Volumen)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                {ranks.topProductosVendidos.slice(0, 7).map((p: any, index: number) => (
                                    <div key={index} className="space-y-1.5">
                                        <div className="flex justify-between text-sm gap-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">{p.nombre}</span>
                                            <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">{p.cantidad} unidades</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(p.cantidad / maxCantProd) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* TOP PROVEEDORES */}
                        <Card className="shadow-sm border-indigo-200 dark:border-indigo-500/20 overflow-hidden">
                            <CardHeader className="bg-indigo-50 dark:bg-indigo-500/10 border-b border-indigo-100 dark:border-indigo-500/20 p-5">
                                <CardTitle className="text-base text-indigo-800 dark:text-indigo-300 flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Top Proveedores (Recaudación)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                {ranks.topProveedores.slice(0, 7).map((p: any, index: number) => (
                                    <div key={index} className="space-y-1.5">
                                        <div className="flex justify-between text-sm gap-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">{p.nombre}</span>
                                            <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">${p.recaudado.toFixed(2)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(p.recaudado / maxRecaudoProv) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* PEOR VENDIDOS / STOCK MUERTO */}
                        <Card className="shadow-sm border-red-200 dark:border-red-500/20 min-w-0 overflow-hidden">
                            <CardHeader className="bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20 p-5">
                                <CardTitle className="text-base text-red-800 dark:text-red-300 flex items-center gap-2"><TrendingDown className="h-5 w-5" /> Stock Muerto (Menos vendidos)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-red-100 dark:divide-red-500/10">
                                {ranks.productosMenosVendidos.map((p: any, index: number) => (
                                    <div key={index} className="p-3 px-5 flex justify-between items-center bg-white dark:bg-zinc-900">
                                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 truncate max-w-[60%]">{p.nombre}</span>
                                        <div className="text-right">
                                            <span className="block text-[10px] font-bold text-red-500 dark:text-red-400 uppercase">Vendidos: {p.cantidad}</span>
                                            <span className="block text-[10px] font-medium text-slate-400">Stock actual: {p.stock_clavado}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* =========================================================
                VISTA 3: CLIENTES
                ========================================================= */}
            {tabActiva === "CLIENTES" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* TOP CLIENTES */}
                    <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
                        <CardHeader className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 p-5">
                            <CardTitle className="text-base text-slate-800 dark:text-slate-200 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-500" /> Ranking de Compradores</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            {ranks.topClientes.map((c: any, index: number) => (
                                <div key={index} className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{index + 1}. {c.nombre}</span>
                                        <span className="font-black text-indigo-600 dark:text-indigo-400">${c.comprado.toFixed(2)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.comprado / maxClienteComp) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* TOP DEUDORES */}
                    <Card className="shadow-sm border-orange-200 dark:border-orange-500/20">
                        <CardHeader className="bg-orange-50 dark:bg-orange-500/10 border-b border-orange-100 dark:border-orange-500/20 p-5">
                            <CardTitle className="text-base text-orange-800 dark:text-orange-400 flex items-center gap-2"><Wallet className="h-5 w-5" /> Alerta de Deudores (Top Deuda Viva)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-orange-100 dark:divide-orange-500/10">
                            {ranks.topDeudores.length === 0 ? (
                                <div className="p-10 text-center text-slate-400 font-medium">No hay deudas registradas en este período.</div>
                            ) : (
                                ranks.topDeudores.map((c: any, index: number) => (
                                    <div key={index} className="p-4 px-5 flex justify-between items-center bg-white dark:bg-zinc-900 hover:bg-orange-50/30 dark:hover:bg-orange-500/5">
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{index + 1}. {c.nombre}</span>
                                        <Badge variant="outline" className="bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 font-black text-sm">
                                            Debe: ${c.adeudado.toFixed(2)}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* =========================================================
                VISTA 4: FINANZAS (Medios de pago y composición)
                ========================================================= */}
            {tabActiva === "FINANZAS" && (
                <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    {/* ACCESO AL MÓDULO FINANCIERO PROFESIONAL */}
                    <Card className="bg-emerald-600 dark:bg-emerald-700 border-emerald-700 dark:border-emerald-800 shadow-sm text-white">
                        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6" /> Módulo Financiero Profesional</h3>
                                <p className="text-emerald-100 text-sm mt-1">Análisis profundo de Ganancia Bruta, CMV, Impuestos y Rentabilidad Neta.</p>
                            </div>
                            <Link href="/reportes/financiero" className="w-full md:w-auto">
                                <Button className="bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold w-full md:w-auto shadow-sm">
                                    Abrir Módulo Avanzado <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
                        <CardHeader className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 p-5">
                            <CardTitle className="text-base text-slate-800 dark:text-slate-200 flex items-center gap-2"><Wallet className="h-5 w-5 text-indigo-500" /> Composición de los Ingresos</CardTitle>
                            <CardDescription>¿Cómo te pagaron los clientes en este período?</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {Object.keys(datos.mediosDePago).length === 0 ? (
                                <p className="text-center text-slate-400">No hay pagos registrados.</p>
                            ) : (
                                Object.entries(datos.mediosDePago)
                                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                                    .map(([metodo, monto], index) => {
                                        const porcentaje = ((monto as number) / kpis.ingresosTotales) * 100;
                                        return (
                                            <div key={index} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="font-bold text-sm uppercase text-slate-700 dark:text-slate-300 tracking-wider">{metodo.replace('_', ' ')}</p>
                                                        <p className="text-xs font-semibold text-slate-400">{porcentaje.toFixed(1)}% del total</p>
                                                    </div>
                                                    <span className="font-black text-xl text-slate-900 dark:text-white">${(monto as number).toFixed(2)}</span>
                                                </div>
                                                <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-slate-800 dark:bg-slate-400 rounded-full" style={{ width: `${porcentaje}%` }}></div>
                                                </div>
                                            </div>
                                        )
                                    })
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* =========================================================
                VISTA 5: AUDITORÍA DE INFLACIÓN (Histórico de Precios)
                ========================================================= */}
            {tabActiva === "INFLACION" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold uppercase text-red-600 dark:text-red-400 tracking-wider flex items-center gap-1"><ArrowUpCircle className="h-4 w-4" /> Inflación Promedio</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{kpis.inflacionPromedio.toFixed(1)}%</h3>
                                <p className="text-xs font-semibold text-slate-500 mt-2">Aumento medio en este período.</p>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:col-span-2">
                            <CardContent className="p-6 flex flex-col justify-center h-full">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Caja Negra de Costos</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Este módulo audita automáticamente todos los aumentos masivos o ediciones de facturas de proveedores. Te permite buscar fechas pasadas y entender por qué subieron tus precios de góndola.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm border-slate-200 dark:border-zinc-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-zinc-800/50 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                                        <th className="px-6 py-4 font-semibold">Producto afectado</th>
                                        <th className="px-6 py-4 font-semibold">Motivo del ajuste</th>
                                        <th className="px-6 py-4 font-semibold text-right">Costo Anterior</th>
                                        <th className="px-6 py-4 font-semibold text-right">Costo Nuevo</th>
                                        <th className="px-6 py-4 font-semibold text-center">Variación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                    {datos.historialPrecios.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-10 text-slate-400">No hubo cambios de precio en el período seleccionado.</td></tr>
                                    ) : (
                                        datos.historialPrecios.map((hist: any) => {
                                            const esAumento = hist.porcentaje_cambio > 0;
                                            return (
                                                <tr key={hist.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                        {new Date(hist.fecha).toLocaleDateString('es-AR')} <span className="text-[10px] ml-1">{new Date(hist.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{hist.producto.nombre_producto}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">Cód: {hist.producto.codigo_articulo}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{hist.motivo}</td>
                                                    <td className="px-6 py-4 text-right font-medium text-slate-500">${hist.precio_costo_anterior.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">${hist.precio_costo_nuevo.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge className={`${esAumento ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-100' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'} font-black`}>
                                                            {esAumento ? '+' : ''}{hist.porcentaje_cambio.toFixed(1)}%
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* =========================================================
                VISTA 6: VOLUMEN PROVEEDORES (NUEVO)
                ========================================================= */}
            {tabActiva === "VOLUMEN" && datosVolumen && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-indigo-600 dark:bg-indigo-700 border-indigo-700 dark:border-indigo-800 shadow-sm">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-4 bg-white/20 rounded-full"><Droplets className="w-8 h-8 text-indigo-50" /></div>
                                <div>
                                    <p className="text-indigo-200 font-medium text-sm uppercase tracking-wider">Volumen Total Vendido</p>
                                    <h3 className="text-4xl font-black text-white">{datosVolumen.totalLitros.toLocaleString("es-AR")} <span className="text-xl font-normal opacity-80">Lts.</span></h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800 dark:bg-zinc-800 border-slate-900 dark:border-zinc-900 shadow-sm">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-4 bg-white/10 rounded-full"><Package className="w-8 h-8 text-slate-300" /></div>
                                <div>
                                    <p className="text-slate-400 font-medium text-sm uppercase tracking-wider">Unidades Físicas Movidas</p>
                                    <h3 className="text-4xl font-black text-white">{datosVolumen.totalUnidades.toLocaleString("es-AR")} <span className="text-xl font-normal opacity-80">Uds.</span></h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {Object.entries(datosVolumen.desglose).length === 0 ? (
                            <p className="text-muted-foreground text-center py-10 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-800 border-dashed">No hay ventas registradas en este rango de fechas.</p>
                        ) : (
                            Object.entries(datosVolumen.desglose).map(([proveedor, datosProv]: [string, any]) => (
                                <Card key={proveedor} className="shadow-sm border-slate-200 dark:border-zinc-800 overflow-hidden">
                                    <CardHeader className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 p-4">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base text-slate-800 dark:text-slate-200 uppercase tracking-tight font-black flex items-center gap-2"><Package className="h-4 w-4 text-slate-400" /> {proveedor}</CardTitle>
                                            <div className="text-right">
                                                <Badge className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 font-black mr-2 text-xs">
                                                    {datosProv.litros} Lts.
                                                </Badge>
                                                <Badge className="bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs">
                                                    {datosProv.unidades} U.
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-white dark:bg-zinc-900 text-slate-400 uppercase text-[10px] border-b border-slate-100 dark:border-zinc-800">
                                                <tr>
                                                    <th className="px-6 py-3 font-semibold">Marca Asociada</th>
                                                    <th className="px-6 py-3 text-right font-semibold">Unidades Vendidas</th>
                                                    <th className="px-6 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">Litros Vendidos</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                                {Object.entries(datosProv.marcas).map(([marca, metricas]: [string, any]) => (
                                                    <tr key={marca} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                                        <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">{marca}</td>
                                                        <td className="px-6 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">{metricas.unidades}</td>
                                                        <td className="px-6 py-3 text-right font-black text-indigo-600 dark:text-indigo-400">{metricas.litros} Lts.</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}