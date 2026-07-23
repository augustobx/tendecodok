"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Search, Package, AlertTriangle, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calcularPrecioConCascada, formatCantidad, getUnidadLabel } from "@/lib/utils";
import type { ProductoColumn } from "./stock-table";

interface MobileStockListProps {
    data: ProductoColumn[];
    listasGlobales: any[];
}

export function MobileStockList({ data, listasGlobales }: MobileStockListProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filtrado simple para la barra de búsqueda en móvil
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lower = searchTerm.toLowerCase();
        return data.filter(
            (p) =>
                p.nombre_producto.toLowerCase().includes(lower) ||
                p.codigo_barras.includes(lower) ||
                p.codigo_articulo.toLowerCase().includes(lower) ||
                p.proveedor.toLowerCase().includes(lower)
        );
    }, [data, searchTerm]);

    return (
        <div className="flex flex-col w-full pb-20">
            {/* BARRA DE BÚSQUEDA FIJA (Sticky) para no perderla al scrollear */}
            <div className="sticky top-0 z-50 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md p-4 border-b border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre, código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 rounded-xl text-base shadow-sm focus-visible:ring-indigo-500"
                    />
                </div>
                <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 text-right">
                    {filteredData.length} productos
                </div>
            </div>

            {/* LISTA DE TARJETAS */}
            <div className="p-4 space-y-4">
                {filteredData.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                        <Package className="h-12 w-12 mb-2 opacity-20" />
                        <p>No se encontraron productos.</p>
                    </div>
                ) : (
                    filteredData.map((producto) => {
                        const isZero = producto.stock_actual <= 0;
                        const isLowStock = producto.stock_actual <= producto.stock_recomendado;

                        return (
                            <div
                                key={producto.id}
                                className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 border shadow-sm transition-all
                  ${isZero ? 'border-red-200 dark:border-red-900/30' : isLowStock ? 'border-orange-200 dark:border-orange-900/30' : 'border-slate-200 dark:border-zinc-800'}
                `}
                            >
                                {/* CABECERA TARJETA: Nombre y Proveedor */}
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight text-lg">
                                            {producto.nombre_producto}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                            Prov: <span className="text-slate-700 dark:text-slate-300">{producto.proveedor}</span> | Cód: {producto.codigo_barras}
                                        </p>
                                    </div>

                                    {/* INDICADOR DE STOCK */}
                                    <div className="flex flex-col items-end shrink-0">
                                        <Badge
                                            variant="outline"
                                            className={`font-black text-sm px-2 py-1 ${isZero ? 'bg-red-50 text-red-700 border-red-200'
                                                    : isLowStock ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}
                                        >
                                            {formatCantidad(producto.stock_actual, producto.tipo_medicion as any)} {getUnidadLabel(producto.tipo_medicion as any)}
                                        </Badge>
                                        {(isZero || isLowStock) && (
                                            <span className="flex items-center text-[10px] mt-1 font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                {isZero ? <AlertTriangle className="h-3 w-3 text-red-500 mr-1" /> : <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />}
                                                {isZero ? "Sin Stock" : "Stock Bajo"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* GRILLA DE PRECIOS */}
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <Tag className="h-3.5 w-3.5" /> Precios de Venta
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {listasGlobales.map((lista) => {
                                            const pivot = producto.listas_precios?.find((lp) => lp.listaPrecioId === lista.id);
                                            const margenFinal = pivot?.margen_personalizado ?? lista.margen_defecto;

                                            const precioFinal = calcularPrecioConCascada(
                                                producto.precio_costo,
                                                producto.descuento_proveedor || 0,
                                                producto.alicuota_iva || 21,
                                                producto.aumento_proveedor || 0,
                                                producto.aumento_marca || 0,
                                                producto.aumento_categoria || 0,
                                                margenFinal
                                            );

                                            return (
                                                <div key={lista.id} className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 flex flex-col border border-slate-100 dark:border-zinc-800">
                                                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1 line-clamp-1">
                                                        {lista.nombre}
                                                    </span>
                                                    <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">
                                                        {formatCurrency(precioFinal, producto.moneda)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}