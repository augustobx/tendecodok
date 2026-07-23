"use client";

import { useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowUpRight } from "lucide-react";
import { actualizarStockRapido } from "@/app/actions/productos";
import { getDepositos } from "@/app/actions/configuracion";
import { getClientSession } from "@/app/actions/auth";
import { getStepParaMedicion } from "@/lib/utils";

export function FastEditForm({ prod, onSuccess }: { prod: any, onSuccess: () => void }) {
    const [isPending, startTransition] = useTransition();
    const [depositos, setDepositos] = useState<any[]>([]);
    const [usuarioId, setUsuarioId] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const [formRapido, setFormRapido] = useState({
        cantidad_sumar: 0,
        stock_recomendado: prod.stock_recomendado || 0,
        precio_costo: prod.precio_costo || 0,
        depositoId: ""
    });

    useEffect(() => {
        async function loadData() {
            try {
                const deps = await getDepositos();
                setDepositos(deps);
                const session = await getClientSession();
                if ((session as any)?.id) setUsuarioId(Number((session as any).id));
                if (deps.length > 0) {
                    setFormRapido(prev => ({ ...prev, depositoId: String(deps[0].id) }));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleGuardarRapido = () => {
        if (formRapido.precio_costo <= 0) return toast.error("El precio debe ser mayor a 0.");
        if (formRapido.cantidad_sumar !== 0 && !formRapido.depositoId) return toast.error("Debe seleccionar un depósito para ingresar/retirar stock.");
        if (!usuarioId) return toast.error("No se pudo identificar al usuario.");

        startTransition(async () => {
            const depId = formRapido.depositoId ? Number(formRapido.depositoId) : 0;
            const res = await actualizarStockRapido(prod.id, Number(formRapido.cantidad_sumar), Number(formRapido.stock_recomendado), Number(formRapido.precio_costo), depId, usuarioId);
            if (res.success) {
                toast.success("Producto actualizado!", { description: "Impactado en listas e historial." });
                onSuccess();
            } else {
                toast.error(res.error);
            }
        });
    };

    if (isLoading) return <div className="mt-4 p-4 text-center text-xs text-slate-500 dark:text-slate-400"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>;

    const stepStock = getStepParaMedicion(prod.tipo_medicion);

    return (
        <div className="mt-4 border-t border-slate-200 dark:border-zinc-700 pt-4 space-y-4 animate-in fade-in">
            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Actualización Rápida</h4>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider">Ajuste de Stock (+/-)</Label>
                    <Input type="number" step={stepStock} value={formRapido.cantidad_sumar} onChange={(e) => setFormRapido({ ...formRapido, cantidad_sumar: Number(e.target.value) })}
                        className="h-9 font-black text-center border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-1.5">
                    <Label className="font-bold text-[10px] uppercase text-indigo-600 tracking-wider">Nuevo Costo Base</Label>
                    <div className="relative">
                        <span className="absolute left-2 top-2 text-indigo-400 font-bold">$</span>
                        <Input type="number" step="0.01" value={formRapido.precio_costo} onChange={(e) => setFormRapido({ ...formRapido, precio_costo: Number(e.target.value) })}
                            className="h-9 pl-6 font-black text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 focus-visible:ring-indigo-500" />
                    </div>
                </div>
            </div>

            {formRapido.cantidad_sumar !== 0 && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                    <Label className="font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider">Depósito Destino/Origen</Label>
                    <select
                        className="w-full h-9 border border-slate-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 text-sm"
                        value={formRapido.depositoId}
                        onChange={(e) => setFormRapido({ ...formRapido, depositoId: e.target.value })}
                    >
                        {depositos.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.nombre}</option>
                        ))}
                    </select>
                </div>
            )}

            <Button onClick={handleGuardarRapido} disabled={isPending} className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-9">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowUpRight className="h-4 w-4 mr-2" />} 
                {isPending ? "Guardando..." : "Aplicar Actualización"}
            </Button>
        </div>
    );
}
