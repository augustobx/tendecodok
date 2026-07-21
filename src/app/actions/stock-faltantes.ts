"use server";

import prisma from "@/lib/prisma";

export async function getProductosFaltantes(categoriaId?: number, proveedorId?: number) {
    try {
        const todos = await prisma.producto.findMany({
            where: {
                ...(categoriaId ? { categoriaId } : {}),
                ...(proveedorId ? { proveedorId } : {})
            },
            include: {
                stocks: true,
                categoria: true,
                proveedor: true,
                marca: true
            }
        });

        let faltantes: any[] = [];
        todos.forEach(p => {
            const stock_actual = p.stocks.reduce((acc, curr) => acc + curr.cantidad, 0);
            if (stock_actual <= p.stock_recomendado) {
                faltantes.push({
                    ...p,
                    stock_actual
                });
            }
        });

        // Ordenar del que tiene menos stock (incluso negativo) hacia arriba
        faltantes.sort((a, b) => a.stock_actual - b.stock_actual);

        return { success: true, data: faltantes };
    } catch (error: any) {
        console.error("Error obteniendo productos faltantes:", error);
        return { success: false, error: "Error al obtener los faltantes." };
    }
}
