"use client";

import { useState, useEffect, useTransition } from "react";
import { getProductosFaltantes } from "@/app/actions/stock-faltantes";
import { getCategorias } from "@/app/actions/configuracion";
import { getProveedoresCompleto } from "@/app/actions/proveedores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, PackageSearch, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

export default function FaltantesStockPage() {
    const [isPending, startTransition] = useTransition();
    const [faltantes, setFaltantes] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filtroCategoria, setFiltroCategoria] = useState<string>("TODOS");
    const [filtroProveedor, setFiltroProveedor] = useState<string>("TODOS");

    const cargarDatos = async () => {
        setLoading(true);
        startTransition(async () => {
            const catRes = await getCategorias();
            const uniqueCats = Array.from(new Map(catRes.map((c: any) => [c.nombre, c])).values());
            setCategorias(uniqueCats);
            const provRes = await getProveedoresCompleto();
            setProveedores(Array.isArray(provRes) ? provRes : []);

            const catId = filtroCategoria === "TODOS" ? undefined : Number(filtroCategoria);
            const provId = filtroProveedor === "TODOS" ? undefined : Number(filtroProveedor);
            
            const faltRes = await getProductosFaltantes(catId, provId);
            if (faltRes.success && faltRes.data) {
                setFaltantes(faltRes.data);
            } else {
                toast.error(faltRes.error || "Error al cargar faltantes");
            }
            setLoading(false);
        });
    };

    useEffect(() => {
        cargarDatos();
    }, [filtroCategoria, filtroProveedor]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium animate-pulse">Analizando inventario...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Faltantes de Stock</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Productos por debajo del stock recomendado.</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Link href="/inventario">
                        <Button variant="outline" className="w-full md:w-auto bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800">
                            Volver a Inventario
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filtros */}
            <Card className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Filter className="h-4 w-4 text-slate-400" /> Filtros de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoría</label>
                        <Select value={filtroCategoria} onValueChange={(val) => setFiltroCategoria(val || "TODOS")}>
                            <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                                <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                                <SelectItem value="TODOS">Todas las categorías</SelectItem>
                                {categorias.map((c: any) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Proveedor</label>
                        <Select value={filtroProveedor} onValueChange={(val) => setFiltroProveedor(val || "TODOS")}>
                            <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                                <SelectValue placeholder="Todos los proveedores" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                                <SelectItem value="TODOS">Todos los proveedores</SelectItem>
                                {proveedores.map((p: any) => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        {(filtroCategoria !== "TODOS" || filtroProveedor !== "TODOS") && (
                            <Button 
                                variant="ghost" 
                                onClick={() => { setFiltroCategoria("TODOS"); setFiltroProveedor("TODOS"); }}
                                className="h-10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                <X className="h-4 w-4 mr-2" /> Limpiar Filtros
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Resultados */}
            <Card className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase tracking-wider bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Producto</th>
                                <th className="px-6 py-4 font-semibold">Categoría / Marca</th>
                                <th className="px-6 py-4 font-semibold">Proveedor</th>
                                <th className="px-6 py-4 font-semibold text-center">Recomendado</th>
                                <th className="px-6 py-4 font-semibold text-center">Actual</th>
                                <th className="px-6 py-4 font-semibold text-right">Faltante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {faltantes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <PackageSearch className="h-12 w-12 mb-3 opacity-20" />
                                            <p className="font-medium text-slate-500">No se encontraron productos faltantes con estos filtros.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                faltantes.map((prod) => {
                                    const diff = prod.stock_recomendado - prod.stock_actual;
                                    return (
                                        <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-slate-900 dark:text-white">{prod.nombre_producto}</div>
                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{prod.codigo_articulo}</div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{prod.categoria?.nombre || "-"}</div>
                                                <div className="text-[10px] text-slate-500">{prod.marca?.nombre || "-"}</div>
                                            </td>
                                            <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400">
                                                {prod.proveedor?.nombre || "-"}
                                            </td>
                                            <td className="px-6 py-3 text-center text-slate-700 dark:text-slate-300 font-medium">
                                                {prod.stock_recomendado}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <Badge variant="outline" className={`font-mono text-xs ${prod.stock_actual <= 0 ? 'text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10' : 'text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-500/10'}`}>
                                                    {prod.stock_actual}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="font-black text-red-600 dark:text-red-400">-{diff > 0 ? diff : 0}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
