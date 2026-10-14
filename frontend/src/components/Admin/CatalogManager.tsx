import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GranizadoProduct, CategoryType, Topping, Flavor, ProductSize } from '../../types';

import { formatMoney } from '../../utils/format';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Sparkles,
  Package,
  Layers,
  Star,
  CheckCircle2,
  Percent,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
  Grid,
  List,
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Mango Chamoy Especial', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80' },
  { label: 'Fresa & Leche Condensada', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80' },
  { label: 'Maracuyá & Limón Biche', url: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80' },
  { label: 'Banner Tropical DobleE', url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&q=80' },
];

export const CatalogManager: React.FC = () => {
  const {
    products,
    flavors,
    toppings,
    config,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStock,
    addTopping,
    updateTopping,
    toggleToppingStock,
    addFlavor,
    toggleFlavorStock,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'products' | 'toppings' | 'flavors'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Product modal form state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<CategoryType>('Frutales');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImage, setProdImage] = useState(PRESET_IMAGES[0].url);
  const [prodIsPopular, setProdIsPopular] = useState(false);
  const [prodIsAvailable, setProdIsAvailable] = useState(true);
  const [prodFlavorsStr, setProdFlavorsStr] = useState('');
  const [prodAllowedToppings, setProdAllowedToppings] = useState<string[]>([]);
  const [prodToppingsRestricted, setProdToppingsRestricted] = useState(false);
  const [prodPointsEarned, setProdPointsEarned] = useState<number>(85);
  const [prodPointsDiscountApplicable, setProdPointsDiscountApplicable] = useState(true);
  const [prodFormStep, setProdFormStep] = useState<1 | 2 | 3>(1);

  // Custom sizes state (replaces hardcoded small/medium/large)
  const defaultSizes: ProductSize[] = [
    { id: 's1', label: 'Pequeño', oz: 12, price: 6500, cost: 2200 },
    { id: 's2', label: 'Mediano', oz: 16, price: 8500, cost: 2800 },
    { id: 's3', label: 'Grande', oz: 24, price: 11000, cost: 3800 },
  ];
  const [prodSizes, setProdSizes] = useState<ProductSize[]>(defaultSizes);


  // Derived base price = medium (first size marked as base, or second)
  const baseSize = prodSizes[1] ?? prodSizes[0];
  const prodBasePrice = baseSize?.price ?? 8500;
  const prodBaseCost = baseSize?.cost ?? 2800;


  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProdImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Topping modal form state
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);
  const [toppingName, setToppingName] = useState('');
  const [toppingCategory, setToppingCategory] = useState<Topping['category']>('Salsas');
  const [toppingPrice, setToppingPrice] = useState(1000);
  const [toppingCost, setToppingCost] = useState(300);

  // Flavor modal form state
  const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false);
  const [flavorName, setFlavorName] = useState('');
  const [flavorColor, setFlavorColor] = useState('#f59e0b');
  const [flavorCategory, setFlavorCategory] = useState<Flavor['category']>('Frutas');

  const openNewProduct = () => {
    setEditingProductId(null);
    setProdName('');
    setProdCategory('Frutales');
    setProdDescription('');
    setProdSizes([
      { id: 's1', label: 'PequeÃ±o', oz: 12, price: 6500, cost: 2200 },
      { id: 's2', label: 'Mediano', oz: 16, price: 8500, cost: 2800 },
      { id: 's3', label: 'Grande', oz: 24, price: 11000, cost: 3800 },
    ]);
    setProdImage(PRESET_IMAGES[0].url);
    setProdIsPopular(false);
    setProdIsAvailable(true);
    setProdFlavorsStr('');
    setProdAllowedToppings([]);
    setProdToppingsRestricted(false);
    setProdPointsEarned(85);
    setProdPointsDiscountApplicable(true);
    setProdFormStep(1);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p: GranizadoProduct) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdDescription(p.description);
    // Load customSizes if present, else build from legacy sizePrices
    if (p.customSizes && p.customSizes.length > 0) {
      setProdSizes(p.customSizes);
    } else {
      setProdSizes([
        { id: 's1', label: 'Pequeño', oz: 12, price: p.sizePrices?.small?.price ?? Math.round(p.basePrice * 0.75), cost: p.sizePrices?.small?.cost ?? Math.round(p.baseCost * 0.8) },
        { id: 's2', label: 'Mediano', oz: 16, price: p.basePrice, cost: p.baseCost },
        { id: 's3', label: 'Grande', oz: 24, price: p.sizePrices?.large?.price ?? Math.round(p.basePrice * 1.3), cost: p.sizePrices?.large?.cost ?? Math.round(p.baseCost * 1.35) },
      ]);
    }
    setProdImage(p.image || PRESET_IMAGES[0].url);
    setProdIsPopular(p.isPopular || false);
    setProdIsAvailable(p.isAvailable);
    setProdFlavorsStr(p.defaultFlavors.join(', '));
    const restricted = !!(p.allowedToppingIds && p.allowedToppingIds.length > 0);
    setProdToppingsRestricted(restricted);
    setProdAllowedToppings(p.allowedToppingIds || []);
    setProdPointsEarned(p.pointsEarned ?? Math.round(p.basePrice / 100));
    setProdPointsDiscountApplicable(p.pointsDiscountApplicable ?? true);
    setProdFormStep(1);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || prodSizes.length === 0) return;

    const defaultFlavors = prodFlavorsStr.split(',').map(s => s.trim()).filter(Boolean);
    const base = prodSizes[1] ?? prodSizes[0];

    const productData = {
      name: prodName.trim(),
      category: prodCategory,
      description: prodDescription.trim(),
      basePrice: base.price,
      baseCost: base.cost,
      customSizes: prodSizes,
      sizePrices: {
        small: { price: prodSizes[0]?.price ?? base.price, cost: prodSizes[0]?.cost ?? base.cost },
        large: { price: prodSizes[prodSizes.length - 1]?.price ?? base.price, cost: prodSizes[prodSizes.length - 1]?.cost ?? base.cost },
      },
      image: prodImage,
      isPopular: prodIsPopular,
      isAvailable: prodIsAvailable,
      defaultFlavors,
      allowedToppingIds: prodToppingsRestricted ? prodAllowedToppings : undefined,
      pointsEarned: Number(prodPointsEarned),
      pointsDiscountApplicable: prodPointsDiscountApplicable,
    };

    if (editingProductId) {
      updateProduct(editingProductId, productData);
    } else {
      addProduct(productData);
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`¿Eliminar producto "${name}" del menú de DobleE?`)) {
      deleteProduct(id);
    }
  };

  const handleSaveTopping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toppingName.trim()) return;

    addTopping({
      name: toppingName.trim(),
      category: toppingCategory,
      price: Number(toppingPrice),
      cost: Number(toppingCost),
      inStock: true,
    });

    setToppingName('');
    setIsToppingModalOpen(false);
  };

  const handleSaveFlavor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flavorName.trim()) return;

    addFlavor({
      name: flavorName.trim(),
      color: flavorColor,
      category: flavorCategory,
      inStock: true,
    });

    setFlavorName('');
    setIsFlavorModalOpen(false);
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const dynamicCategories = config.customCategories && config.customCategories.length > 0 
    ? config.customCategories 
    : ['Frutales', 'CÃ­tricos & Chamoy', 'Cremosos', 'Especiales'];

  const uniqueCategories = Array.from(new Set([...products.map(p => p.category), ...dynamicCategories]));

  // Calculate live margin in modal
  const modalMarginAmount = prodBasePrice - prodBaseCost;
  const modalMarginPercent = prodBasePrice > 0 ? (modalMarginAmount / prodBasePrice) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Top Header & Unmissable Action Bar (High-density UX) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
              GestiÃ³n de Productos
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              {products.length} productos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea y administra granizados, recetas, precios de venta, costos de insumos, sabores, toppings y puntos de fidelizaciÃ³n.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === 'products' && (
            <button
              onClick={openNewProduct}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Nuevo Producto</span>
            </button>
          )}

          {activeTab === 'toppings' && (
            <button
              onClick={() => setIsToppingModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Topping</span>
            </button>
          )}

          {activeTab === 'flavors' && (
            <button
              onClick={() => setIsFlavorModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Sabor</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher & Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Main Module Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Granizados ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('toppings')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'toppings'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Toppings & Salsas ({toppings.length})
            </button>
            <button
              onClick={() => setActiveTab('flavors')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'flavors'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sabores de Nieve ({flavors.length})
            </button>
          </div>

          {/* Right utilities: Search & Grid/Table toggle */}
          {activeTab === 'products' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar granizado..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Vista en CuadrÃ­cula"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Vista en Tabla"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Category Pills (Products tab only) */}
        {activeTab === 'products' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({products.length})
            </button>
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({products.filter(p => p.category === cat).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1. PRODUCTS TAB */}
      {activeTab === 'products' && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(p => {
                const marginAmount = p.basePrice - p.baseCost;
                const marginPercent = p.basePrice > 0 ? (marginAmount / p.basePrice) * 100 : 0;
                const sizes = p.customSizes ?? [
                  { label: 'Mediano', oz: 16, price: p.basePrice, cost: p.baseCost },
                ];

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-amber-200 shadow-xs hover:shadow-md transition-all group flex flex-col"
                  >
                    {/* Full image hero */}
                    <div className="relative w-full h-48 overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

                      {/* Category badge top-left */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-slate-900 shadow">
                          {p.category}
                        </span>
                        {p.isPopular && (
                          <span className="text-[10px] font-bold px-1.5 py-1 rounded-lg bg-amber-500 text-white flex items-center gap-0.5 shadow">
                            <Star className="w-2.5 h-2.5 fill-current" />
                          </span>
                        )}
                      </div>

                      {/* Name + stock bottom overlay */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                        <h4 className="text-sm font-black text-white leading-tight truncate pr-2">
                          {p.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => toggleProductStock(p.id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer shrink-0 transition-colors shadow ${
                            p.isAvailable ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {p.isAvailable ? 'En Stock' : 'Agotado'}
                        </button>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-3.5 flex flex-col flex-1 space-y-2.5">
                      {/* Description */}
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {p.description || 'Delicioso granizado artesanal preparado con hielo cristalino y pulpa 100% natural,...'}
                      </p>

                      {/* Flavors */}
                      {p.defaultFlavors && p.defaultFlavors.length > 0 && (
                        <div className="text-[10px] truncate">
                          <span className="text-slate-400">Sabores: </span>
                          <span className="text-slate-600 font-medium">{p.defaultFlavors.join(' Â· ')}</span>
                        </div>
                      )}

                      {/* VENTA / COSTO / MARGEN strip */}
                      <div className="grid grid-cols-3 gap-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                        <div className="py-2 text-center border-r border-slate-100">
                          <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wide">Venta</span>
                          <span className="font-mono text-[11px] font-black text-slate-900">{formatMoney(p.basePrice, config.currencySymbol)}</span>
                        </div>
                        <div className="py-2 text-center border-r border-slate-100">
                          <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wide">Costo</span>
                          <span className="font-mono text-[11px] font-medium text-slate-600">{formatMoney(p.baseCost, config.currencySymbol)}</span>
                        </div>
                        <div className="py-2 text-center">
                          <span className="text-[9px] uppercase font-black text-emerald-600 block tracking-wide">Margen</span>
                          <span className="font-mono text-[11px] font-black text-emerald-600">{marginPercent.toFixed(0)}%</span>
                        </div>
                      </div>

                      {/* Sizes chips (if custom) */}
                      {p.customSizes && p.customSizes.length > 1 && (
                        <div className="flex gap-1 flex-wrap">
                          {p.customSizes.map((sz, i) => (
                            <span key={sz.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${i === 1 || (p.customSizes!.length === 1 && i === 0) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                              {sz.label} {sz.oz}oz
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Profit + actions */}
                      <div className="flex items-center justify-between pt-1 mt-auto">
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          +{formatMoney(marginAmount, config.currencySymbol)} / vaso
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => openEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table Mode: High Density */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Producto</th>
                      <th className="py-2.5 px-4">CategorÃ­a</th>
                      <th className="py-2.5 px-4">Precio Venta</th>
                      <th className="py-2.5 px-4">Costo Base</th>
                      <th className="py-2.5 px-4">Utilidad Neta</th>
                      <th className="py-2.5 px-4">Margen %</th>
                      <th className="py-2.5 px-4">Estado</th>
                      <th className="py-2.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => {
                      const marginAmount = p.basePrice - p.baseCost;
                      const marginPercent = p.basePrice > 0 ? (marginAmount / p.basePrice) * 100 : 0;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-9 h-9 rounded-lg object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">{p.name}</span>
                                <span className="text-[10px] text-slate-400">{p.defaultFlavors.join(', ')}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-700">{p.category}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                            {formatMoney(p.basePrice, config.currencySymbol)}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">
                            {formatMoney(p.baseCost, config.currencySymbol)}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-emerald-600">
                            +{formatMoney(marginAmount, config.currencySymbol)}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">
                            {marginPercent.toFixed(0)}%
                          </td>
                          <td className="py-2.5 px-4">
                            <button
                              onClick={() => toggleProductStock(p.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                                p.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {p.isAvailable ? 'Disponible' : 'Agotado'}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditProduct(p)}
                                className="p-1 rounded text-slate-400 hover:text-amber-600"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No se encontraron productos</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No hay productos que coincidan con la bÃºsqueda o la categorÃ­a seleccionada.
              </p>
              <button
                onClick={openNewProduct}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Crear Primer Granizado</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* 2. TOPPINGS TAB */}
      {activeTab === 'toppings' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Toppings & Adiciones</h3>
              <p className="text-xs text-slate-400">Personalizaciones de salsas, frutas y dulces para las comandas.</p>
            </div>
            <button
              onClick={() => setIsToppingModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Topping</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {toppings.map(t => {
              const toppingMargin = t.price > 0 ? ((t.price - t.cost) / t.price) * 100 : 0;
              return (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-amber-300 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">{t.name}</span>
                    <span className="text-[10px] text-slate-400">{t.category}</span>
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      <span className="font-bold font-mono text-slate-900">{formatMoney(t.price, config.currencySymbol)}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{toppingMargin.toFixed(0)}% mg</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleToppingStock(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      t.inStock
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {t.inStock ? 'En Stock' : 'Agotado'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FLAVORS TAB */}
      {activeTab === 'flavors' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Sabores de Nieve Artesanal</h3>
              <p className="text-xs text-slate-400">Sabores de base para combinar en los vasos de 12oz, 16oz y 24oz.</p>
            </div>
            <button
              onClick={() => setIsFlavorModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Sabor</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {flavors.map(f => (
              <div
                key={f.id}
                className="bg-white rounded-xl border border-slate-100 p-3 shadow-2xs hover:border-amber-300 transition-all flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: f.color }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">{f.name}</span>
                    <span className="text-[10px] text-slate-400">{f.category}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleFlavorStock(f.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 cursor-pointer ${
                    f.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {f.inStock ? 'Activo' : 'Off'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* MODAL: CREATE / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setIsProductModalOpen(false); }}
        >
          <div
            className="bg-white h-full flex flex-col shadow-2xl"
            style={{ width: '100%', maxWidth: '480px', borderLeft: '1px solid #f1f5f9' }}
          >
            {/* ─── HEADER ─── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500 mb-0.5">
                  {editingProductId ? 'Editando' : 'Catálogo'}
                </p>
                <h2 className="text-lg font-black text-slate-900 leading-none">
                  {editingProductId ? 'Editar Producto' : 'Nuevo Granizado'}
                </h2>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>

                {/* ─── HERO IMAGE PREVIEW ─── */}
                <div className="relative overflow-hidden" style={{ height: '220px', background: '#0f172a' }}>
                  {prodImage
                    ? <img src={prodImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                    : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                          <ImageIcon className="w-7 h-7 text-white/40" />
                        </div>
                        <p className="text-white/30 text-xs font-medium">Sin imagen — elige abajo</p>
                      </div>
                    )
                  }
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.25) 100%)' }} />
                  {/* Category pill */}
                  <span className="absolute top-4 left-4 text-[11px] font-bold px-3 py-1 rounded-full bg-white text-slate-800 shadow-lg">
                    {prodCategory}
                  </span>
                  {/* Popular badge */}
                  {prodIsPopular && (
                    <span className="absolute top-4 right-4 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-lg">
                      <Star className="w-3 h-3 fill-current" /> Estrella
                    </span>
                  )}
                  {/* Name + stock */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <p className="text-white font-black text-xl leading-tight flex-1 truncate drop-shadow-lg">
                      {prodName || <span className="text-white/25 font-normal text-base italic">Nombre del producto</span>}
                    </p>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 shadow-lg ${prodIsAvailable ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {prodIsAvailable ? 'En Stock' : 'Agotado'}
                    </span>
                  </div>
                </div>

                {/* ─── IMAGE PICKER ─── */}
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
                  <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all group flex-shrink-0" style={{ border: '1.5px dashed #cbd5e1', background: 'white' }}>
                    <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors whitespace-nowrap">Subir foto</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleImageFileUpload} />
                  </label>
                  <div className="flex gap-2 flex-1 overflow-hidden">
                    {PRESET_IMAGES.map(preset => (
                      <button key={preset.url} type="button" onClick={() => setProdImage(preset.url)}
                        className={`relative rounded-xl overflow-hidden flex-shrink-0 transition-all ${prodImage === preset.url ? 'ring-2 ring-amber-500 ring-offset-1 scale-105' : 'opacity-60 hover:opacity-100'}`}
                        style={{ width: '44px', height: '44px' }}
                      >
                        <img src={preset.url} alt="" className="w-full h-full object-cover" />
                        {prodImage === preset.url && <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white drop-shadow" /></div>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-6 space-y-7">

                  {/* ─── INFORMACIÓN ─── */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Información</p>

                    <input
                      type="text" required
                      value={prodName} onChange={e => setProdName(e.target.value)}
                      placeholder="Nombre del granizado *"
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none transition-all"
                      style={{ border: '1.5px solid #e2e8f0', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <select value={prodCategory} onChange={e => setProdCategory(e.target.value as CategoryType)}
                        className="px-4 py-3 rounded-2xl text-sm text-slate-700 font-medium focus:outline-none transition-all"
                        style={{ border: '1.5px solid #e2e8f0', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        {dynamicCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        {!dynamicCategories.includes(prodCategory) && prodCategory && <option value={prodCategory}>{prodCategory}</option>}
                      </select>
                      <input type="text" value={prodFlavorsStr} onChange={e => setProdFlavorsStr(e.target.value)}
                        placeholder="Sabores (por coma)"
                        className="px-4 py-3 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all"
                        style={{ border: '1.5px solid #e2e8f0', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                      />
                    </div>

                    <textarea rows={2} value={prodDescription} onChange={e => setProdDescription(e.target.value)}
                      placeholder="Descripción breve del granizado..."
                      className="w-full px-4 py-3 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all resize-none"
                      style={{ border: '1.5px solid #e2e8f0', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      {/* Estrella toggle */}
                      <label className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all select-none ${prodIsPopular ? 'bg-amber-50' : 'bg-white hover:bg-slate-50'}`}
                        style={{ border: `1.5px solid ${prodIsPopular ? '#fcd34d' : '#e2e8f0'}` }}>
                        <div className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${prodIsPopular ? 'bg-amber-400' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${prodIsPopular ? 'translate-x-5' : 'translate-x-1'}`} />
                          <input type="checkbox" checked={prodIsPopular} onChange={e => setProdIsPopular(e.target.checked)} className="sr-only" />
                        </div>
                        <span className={`text-xs font-semibold ${prodIsPopular ? 'text-amber-800' : 'text-slate-600'}`}>⭐ Estrella</span>
                      </label>
                      {/* Disponible toggle */}
                      <label className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all select-none ${prodIsAvailable ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'}`}
                        style={{ border: `1.5px solid ${prodIsAvailable ? '#6ee7b7' : '#e2e8f0'}` }}>
                        <div className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${prodIsAvailable ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${prodIsAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
                          <input type="checkbox" checked={prodIsAvailable} onChange={e => setProdIsAvailable(e.target.checked)} className="sr-only" />
                        </div>
                        <span className={`text-xs font-semibold ${prodIsAvailable ? 'text-emerald-800' : 'text-slate-600'}`}>🟢 Disponible</span>
                      </label>
                    </div>
                  </div>

                  {/* ─── TAMAÑOS ─── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Tamaños del vaso</p>
                      <button type="button"
                        onClick={() => setProdSizes(prev => [...prev, { id: `s${Date.now()}`, label: 'Nuevo', oz: 16, price: 8000, cost: 2500 }])}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </button>
                    </div>

                    {/* Column headers */}
                    <div className="grid px-3 text-[10px] font-black uppercase text-slate-400 tracking-wide" style={{ gridTemplateColumns: '1fr 52px 76px 76px 52px' }}>
                      <span>Nombre</span>
                      <span className="text-center">Oz</span>
                      <span className="text-center">Venta</span>
                      <span className="text-center">Costo</span>
                      <span className="text-center">Mg</span>
                    </div>

                    <div className="space-y-2">
                      {prodSizes.map((sz, idx) => {
                        const margin = sz.price > 0 ? ((sz.price - sz.cost) / sz.price) * 100 : 0;
                        const isBase = idx === 1 || (prodSizes.length === 1 && idx === 0);
                        const mgColor = margin >= 60 ? '#10b981' : margin >= 40 ? '#f59e0b' : '#ef4444';
                        return (
                          <div key={sz.id}
                            className="grid items-center gap-1.5 px-3 py-2.5 rounded-2xl transition-all"
                            style={{
                              gridTemplateColumns: '1fr 52px 76px 76px 52px',
                              border: isBase ? '1.5px solid #fcd34d' : '1.5px solid #f1f5f9',
                              background: isBase ? '#fffbeb' : 'white',
                              boxShadow: isBase ? '0 2px 8px rgba(245,158,11,0.1)' : '0 1px 3px rgba(0,0,0,0.03)',
                            }}
                          >
                            <input type="text" value={sz.label}
                              onChange={e => setProdSizes(prev => prev.map((s, i) => i === idx ? { ...s, label: e.target.value } : s))}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none w-full"
                              style={{ border: '1px solid #e2e8f0', background: 'white' }}
                            />
                            <input type="number" min={4} value={sz.oz}
                              onChange={e => setProdSizes(prev => prev.map((s, i) => i === idx ? { ...s, oz: Number(e.target.value) } : s))}
                              className="px-1 py-1.5 rounded-xl text-xs font-mono font-bold text-center focus:outline-none w-full"
                              style={{ border: '1px solid #e2e8f0', background: 'white' }}
                            />
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">$</span>
                              <input type="number" min={0} step={100} value={sz.price}
                                onChange={e => setProdSizes(prev => prev.map((s, i) => i === idx ? { ...s, price: Number(e.target.value) } : s))}
                                className="pl-4 pr-1 py-1.5 rounded-xl text-xs font-mono font-bold focus:outline-none w-full"
                                style={{ border: '1px solid #e2e8f0', background: 'white' }}
                              />
                            </div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">$</span>
                              <input type="number" min={0} step={100} value={sz.cost}
                                onChange={e => setProdSizes(prev => prev.map((s, i) => i === idx ? { ...s, cost: Number(e.target.value) } : s))}
                                className="pl-4 pr-1 py-1.5 rounded-xl text-xs font-mono font-bold focus:outline-none w-full"
                                style={{ border: '1px solid #e2e8f0', background: 'white' }}
                              />
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-black" style={{ color: mgColor }}>{margin.toFixed(0)}%</span>
                              {prodSizes.length > 1 && (
                                <button type="button" onClick={() => setProdSizes(prev => prev.filter((_, i) => i !== idx))} className="block mx-auto mt-0.5 text-slate-300 hover:text-rose-400 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── FIDELIZACION ─── */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Fidelización</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Puntos al comprar</label>
                        <input type="number" min={0} value={prodPointsEarned} onChange={e => setProdPointsEarned(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:outline-none transition-all"
                          style={{ border: '1.5px solid #e2e8f0', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} />
                      </div>
                      <label className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all ${prodPointsDiscountApplicable ? 'bg-amber-50' : 'bg-white'}`}
                        style={{ border: `1.5px solid ${prodPointsDiscountApplicable ? '#fcd34d' : '#e2e8f0'}` }}>
                        <div className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${prodPointsDiscountApplicable ? 'bg-amber-400' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${prodPointsDiscountApplicable ? 'translate-x-5' : 'translate-x-1'}`} />
                          <input type="checkbox" checked={prodPointsDiscountApplicable} onChange={e => setProdPointsDiscountApplicable(e.target.checked)} className="sr-only" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 leading-tight">Aplica desc. puntos</span>
                      </label>
                    </div>
                  </div>

                  {/* ─── TOPPINGS ─── */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Toppings</p>
                    <div className="flex gap-2 p-1.5 rounded-2xl" style={{ background: '#f1f5f9' }}>
                      <button type="button" onClick={() => { setProdToppingsRestricted(false); setProdAllowedToppings([]); }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!prodToppingsRestricted ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Todos los toppings
                      </button>
                      <button type="button" onClick={() => setProdToppingsRestricted(true)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${prodToppingsRestricted ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Personalizado
                      </button>
                    </div>
                    {prodToppingsRestricted && (
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-0.5">
                        {toppings.map(t => {
                          const active = prodAllowedToppings.includes(t.id);
                          return (
                            <button key={t.id} type="button"
                              onClick={() => setProdAllowedToppings(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                              className={`p-3 rounded-2xl text-left text-xs transition-all ${active ? 'bg-amber-50' : 'bg-white hover:bg-slate-50'}`}
                              style={{ border: `1.5px solid ${active ? '#fcd34d' : '#e2e8f0'}` }}>
                              <div className="flex items-center justify-between gap-1">
                                <span className={`font-semibold truncate ${active ? 'text-amber-900' : 'text-slate-700'}`}>{t.name}</span>
                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${active ? 'bg-amber-400 border-amber-400' : 'border-slate-300'}`}>
                                  {active && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* ─── FOOTER ─── */}
              <div className="px-6 py-4 flex items-center justify-between gap-3 shrink-0" style={{ borderTop: '1px solid #f1f5f9', background: 'white' }}>
                <button type="button" onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-8 py-3 rounded-2xl font-black text-white text-sm transition-all active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg,#f59e0b 0%,#ea580c 100%)', boxShadow: '0 8px 24px -6px rgba(245,158,11,0.55)' }}>
                  {editingProductId ? '💾 Guardar Cambios' : '✨ Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: NEW TOPPING */}
      {isToppingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold font-display text-slate-900">Nuevo Topping o Salsa</h3>
              <button onClick={() => setIsToppingModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopping} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Gomitas Ãcidas"
                  value={toppingName}
                  onChange={e => setToppingName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">CategorÃ­a</label>
                <select
                  value={toppingCategory}
                  onChange={e => setToppingCategory(e.target.value as Topping['category'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Salsas">Salsas</option>
                  <option value="Fruta picada">Fruta picada</option>
                  <option value="Gomitas & Dulces">Gomitas & Dulces</option>
                  <option value="Crocante & LÃ¡cteos">Crocante & LÃ¡cteos</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    required
                    value={toppingPrice}
                    onChange={e => setToppingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Costo ($)</label>
                  <input
                    type="number"
                    required
                    value={toppingCost}
                    onChange={e => setToppingCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsToppingModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-white font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW FLAVOR */}
      {isFlavorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold font-display text-slate-900">Nuevo Sabor de Nieve</h3>
              <button onClick={() => setIsFlavorModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFlavor} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre del Sabor</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Kiwi Tropical"
                  value={flavorName}
                  onChange={e => setFlavorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CategorÃ­a</label>
                  <select
                    value={flavorCategory}
                    onChange={e => setFlavorCategory(e.target.value as Flavor['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Frutas">Frutas</option>
                    <option value="Cremosos">Cremosos</option>
                    <option value="Especiales">Especiales</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color representativo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={flavorColor}
                      onChange={e => setFlavorColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <span className="font-mono text-xs">{flavorColor}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFlavorModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-white font-bold"
                >
                  Guardar Sabor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
