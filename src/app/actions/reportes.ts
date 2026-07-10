"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getReporteMaestro(filtros: { fecha_desde?: string; fecha_hasta?: string }) {
    try {
        // 1. FILTRO DE FECHAS PARA VENTAS
        let dateFilter: any = {};
        if (filtros.fecha_desde || filtros.fecha_hasta) {
            dateFilter.fecha_emision = {};
            if (filtros.fecha_desde) dateFilter.fecha_emision.gte = new Date(`${filtros.fecha_desde}T00:00:00.000Z`);
            if (filtros.fecha_hasta) dateFilter.fecha_emision.lte = new Date(`${filtros.fecha_hasta}T23:59:59.999Z`);
        }

        // TRAER TODAS LAS VENTAS DEL PERÍODO
        const ventas = await prisma.venta.findMany({
            where: dateFilter,
            include: {
                cliente: true,
                detalles: { include: { producto: true } }
            }
        });

        // 2. FILTRO DE FECHAS PARA CAJAS
        let cajaFilter: any = {};
        if (filtros.fecha_desde || filtros.fecha_hasta) {
            cajaFilter.fecha_apertura = {};
            if (filtros.fecha_desde) cajaFilter.fecha_apertura.gte = new Date(`${filtros.fecha_desde}T00:00:00.000Z`);
            if (filtros.fecha_hasta) cajaFilter.fecha_apertura.lte = new Date(`${filtros.fecha_hasta}T23:59:59.999Z`);
        }

        // TRAER CAJAS DEL PERÍODO
        const cajas = await prisma.cajaDiaria.findMany({
            where: cajaFilter,
            include: { movimientos: true }
        });

        // 3. FILTRO DE FECHAS PARA INFLACIÓN (HISTORIAL DE PRECIOS)
        let historialFilter: any = {};
        if (filtros.fecha_desde || filtros.fecha_hasta) {
            historialFilter.fecha = {};
            if (filtros.fecha_desde) historialFilter.fecha.gte = new Date(`${filtros.fecha_desde}T00:00:00.000Z`);
            if (filtros.fecha_hasta) historialFilter.fecha.lte = new Date(`${filtros.fecha_hasta}T23:59:59.999Z`);
        }

        // TRAER EL HISTORIAL DE INFLACIÓN
        const cambiosPrecio = await prisma.historialPrecio.findMany({
            where: historialFilter,
            include: { producto: { select: { nombre_producto: true, codigo_articulo: true } } },
            orderBy: { fecha: 'desc' }
        });

        // Calcular inflación promedio del período
        const aumentos = cambiosPrecio.filter(c => c.porcentaje_cambio > 0);
        const inflacionPromedio = aumentos.length > 0
            ? aumentos.reduce((acc, curr) => acc + curr.porcentaje_cambio, 0) / aumentos.length
            : 0;


        // --- PROCESAMIENTO MATEMÁTICO ---

        let totalIngresos = 0;
        let costoTotalMercaderia = 0;
        let totalDescuentos = 0;
        const ingresosPorMedio: Record<string, number> = {};

        const rankingProductos: Record<number, { nombre: string, cantidad: number, recaudado: number, rentabilidad: number }> = {};
        const rankingClientes: Record<number, { nombre: string, comprado: number, adeudado: number }> = {};

        ventas.forEach(v => {
            // Financiero General
            totalIngresos += v.total;
            totalDescuentos += v.descuento_global;
            ingresosPorMedio[v.metodo_pago] = (ingresosPorMedio[v.metodo_pago] || 0) + v.total;

            // Clientes
            if (!rankingClientes[v.clienteId]) {
                rankingClientes[v.clienteId] = { nombre: v.cliente.nombre_razon_social, comprado: 0, adeudado: 0 };
            }
            rankingClientes[v.clienteId].comprado += v.total;
            rankingClientes[v.clienteId].adeudado += v.saldo_pendiente;

            // Productos
            v.detalles.forEach(det => {
                const prodId = det.producto.id;
                const costoLinea = det.producto.precio_costo * det.cantidad;
                costoTotalMercaderia += costoLinea;

                const rentabilidadLinea = det.subtotal - costoLinea;

                if (!rankingProductos[prodId]) {
                    rankingProductos[prodId] = { nombre: det.producto.nombre_producto, cantidad: 0, recaudado: 0, rentabilidad: 0 };
                }
                rankingProductos[prodId].cantidad += det.cantidad;
                rankingProductos[prodId].recaudado += det.subtotal;
                rankingProductos[prodId].rentabilidad += rentabilidadLinea;
            });
        });

        // Egresos de Caja
        let totalGastosCaja = 0;
        cajas.forEach(c => {
            c.movimientos.forEach(m => {
                if (m.tipo === 'EGRESO_MANUAL') totalGastosCaja += m.monto;
            });
        });

        // Ordenar Rankings
        const topProductosVendidos = Object.values(rankingProductos).sort((a, b) => b.cantidad - a.cantidad).slice(0, 15);
        const topProductosRentables = Object.values(rankingProductos).sort((a, b) => b.rentabilidad - a.rentabilidad).slice(0, 15);

        // Para los "Menos Vendidos", buscamos en todo el inventario
        const todosLosProductos = await prisma.producto.findMany({
            select: { id: true, nombre_producto: true, stocks: { select: { cantidad: true } } }
        });
        const productosMenosVendidos = todosLosProductos.map(p => {
            const stats = rankingProductos[p.id];
            return {
                nombre: p.nombre_producto,
                cantidad: stats ? stats.cantidad : 0,
                stock_clavado: p.stocks.reduce((acc, current) => acc + current.cantidad, 0)
            };
        }).sort((a, b) => a.cantidad - b.cantidad).slice(0, 15);

        const topClientes = Object.values(rankingClientes).sort((a, b) => b.comprado - a.comprado).slice(0, 15);
        const topDeudores = Object.values(rankingClientes).sort((a, b) => b.adeudado - a.adeudado).filter(c => c.adeudado > 0).slice(0, 15);

        return {
            success: true,
            data: {
                kpis: {
                    ventasTotales: ventas.length,
                    ingresosTotales: totalIngresos,
                    costoMercaderia: costoTotalMercaderia,
                    gananciaBruta: totalIngresos - costoTotalMercaderia,
                    margenPromedio: totalIngresos > 0 ? ((totalIngresos - costoTotalMercaderia) / totalIngresos) * 100 : 0,
                    ticketPromedio: ventas.length > 0 ? totalIngresos / ventas.length : 0,
                    totalDescuentosOtorgados: totalDescuentos,
                    totalGastosCaja,
                    inflacionPromedio
                },
                mediosDePago: ingresosPorMedio,
                historialPrecios: cambiosPrecio,
                rankings: {
                    topProductosVendidos,
                    topProductosRentables,
                    productosMenosVendidos,
                    topClientes,
                    topDeudores
                }
            }
        };

    } catch (error) {
        console.error("Error al procesar reportes:", error);
        return { success: false, error: "Error al procesar los datos analíticos." };
    }
}

