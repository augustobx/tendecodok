"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDashboardMetrics() {
    try {
        // 1. Fechas para filtrar "Hoy"
        const hoyInicio = new Date();
        hoyInicio.setHours(0, 0, 0, 0);
        const hoyFin = new Date();
        hoyFin.setHours(23, 59, 59, 999);

        // 2. Ventas de Hoy (Solo cobradas o parciales, sumamos el total)
        const ventasHoy = await prisma.venta.aggregate({
            where: { fecha_emision: { gte: hoyInicio, lte: hoyFin } },
            _sum: { total: true },
            _count: { id: true }
        });

        // 3. Plata en la calle (Cuentas Corrientes pendientes)
        const deudaTotal = await prisma.venta.aggregate({
            where: { estado_pago: { in: ['PENDIENTE', 'PARCIAL'] } },
            _sum: { saldo_pendiente: true }
        });

        // 4. Alertas de Stock (Calculado dinámicamente)
        const todos = await prisma.producto.findMany({
            select: { id: true, nombre_producto: true, stock_recomendado: true, stocks: { select: { cantidad: true } } }
        });

        let bajos: any[] = [];
        todos.forEach(p => {
            const stock_actual = p.stocks.reduce((acc, curr) => acc + curr.cantidad, 0);
            if (stock_actual <= p.stock_recomendado) {
                bajos.push({
                    id: p.id,
                    nombre_producto: p.nombre_producto,
                    stock_actual,
                    stock_recomendado: p.stock_recomendado
                });
            }
        });

        bajos.sort((a, b) => a.stock_actual - b.stock_actual);
        const totalBajoStock = bajos.length;
        const productosBajoStock = bajos.slice(0, 5);

        // 5. Caja Activa (Si hay turno abierto)
        const cajaActiva = await prisma.cajaDiaria.findFirst({
            where: { estado: 'ABIERTA' },
            include: { movimientos: true }
        });

        let efectivoEnCaja = cajaActiva?.saldo_inicial || 0;
        if (cajaActiva) {
            cajaActiva.movimientos.forEach(m => {
                if (m.metodo_pago === 'CONTADO') {
                    if (m.tipo === 'EGRESO_MANUAL') efectivoEnCaja -= m.monto;
                    else efectivoEnCaja += m.monto;
                }
            });
        }

        // 6. Últimas 5 ventas para el feed
        const ultimasVentas = await prisma.venta.findMany({
            take: 5,
            orderBy: { fecha_emision: 'desc' },
            include: { cliente: { select: { nombre_razon_social: true } } }
        });

        return {
            success: true,
            data: {
                ventasHoy: ventasHoy._sum.total || 0,
                cantidadVentasHoy: ventasHoy._count.id || 0,
                deudaTotal: deudaTotal._sum.saldo_pendiente || 0,
                totalBajoStock,
                productosBajoStock,
                efectivoEnCaja,
                cajaAbierta: !!cajaActiva,
                ultimasVentas
            }
        };
    } catch (error) {
        console.error("Error en Dashboard:", error);
        return { success: false, error: "Error al cargar las métricas." };
    }
}

export async function obtenerMetricasDeLitrosVendidos(fechaInicio: Date, fechaFin: Date) {
    try {
        // Buscamos detalles de venta en el rango de fechas de ventas NO CANCELADAS
        const detallesVendidos = await prisma.detalleVenta.findMany({
            where: {
                venta: {
                    fecha_emision: {
                        gte: fechaInicio,
                        lte: fechaFin,
                    },
                    // Si tienes estados de cancelación, agrégalos acá
                },
            },
            include: {
                producto: {
                    include: {
                        marca: true,
                        categoria: true,
                        proveedor: true,
                    },
                },
            },
        });

        let totalLitrosGenerales = 0;
        const litrosPorMarca: Record<string, number> = {};
        const litrosPorCategoria: Record<string, number> = {};
        const litrosPorProveedor: Record<string, number> = {};

        detallesVendidos.forEach((detalle) => {
            // Cálculo mágico: Unidades facturadas X Volumen de la lata
            const litrosPorUnidad = detalle.producto.litros_por_unidad || 0;
            const litrosDelItem = detalle.cantidad * litrosPorUnidad;

            // Solo acumulamos si el producto es de tipo "volumétrico" (litros > 0)
            if (litrosDelItem > 0) {
                totalLitrosGenerales += litrosDelItem;

                const nombreMarca = detalle.producto.marca?.nombre || "Sin Marca";
                litrosPorMarca[nombreMarca] = (litrosPorMarca[nombreMarca] || 0) + litrosDelItem;

                const nombreCategoria = detalle.producto.categoria?.nombre || "Sin Categoría";
                litrosPorCategoria[nombreCategoria] = (litrosPorCategoria[nombreCategoria] || 0) + litrosDelItem;

                const nombreProveedor = detalle.producto.proveedor?.nombre || "Sin Proveedor";
                litrosPorProveedor[nombreProveedor] = (litrosPorProveedor[nombreProveedor] || 0) + litrosDelItem;
            }
        });

        return {
            success: true,
            data: {
                totalLitrosGenerales,
                desglose: {
                    marcas: litrosPorMarca,
                    categorias: litrosPorCategoria,
                    proveedores: litrosPorProveedor,
                },
            }
        };
    } catch (error) {
        console.error("Error al obtener métricas de litros:", error);
        return { success: false, error: "Error al calcular las métricas de litros." };
    }
}