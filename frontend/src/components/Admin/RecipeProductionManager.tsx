import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/format';
import {
  Calculator,
  Droplets,
  Package,
  Plus,
  Minus,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Boxes,
  ArrowUpRight,
  Info,
  Check,
  Scale,
  Sparkles,
  ArrowRight,
  Layers,
  X,
} from 'lucide-react';

export interface ToppingRecipeItem {
  id: string;
  name: string;
  packageType: string;
  packageWeightGrams: number;
  packageCost: number;
  portionOz: number;
  bagsInStock: number;
  minBagsAlert: number;
}

export interface MachineRecipeConfig {
  tankCapacityLiters: number;
  waterLiters: number;
  pulpLiters: number;
  syrupLiters: number;
  pulpCostPerLiter: number;
  syrupCostPerLiter: number;
}

export const RecipeProductionManager: React.FC = () => {
  const { config, addExpense, setAdminSubTab, inventory, updateInventoryStock } = useApp();

  // ─── 1. CONVERTIDOR RÁPIDO EN VIVO (DE BOLSILLO) ─────────────
  const [convMode, setConvMode] = useState<'liquid' | 'weight' | 'cups'>('liquid');
  
  // Líquido: Litros ⇄ Onzas Líquidas ⇄ Mililitros
  const [convLiters, setConvLiters] = useState<number>(10);
  const [convFlOz, setConvFlOz] = useState<number>(338.1);
  const [convMl, setConvMl] = useState<number>(10000);

  const handleLitersChange = (l: number) => {
    setConvLiters(l);
    setConvFlOz(Number((l * 33.814).toFixed(1)));
    setConvMl(Math.round(l * 1000));
  };

  const handleFlOzChange = (oz: number) => {
    setConvFlOz(oz);
    const l = Number((oz / 33.814).toFixed(2));
    setConvLiters(l);
    setConvMl(Math.round(l * 1000));
  };

  const handleMlChange = (ml: number) => {
    setConvMl(ml);
    const l = Number((ml / 1000).toFixed(2));
    setConvLiters(l);
    setConvFlOz(Number((l * 33.814).toFixed(1)));
  };

  // Peso: Kilos ⇄ Onzas de Peso ⇄ Gramos
  const [convKg, setConvKg] = useState<number>(1);
  const [convWeightOz, setConvWeightOz] = useState<number>(35.3);
  const [convGrams, setConvGrams] = useState<number>(1000);

  const handleKgChange = (kg: number) => {
    setConvKg(kg);
    setConvWeightOz(Number((kg * 35.274).toFixed(1)));
    setConvGrams(Math.round(kg * 1000));
  };

  const handleWeightOzChange = (oz: number) => {
    setConvWeightOz(oz);
    const kg = Number((oz / 35.274).toFixed(3));
    setConvKg(kg);
    setConvGrams(Math.round(kg * 1000));
  };

  const handleGramsChange = (g: number) => {
    setConvGrams(g);
    const kg = Number((g / 1000).toFixed(3));
    setConvKg(kg);
    setConvWeightOz(Number((kg * 35.274).toFixed(1)));
  };

  // Calculadora Inversa: ¿Cuántos vasos quiero preparar?
  const [targetCupSize, setTargetCupSize] = useState<12 | 16 | 24>(16);
  const [targetCupCount, setTargetCupCount] = useState<number>(30);

  // ─── 2. RECETA Y CARGA DE LA MÁQUINA GRANIZADORA ─────────────
  const initialMachineRecipe: MachineRecipeConfig = {
    tankCapacityLiters: 10,
    waterLiters: 6,
    pulpLiters: 3,
    syrupLiters: 1,
    pulpCostPerLiter: 8500,
    syrupCostPerLiter: 4500,
  };

  const [machineRecipe, setMachineRecipe] = useState<MachineRecipeConfig>(() => {
    try {
      const saved = localStorage.getItem('doblee_machine_recipe');
      return saved ? JSON.parse(saved) : initialMachineRecipe;
    } catch {
      return initialMachineRecipe;
    }
  });

  useEffect(() => {
    localStorage.setItem('doblee_machine_recipe', JSON.stringify(machineRecipe));
  }, [machineRecipe]);

  // Cálculos de máquina
  const totalBatchLiters = machineRecipe.waterLiters + machineRecipe.pulpLiters + machineRecipe.syrupLiters;
  const totalBatchFlOz = totalBatchLiters * 33.814;
  const totalBatchCost = (machineRecipe.pulpLiters * machineRecipe.pulpCostPerLiter) + (machineRecipe.syrupLiters * machineRecipe.syrupCostPerLiter);
  const costPerFlOz = totalBatchFlOz > 0 ? totalBatchCost / totalBatchFlOz : 0;

  const yield12Oz = Math.floor(totalBatchFlOz / 12);
  const yield16Oz = Math.floor(totalBatchFlOz / 16);
  const yield24Oz = Math.floor(totalBatchFlOz / 24);

  // ─── 3. RECETARIO DE TOPPINGS POR BOLSA / KILO ──────────────
  const defaultToppingRecipes: ToppingRecipeItem[] = [
    {
      id: 't1',
      name: 'Gomitas Ácidas Trululu',
      packageType: 'Bolsa de 1 Kg (1.000g)',
      packageWeightGrams: 1000,
      packageCost: 14500,
      portionOz: 1.0,
      bagsInStock: 6,
      minBagsAlert: 2,
    },
    {
      id: 't2',
      name: 'Leche Condensada (Lecherita)',
      packageType: 'Tarro de 1 Kg (1.000g)',
      packageWeightGrams: 1000,
      packageCost: 16000,
      portionOz: 0.8,
      bagsInStock: 4,
      minBagsAlert: 2,
    },
    {
      id: 't3',
      name: 'Salsa Chamoy Mega con Fruta',
      packageType: 'Botella de 1 Litro (1.000ml)',
      packageWeightGrams: 1000,
      packageCost: 12500,
      portionOz: 1.2,
      bagsInStock: 5,
      minBagsAlert: 2,
    },
    {
      id: 't4',
      name: 'Galleta Oreo Triturada',
      packageType: 'Bolsa de 500g',
      packageWeightGrams: 500,
      packageCost: 9500,
      portionOz: 0.7,
      bagsInStock: 7,
      minBagsAlert: 3,
    },
    {
      id: 't5',
      name: 'Maracuyá Natural con Semilla',
      packageType: 'Bolsa de 1 Kg (1.000g)',
      packageWeightGrams: 1000,
      packageCost: 9000,
      portionOz: 1.5,
      bagsInStock: 3,
      minBagsAlert: 2,
    },
    {
      id: 't6',
      name: 'Chips de Chocolate & Masmelos',
      packageType: 'Bolsa de 500g',
      packageWeightGrams: 500,
      packageCost: 8500,
      portionOz: 0.8,
      bagsInStock: 5,
      minBagsAlert: 2,
    },
  ];

  const [toppingsRecipes, setToppingsRecipes] = useState<ToppingRecipeItem[]>(() => {
    try {
      const saved = localStorage.getItem('doblee_toppings_recipes');
      return saved ? JSON.parse(saved) : defaultToppingRecipes;
    } catch {
      return defaultToppingRecipes;
    }
  });

  useEffect(() => {
    localStorage.setItem('doblee_toppings_recipes', JSON.stringify(toppingsRecipes));
  }, [toppingsRecipes]);

  // Modal para Comprar Bolsas / Vincular a Finanzas
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedTopping, setSelectedTopping] = useState<ToppingRecipeItem | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(5);
  const [buyUnitCost, setBuyUnitCost] = useState<number>(14500);
  const [linkToFinances, setLinkToFinances] = useState<boolean>(true);
  const [buySuccessMsg, setBuySuccessMsg] = useState<string | null>(null);

  // Modal para Cargar Máquina
  const [isBatchLoadModalOpen, setIsBatchLoadModalOpen] = useState(false);
  const [linkBatchToFinances, setLinkBatchToFinances] = useState(false);

  const openBuyModal = (item: ToppingRecipeItem) => {
    setSelectedTopping(item);
    setBuyQuantity(3);
    setBuyUnitCost(item.packageCost);
    setLinkToFinances(true);
    setIsBuyModalOpen(true);
  };

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopping || buyQuantity <= 0) return;

    const totalCost = buyQuantity * buyUnitCost;

    // 1. Actualizar el stock de bolsas local
    setToppingsRecipes(prev =>
      prev.map(t =>
        t.id === selectedTopping.id
          ? { ...t, bagsInStock: t.bagsInStock + buyQuantity, packageCost: buyUnitCost }
          : t
      )
    );

    // 2. Si está seleccionado vincular a Finanzas, registrar el egreso en AppContext
    if (linkToFinances) {
      addExpense({
        date: new Date().toISOString(),
        category: 'Insumos & Frutas',
        description: `Compra de insumo: ${buyQuantity} bolsas/tarros de ${selectedTopping.name} (${selectedTopping.packageType})`,
        amount: totalCost,
      });
    }

    setBuySuccessMsg(
      `¡Se registraron ${buyQuantity} bolsas de "${selectedTopping.name}" y se envió el egreso de ${formatMoney(totalCost, config.currencySymbol)} al Módulo de Finanzas!`
    );
    setTimeout(() => setBuySuccessMsg(null), 4000);

    setIsBuyModalOpen(false);
  };

  const handleOpenBag = (id: string) => {
    setToppingsRecipes(prev =>
      prev.map(t => {
        if (t.id === id) {
          if (t.bagsInStock <= 0) return t;
          return { ...t, bagsInStock: t.bagsInStock - 1 };
        }
        return t;
      })
    );
  };

  const handleConfirmBatchLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkBatchToFinances && totalBatchCost > 0) {
      addExpense({
        date: new Date().toISOString(),
        category: 'Hielo & Jarabes',
        description: `Carga de Máquina Granizadora: ${totalBatchLiters}L (${totalBatchFlOz.toFixed(0)} oz) de base de nieve`,
        amount: totalBatchCost,
      });
    }
    setBuySuccessMsg(`¡Carga de ${totalBatchLiters}L registrada con éxito! Rinde ~${yield16Oz} vasos de 16 oz.`);
    setTimeout(() => setBuySuccessMsg(null), 4000);
    setIsBatchLoadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ALERTA DE ÉXITO */}
      {buySuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{buySuccessMsg}</span>
          </div>
          <button onClick={() => setBuySuccessMsg(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── ENCABEZADO Y VÍNCULO CON FINANZAS ─── */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                Escandallo & Conversión en Tiempo Real
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/90 text-slate-900 text-[10px] font-black uppercase tracking-wider">
                ✓ Conectado a Finanzas
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight leading-tight">
              Recetario de Máquina, Bolsas & Onzas
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
              Calcula exactamente cuánto líquido echar a la máquina, cuántos vasos te rinde cada carga y el rendimiento exacto de cada bolsa de topping.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdminSubTab('finances')}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Ver Libro de Finanzas ↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 1. CONVERTIDOR RÁPIDO EN VIVO (DE BOLSILLO) ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Conversor Rápido en Vivo</h3>
              <p className="text-[11px] text-slate-400">Traducción automática en doble vía (Onzas ⇄ Litros ⇄ Kilos ⇄ Vasos)</p>
            </div>
          </div>

          {/* Selector de modo */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setConvMode('liquid')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${convMode === 'liquid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              💧 Líquidos (Litros / Oz)
            </button>
            <button
              onClick={() => setConvMode('weight')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${convMode === 'weight' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ⚖️ Sólidos (Kilos / Oz)
            </button>
            <button
              onClick={() => setConvMode('cups')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${convMode === 'cups' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              🥤 Calculadora por Vasos
            </button>
          </div>
        </div>

        {/* MODO 1: LÍQUIDOS */}
        {convMode === 'liquid' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Litros */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
                <label className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1">
                  Litros (L)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={convLiters}
                    onChange={e => handleLitersChange(Number(e.target.value))}
                    className="w-full text-lg font-mono font-bold text-slate-900 bg-white border border-amber-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-xs font-bold text-amber-700">L</span>
                </div>
              </div>

              {/* Onzas Líquidas */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
                <label className="text-[10px] font-black uppercase tracking-wider text-blue-800 block mb-1">
                  Onzas Líquidas (Fl Oz)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={convFlOz}
                    onChange={e => handleFlOzChange(Number(e.target.value))}
                    className="w-full text-lg font-mono font-bold text-slate-900 bg-white border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-xs font-bold text-blue-700">Oz</span>
                </div>
              </div>

              {/* Mililitros */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Mililitros (ml)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={convMl}
                    onChange={e => handleMlChange(Number(e.target.value))}
                    className="w-full text-lg font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <span className="text-xs font-bold text-slate-600">ml</span>
                </div>
              </div>
            </div>

            {/* Rendimiento visual en vasos */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                Rendimiento de {convLiters} Litros ({convFlOz} Oz):
              </span>
              <div className="flex items-center gap-4 font-mono font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                  🥤 Vaso 12 oz: <strong className="text-amber-600">{Math.floor(convFlOz / 12)} vasos</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                  🥤 Vaso 16 oz: <strong className="text-amber-600">{Math.floor(convFlOz / 16)} vasos</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                  🥤 Vaso 24 oz: <strong className="text-amber-600">{Math.floor(convFlOz / 24)} vasos</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MODO 2: SÓLIDOS / PESO */}
        {convMode === 'weight' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Kilos */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <label className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                  Kilos (Kg)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={convKg}
                    onChange={e => handleKgChange(Number(e.target.value))}
                    className="w-full text-lg font-mono font-bold text-slate-900 bg-white border border-emerald-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="text-xs font-bold text-emerald-700">Kg</span>
                </div>
              </div>

              {/* Onzas de Peso */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40">
                <label className="text-[10px] font-black uppercase tracking-wider text-purple-800 block mb-1">
                  Onzas de Peso (Oz)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={convWeightOz}
                    onChange={e => handleWeightOzChange(Number(e.target.value))}
                    className="w-full text-lg font-mono font-bold text-slate-900 bg-white border border-purple-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <span className="text-xs font-bold text-purple-700">Oz</span>
                </div>
              </div>

              {/* Gramos */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Gramos (g)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={convGrams}
                    onChange={e => handleGramsChange(Number(e.target.value))}
                    className="w-full text-lg font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <span className="text-xs font-bold text-slate-600">g</span>
                </div>
              </div>
            </div>

            {/* Rendimiento en porciones de topping */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-purple-500" />
                Rendimiento de {convKg} Kg ({convWeightOz} Oz / {convGrams}g):
              </span>
              <div className="flex items-center gap-4 font-mono font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                  🍬 Porción de 1.0 oz (28g): <strong className="text-purple-600">{Math.floor(convWeightOz / 1.0)} vasos</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                  🍬 Porción de 0.8 oz (23g): <strong className="text-purple-600">{Math.floor(convWeightOz / 0.8)} vasos</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MODO 3: CALCULADORA INVERSA POR VASOS */}
        {convMode === 'cups' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  ¿Cuántos vasos vas a preparar para la jornada?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tamaño del Vaso</span>
                    <select
                      value={targetCupSize}
                      onChange={e => setTargetCupSize(Number(e.target.value) as 12 | 16 | 24)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs"
                    >
                      <option value={12}>Pequeño (12 oz)</option>
                      <option value={16}>Mediano (16 oz)</option>
                      <option value={24}>Grande (24 oz)</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cantidad de Vasos</span>
                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={targetCupCount}
                      onChange={e => setTargetCupCount(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Resultado calculado */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-xs space-y-2">
                <span className="text-amber-900 font-bold block text-sm">
                  🎯 Insumos necesarios para {targetCupCount} vasos de {targetCupSize} oz:
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                    <span className="text-[10px] text-slate-400 block">Total Líquido Máquina</span>
                    <strong className="text-amber-700 text-base">{( (targetCupCount * targetCupSize) / 33.814 ).toFixed(1)} Litros</strong>
                    <span className="text-[10px] text-slate-500 block">({targetCupCount * targetCupSize} oz)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                    <span className="text-[10px] text-slate-400 block">Bolsas de Topping (1kg)</span>
                    <strong className="text-amber-700 text-base">{Math.ceil( (targetCupCount * 1.0) / 35.27 )} bolsas</strong>
                    <span className="text-[10px] text-slate-500 block">(@ 1 oz por vaso)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. TANDA Y CARGA DE LA MÁQUINA GRANIZADORA ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Receta de la Máquina Granizadora (Tanda Base)
              </h3>
              <p className="text-xs text-slate-400">
                Define la proporción de agua, pulpa y jarabe para cargar el tanque/tolva y calcula costos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBatchLoadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Registrar Carga a la Máquina</span>
          </button>
        </div>

        {/* Configuración de la Mezcla */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Agua / Hielo */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">1. Agua / Hielo</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={machineRecipe.waterLiters}
                onChange={e => setMachineRecipe(prev => ({ ...prev, waterLiters: Number(e.target.value) }))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-sm"
              />
              <span className="text-xs font-bold text-slate-600">Litros</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">{(machineRecipe.waterLiters * 33.814).toFixed(0)} oz</span>
          </div>

          {/* Pulpa de Fruta */}
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30">
            <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">2. Pulpa de Fruta</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={machineRecipe.pulpLiters}
                onChange={e => setMachineRecipe(prev => ({ ...prev, pulpLiters: Number(e.target.value) }))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white font-mono font-bold text-sm"
              />
              <span className="text-xs font-bold text-amber-800">Litros</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-amber-700 mt-1">
              <span>{(machineRecipe.pulpLiters * 33.814).toFixed(0)} oz</span>
              <span>Costo: ${machineRecipe.pulpCostPerLiter}/L</span>
            </div>
          </div>

          {/* Jarabe / Azúcar */}
          <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/30">
            <span className="text-[10px] font-bold text-orange-800 uppercase block mb-1">3. Jarabe / Azúcar</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.2"
                value={machineRecipe.syrupLiters}
                onChange={e => setMachineRecipe(prev => ({ ...prev, syrupLiters: Number(e.target.value) }))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-orange-300 bg-white font-mono font-bold text-sm"
              />
              <span className="text-xs font-bold text-orange-800">Litros</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-orange-700 mt-1">
              <span>{(machineRecipe.syrupLiters * 33.814).toFixed(0)} oz</span>
              <span>Costo: ${machineRecipe.syrupCostPerLiter}/L</span>
            </div>
          </div>

          {/* Total Tanda & Costo */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-800 block mb-0.5">Total Mezcla</span>
              <span className="text-lg font-black text-blue-900 font-mono block">
                {totalBatchLiters} L <span className="text-xs font-bold text-blue-700">({totalBatchFlOz.toFixed(0)} Oz)</span>
              </span>
            </div>
            <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-xs font-bold text-blue-900">
              <span>Costo Tanda:</span>
              <span className="font-mono text-emerald-700">{formatMoney(totalBatchCost, config.currencySymbol)}</span>
            </div>
          </div>
        </div>

        {/* Rendimiento y Costo por Vaso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Vaso Pequeño (12 oz)</span>
              <span className="text-xl font-black text-slate-900 font-mono">{yield12Oz} vasos</span>
              <span className="text-[11px] text-slate-400 block">Costo base: {formatMoney(12 * costPerFlOz, config.currencySymbol)}</span>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold font-mono">
              12 oz
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border-2 border-amber-300 bg-amber-50/30 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase block">Vaso Mediano (16 oz) ⭐</span>
              <span className="text-xl font-black text-amber-900 font-mono">{yield16Oz} vasos</span>
              <span className="text-[11px] text-amber-700 block">Costo base: {formatMoney(16 * costPerFlOz, config.currencySymbol)}</span>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white text-xs font-bold font-mono">
              16 oz
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Vaso Grande (24 oz)</span>
              <span className="text-xl font-black text-slate-900 font-mono">{yield24Oz} vasos</span>
              <span className="text-[11px] text-slate-400 block">Costo base: {formatMoney(24 * costPerFlOz, config.currencySymbol)}</span>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold font-mono">
              24 oz
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. ESCANDALLO DE TOPPINGS POR BOLSA / KILO / ONZA ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Toppings por Bolsas & Costo por Vaso
              </h3>
              <p className="text-xs text-slate-400">
                Rendimiento de cada bolsa en porciones servidas y control de compras ligado a Finanzas
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de Toppings */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div
                className="grid items-center gap-2.5 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider"
                style={{ gridTemplateColumns: '1.4fr 1.2fr 100px 90px 110px 100px 120px' }}
              >
                <span>Topping / Insumo</span>
                <span>Presentación de Compra</span>
                <span>Costo Bolsa</span>
                <span>Porción/Vaso</span>
                <span className="text-center">Rendimiento</span>
                <span className="text-center">Stock Bodega</span>
                <span className="text-right">Acción</span>
              </div>

              <div className="divide-y divide-slate-100 p-2 space-y-1.5">
                {toppingsRecipes.map(item => {
                  const bagOz = item.packageWeightGrams / 28.3495;
                  const portionsPerBag = item.portionOz > 0 ? Math.floor(bagOz / item.portionOz) : 0;
                  const costPerPortion = portionsPerBag > 0 ? item.packageCost / portionsPerBag : 0;
                  const isLow = item.bagsInStock <= item.minBagsAlert;

                  return (
                    <div
                      key={item.id}
                      className="grid items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all text-xs"
                      style={{ gridTemplateColumns: '1.4fr 1.2fr 100px 90px 110px 100px 120px' }}
                    >
                      {/* Nombre */}
                      <div>
                        <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.packageWeightGrams}g ({bagOz.toFixed(1)} oz)
                        </span>
                      </div>

                      {/* Presentación */}
                      <span className="text-slate-600 font-medium text-[11px] truncate">{item.packageType}</span>

                      {/* Costo Bolsa */}
                      <span className="font-mono font-bold text-slate-800">
                        {formatMoney(item.packageCost, config.currencySymbol)}
                      </span>

                      {/* Porción / Vaso */}
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-mono font-bold text-[11px] border border-amber-200">
                          {item.portionOz} oz
                        </span>
                      </div>

                      {/* Rendimiento */}
                      <div className="text-center">
                        <span className="font-black text-slate-900 block font-mono">{portionsPerBag} vasos</span>
                        <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                          ${costPerPortion.toFixed(0)}/vaso
                        </span>
                      </div>

                      {/* Stock Bodega */}
                      <div className="text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black border ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.bagsInStock} {item.bagsInStock === 1 ? 'bolsa' : 'bolsas'}
                        </span>
                      </div>

                      {/* Botón Comprar / Entrada */}
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenBag(item.id)}
                          title="Abrir 1 bolsa en barra"
                          disabled={item.bagsInStock <= 0}
                          className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold disabled:opacity-40 cursor-pointer"
                        >
                          Abrir
                        </button>
                        <button
                          type="button"
                          onClick={() => openBuyModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3 h-3" /> Comprar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: REGISTRAR COMPRA DE BOLSAS (LIGADO A FINANZAS) ─── */}
      {isBuyModalOpen && selectedTopping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                  Entrada de Insumos & Bodega
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Comprar Bolsas: {selectedTopping.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBuyModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPurchase} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500">Presentación:</span>
                <strong className="text-slate-800 block text-xs">{selectedTopping.packageType}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad de Bolsas:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={buyQuantity}
                    onChange={e => setBuyQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Costo por Bolsa ($):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={buyUnitCost}
                    onChange={e => setBuyUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm bg-white"
                  />
                </div>
              </div>

              {/* Total Compra */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800 block">Total a Pagar</span>
                  <span className="text-xs text-amber-700">{buyQuantity} bolsas @ ${buyUnitCost.toLocaleString('es-CO')}</span>
                </div>
                <strong className="text-base font-black text-amber-900 font-mono">
                  {formatMoney(buyQuantity * buyUnitCost, config.currencySymbol)}
                </strong>
              </div>

              {/* CHECKBOX VÍNCULO CON FINANZAS */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkToFinances}
                  onChange={e => setLinkToFinances(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-400 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-emerald-900 block text-xs leading-tight">
                    Registrar automáticamente en el Módulo de Finanzas & Caja
                  </span>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">
                    Se creará un egreso de ${ (buyQuantity * buyUnitCost).toLocaleString('es-CO') } en la categoría &quot;Insumos &amp; Frutas&quot;
                  </span>
                </div>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all"
                >
                  Confirmar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CARGAR MÁQUINA ─── */}
      {isBatchLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 block">
                  Producción en Barra
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Cargar Máquina Granizadora
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchLoadModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBatchLoad} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex justify-between items-center text-blue-900 font-bold">
                  <span>Volumen Total de Mezcla:</span>
                  <span className="font-mono text-sm">{totalBatchLiters} Litros ({totalBatchFlOz.toFixed(0)} oz)</span>
                </div>
                <div className="text-[11px] text-blue-700 space-y-0.5">
                  <p>• {machineRecipe.waterLiters}L Agua / Hielo</p>
                  <p>• {machineRecipe.pulpLiters}L Pulpa de fruta (${machineRecipe.pulpCostPerLiter}/L)</p>
                  <p>• {machineRecipe.syrupLiters}L Jarabe / Azúcar (${machineRecipe.syrupCostPerLiter}/L)</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Rendimiento estimado:</span>
                <strong className="text-slate-800 font-mono">~{yield16Oz} vasos de 16 oz</strong>
              </div>

              {/* Vínculo con Finanzas */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkBatchToFinances}
                  onChange={e => setLinkBatchToFinances(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-400 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs leading-tight">
                    Registrar costo de ingredientes (${totalBatchCost.toLocaleString('es-CO')}) en Finanzas
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Actívalo si los insumos de esta tanda se pagaron en efectivo hoy.
                  </span>
                </div>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchLoadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Confirmar Carga de Máquina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