// ==========================================
// NUEVO: REPORTE VOLUMÉTRICO PARA PROVEEDORES
// ==========================================
export async function getReporteVolumetrico(fechaInicio: string, fechaFin: string) {
    try {
        const dateFilter: any = {};
        if (fechaInicio) dateFilter.gte = new Date(`${fechaInicio}T00:00:00.000Z`);
        if (fechaFin) dateFilter.lte = new Date(`${fechaFin}T23:59:59.999Z`);

        // Buscamos detalles vendidos en el rango
        const ventas = await prisma.detalleVenta.findMany({
            where: {
                venta: { fecha_emision: dateFilter }
            },
            include: {
                producto: {
                    include: { proveedor: true, marca: true }
                }
            }
        });

        let totalLitros = 0;
        let totalUnidades = 0;
        const metricasPorProveedor: Record<string, { unidades: number; litros: number; marcas: Record<string, { unidades: number; litros: number }> }> = {};

        ventas.forEach(detalle => {
            const prod = detalle.producto;
            const provNombre = prod.proveedor?.nombre || "Sin Proveedor";
            const marcaNombre = prod.marca?.nombre || "Sin Marca";

            const cantUnidades = detalle.cantidad;
            // Acá usamos el nuevo campo que agregamos al schema
            const cantLitros = cantUnidades * (prod.litros_por_unidad || 0);

            totalUnidades += cantUnidades;
            totalLitros += cantLitros;

            if (!metricasPorProveedor[provNombre]) {
                metricasPorProveedor[provNombre] = { unidades: 0, litros: 0, marcas: {} };
            }
            metricasPorProveedor[provNombre].unidades += cantUnidades;
            metricasPorProveedor[provNombre].litros += cantLitros;

            if (!metricasPorProveedor[provNombre].marcas[marcaNombre]) {
                metricasPorProveedor[provNombre].marcas[marcaNombre] = { unidades: 0, litros: 0 };
            }
            metricasPorProveedor[provNombre].marcas[marcaNombre].unidades += cantUnidades;
            metricasPorProveedor[provNombre].marcas[marcaNombre].litros += cantLitros;
        });

        return { success: true, data: { totalLitros, totalUnidades, desglose: metricasPorProveedor } };
    } catch (error) {
        console.error("Error al generar reporte volumetrico:", error);
        return { success: false, error: "Error al generar reporte de volumen." };
    }
}

// ==========================================
// REPORTE FINANCIERO PROFESIONAL
// ==========================================
export async function getReporteFinanciero(filtros: {
    fechaDesde?: string;
    fechaHasta?: string;
    listaPrecioId?: number;
}) {
    try {
        const whereClause: any = {};
        
        if (filtros.fechaDesde || filtros.fechaHasta) {
            whereClause.fecha_emision = {};
            if (filtros.fechaDesde) {
                whereClause.fecha_emision.gte = new Date(filtros.fechaDesde);
            }
            if (filtros.fechaHasta) {
                const hasta = new Date(filtros.fechaHasta);
                hasta.setHours(23, 59, 59, 999);
                whereClause.fecha_emision.lte = hasta;
            }
        }
        
        if (filtros.listaPrecioId) {
            whereClause.listaPrecioId = filtros.listaPrecioId;
        }

        const ventas = await prisma.venta.findMany({
            where: whereClause,
            include: {
                detalles: {
                    include: {
                        producto: true
                    }
                },
                listaPrecio: true,
                cliente: true
            },
            orderBy: {
                fecha_emision: 'desc'
            }
        });

        let ingresosTotales = 0;
        let costoTotal = 0;
        let impuestosTotales = 0;
        let descuentosTotales = 0;
        
        const detallesReporte = ventas.map(venta => {
            let costoVenta = 0;
            let descuentoVenta = venta.descuento_global || 0;
            
            venta.detalles.forEach(det => {
                const cantNeta = det.cantidad - (det.cantidad_devuelta || 0);
                const costoUnitario = det.precio_costo > 0 ? det.precio_costo : (det.producto?.precio_costo || 0);
                costoVenta += costoUnitario * cantNeta;
                descuentoVenta += (det.precio_unitario - det.precio_final) * cantNeta;
            });
            
            ingresosTotales += venta.total;
            costoTotal += costoVenta;
            impuestosTotales += venta.importe_iva || 0;
            descuentosTotales += descuentoVenta;
            
            const ingresoSinIva = venta.total - (venta.importe_iva || 0);
            const gananciaBrutaVenta = ingresoSinIva - costoVenta;
            
            return {
                id: venta.id,
                fecha: venta.fecha_emision,
                comprobante: `${venta.tipo_comprobante.replace('_', ' ')} ${String(venta.punto_venta).padStart(4, '0')}-${String(venta.numero_comprobante).padStart(8, '0')}`,
                cliente: venta.cliente.nombre_razon_social,
                lista_precio: venta.listaPrecio.nombre,
                total: venta.total,
                costo: costoVenta,
                impuestos: venta.importe_iva || 0,
                descuentos: descuentoVenta,
                ganancia_neta: gananciaBrutaVenta
            };
        });

        const gananciaBrutaTotal = ingresosTotales - impuestosTotales - costoTotal;
        const gananciaNetaTotal = gananciaBrutaTotal;

        return {
            success: true,
            data: {
                kpis: {
                    ingresosTotales,
                    costoTotal,
                    impuestosTotales,
                    descuentosTotales,
                    gananciaBrutaTotal,
                    gananciaNetaTotal
                },
                detalles: detallesReporte
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}