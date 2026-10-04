import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GranizadoProduct, CategoryType, Topping, Flavor } from '../../types';
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
  const [prodBasePrice, setProdBasePrice] = useState(8500);
  const [prodBaseCost, setProdBaseCost] = useState(2800);
  const [prodSmallPrice, setProdSmallPrice] = useState(6500);
  const [prodSmallCost, setProdSmallCost] = useState(2200);
  const [prodLargePrice, setProdLargePrice] = useState(11000);
  const [prodLargeCost, setProdLargeCost] = useState(3800);
  const [prodImage, setProdImage] = useState(PRESET_IMAGES[0].url);
  const [prodIsPopular, setProdIsPopular] = useState(false);
  const [prodIsAvailable, setProdIsAvailable] = useState(true);
  const [prodFlavorsStr, setProdFlavorsStr] = useState('Mango Biche, Limón');
  const [prodAllowedToppings, setProdAllowedToppings] = useState<string[]>([]);  // [] = all allowed
  const [prodToppingsRestricted, setProdToppingsRestricted] = useState(false); // if false = all toppings allowed
  const [prodPointsEarned, setProdPointsEarned] = useState<number>(85);
  const [prodPointsDiscountApplicable, setProdPointsDiscountApplicable] = useState(true);
  const [prodFormStep, setProdFormStep] = useState<1 | 2 | 3>(1);

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
    setProdBasePrice(8500);
    setProdBaseCost(2800);
    setProdSmallPrice(6500);
    setProdSmallCost(2200);
    setProdLargePrice(11000);
    setProdLargeCost(3800);
    setProdImage(PRESET_IMAGES[0].url);
    setProdIsPopular(false);
    setProdIsAvailable(true);
    setProdFlavorsStr('Mango Biche, Limón');
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
    setProdBasePrice(p.basePrice);
    setProdBaseCost(p.baseCost);
    setProdSmallPrice(p.sizePrices?.small?.price ?? Math.round(p.basePrice * 0.75));
    setProdSmallCost(p.sizePrices?.small?.cost ?? Math.round(p.baseCost * 0.8));
    setProdLargePrice(p.sizePrices?.large?.price ?? Math.round(p.basePrice * 1.3));
    setProdLargeCost(p.sizePrices?.large?.cost ?? Math.round(p.baseCost * 1.35));
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
    if (!prodName.trim()) return;

    const defaultFlavors = prodFlavorsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const productData = {
      name: prodName.trim(),
      category: prodCategory,
      description: prodDescription.trim(),
      basePrice: Number(prodBasePrice),
      baseCost: Number(prodBaseCost),
      sizePrices: {
        small: { price: Number(prodSmallPrice), cost: Number(prodSmallCost) },
        large: { price: Number(prodLargePrice), cost: Number(prodLargeCost) },
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
    : ['Frutales', 'Cítricos & Chamoy', 'Cremosos', 'Especiales'];

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
              Gestión de Productos
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              {products.length} productos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea y administra granizados, recetas, precios de venta, costos de insumos, sabores, toppings y puntos de fidelización.
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
                  title="Vista en Cuadrícula"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredProducts.map(p => {
                const marginAmount = p.basePrice - p.baseCost;
                const marginPercent = p.basePrice > 0 ? (marginAmount / p.basePrice) * 100 : 0;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-100 hover:border-amber-300 p-3.5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between group space-y-3"
                  >
                    <div>
                      {/* Product Image Header with Quick Badges */}
                      <div className="w-full h-36 rounded-xl overflow-hidden relative bg-slate-100">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-900 shadow-2xs">
                            {p.category}
                          </span>

                          {p.isPopular && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                              <Star className="w-3 h-3 fill-current" />
                              <span>Estrella</span>
                            </span>
                          )}
                        </div>

                        {/* Bottom Overlay Title & Availability */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between text-white">
                          <h4 className="text-xs font-bold font-display truncate leading-tight pr-2">
                            {p.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => toggleProductStock(p.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer shrink-0 transition-colors ${
                              p.isAvailable
                                ? 'bg-emerald-500/90 text-white'
                                : 'bg-rose-500/90 text-white'
                            }`}
                          >
                            {p.isAvailable ? 'En Stock' : 'Agotado'}
                          </button>
                        </div>
                      </div>

                      {/* Description & Flavors */}
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                        {p.description || 'Delicioso granizado artesanal preparado con hielo cristalino y pulpas naturales.'}
                      </p>

                      {p.defaultFlavors && p.defaultFlavors.length > 0 && (
                        <div className="text-[10px] text-slate-400 mt-1 truncate">
                          Sabores: <span className="text-slate-600 font-medium">{p.defaultFlavors.join(' · ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Economics Strip & Actions */}
                    <div className="pt-2.5 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2 rounded-xl text-center">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Venta</span>
                          <span className="font-mono text-xs font-black text-slate-900">
                            {formatMoney(p.basePrice, config.currencySymbol)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Costo</span>
                          <span className="font-mono text-xs font-medium text-slate-600">
                            {formatMoney(p.baseCost, config.currencySymbol)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-emerald-600 block">Margen</span>
                          <span className="font-mono text-xs font-bold text-emerald-600">
                            {marginPercent.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Buttons Edit & Delete */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-emerald-600 font-medium">
                          +{formatMoney(marginAmount, config.currencySymbol)} / vaso
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar producto"
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
                      <th className="py-2.5 px-4">Categoría</th>
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
                No hay productos que coincidan con la búsqueda o la categoría seleccionada.
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


      {/* MODAL: CREATE / EDIT PRODUCT - 3-STEP WIZARD */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(20px)' }}>
          <div className="bg-white w-full shadow-2xl overflow-hidden flex flex-col my-0 sm:my-4" style={{ maxWidth: '860px', maxHeight: '100dvh', borderRadius: '0 0 2rem 2rem', ['--sm-border-radius' as any]: '2rem' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }}>
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black font-display text-slate-900 tracking-tight">
                    {editingProductId ? 'Editar Granizado' : 'Crear Nuevo Granizado'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Paso {prodFormStep} de 3 &mdash; {prodFormStep === 1 ? 'Identidad & Foto' : prodFormStep === 2 ? 'Precios por Tamaño' : 'Toppings & Adiciones'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {([1, 2, 3] as const).map(s => (
                    <button key={s} type="button" onClick={() => setProdFormStep(s)}
                      className={`h-2 rounded-full transition-all duration-300 ${prodFormStep === s ? 'w-8 bg-amber-500' : 'w-2 bg-slate-200 hover:bg-slate-300'}`}
                    />
                  ))}
                </div>
                <button onClick={() => setIsProductModalOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 min-h-0">
              <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

                {/* Left: Live Image Preview + Upload */}
                <div className="lg:w-64 xl:w-72 shrink-0 bg-slate-900 flex flex-col overflow-hidden">
                  <div className="relative flex-1" style={{ minHeight: '200px' }}>
                    {prodImage ? (
                      <img src={prodImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" key={prodImage.substring(0, 30)} />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-xs text-slate-500 text-center px-4">Sin imagen todavía</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-black/10 to-transparent" />
                    {prodName && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{prodCategory}</span>
                        <h4 className="font-black text-white text-lg leading-tight mt-0.5">{prodName}</h4>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3 shrink-0">
                    <label className="flex items-center gap-2.5 p-3 rounded-2xl border-2 border-dashed border-white/20 hover:border-amber-400/60 cursor-pointer transition-colors group">
                      <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors shrink-0">
                        <ImageIcon className="w-4 h-4 text-white/60 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white/80 block">Subir desde dispositivo</span>
                        <span className="text-[10px] text-white/40">JPG, PNG, WEBP</span>
                      </div>
                      <input type="file" accept="image/*" className="sr-only" onChange={handleImageFileUpload} />
                    </label>
                    <div>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Fotos rápidas</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {PRESET_IMAGES.map(preset => (
                          <button key={preset.url} type="button" onClick={() => setProdImage(preset.url)}
                            className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${prodImage === preset.url ? 'border-amber-500 scale-105' : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'}`}
                          >
                            <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                            {prodImage === preset.url && <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Step content */}
                <div className="flex-1 overflow-y-auto p-7 space-y-5">

                  {/* STEP 1 */}
                  {prodFormStep === 1 && (
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre del Granizado *</label>
                        <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="ej. Granizado Especial Chamoy & Frutas" className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white text-base font-bold text-slate-800 focus:outline-none focus:border-amber-400 transition-colors" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría</label>
                          <select value={prodCategory} onChange={e => setProdCategory(e.target.value as CategoryType)} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white text-sm text-slate-700 font-semibold focus:outline-none focus:border-amber-400 transition-colors">
                            {dynamicCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            {!dynamicCategories.includes(prodCategory) && prodCategory !== '' && (
                              <option value={prodCategory}>{prodCategory}</option>
                            )}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sabores Base (separados por coma)</label>
                          <input type="text" value={prodFlavorsStr} onChange={e => setProdFlavorsStr(e.target.value)} placeholder="Mango Biche, Limón Criollo..." className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white text-sm text-slate-700 focus:outline-none focus:border-amber-400 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción del Producto</label>
                        <textarea rows={4} value={prodDescription} onChange={e => setProdDescription(e.target.value)} placeholder="¿Qué hace especial a este granizado? Describe sus ingredientes, sabores y la experiencia..." className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white text-sm text-slate-700 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${prodIsPopular ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                          <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${prodIsPopular ? 'bg-amber-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${prodIsPopular ? 'translate-x-6' : 'translate-x-1'}`} />
                            <input type="checkbox" checked={prodIsPopular} onChange={e => setProdIsPopular(e.target.checked)} className="sr-only" />
                          </div>
                          <div><span className="text-sm font-bold text-slate-800 block">⭐ Producto Estrella</span><span className="text-[10px] text-slate-400">Destacado en menú y POS</span></div>
                        </label>
                        <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${prodIsAvailable ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                          <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${prodIsAvailable ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${prodIsAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                            <input type="checkbox" checked={prodIsAvailable} onChange={e => setProdIsAvailable(e.target.checked)} className="sr-only" />
                          </div>
                          <div><span className="text-sm font-bold text-slate-800 block">🟢 Disponible en POS</span><span className="text-[10px] text-slate-400">Visible para el cajero</span></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Precios por tamaño */}
                  {prodFormStep === 2 && (
                    <div className="space-y-5">
                      <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-700 font-medium">
                        💡 Define precio de venta y costo de insumos por cada tamaño. El margen se calcula en tiempo real.
                      </div>
                      {([
                        { label: 'Pequeño', emoji: '🥤', sub: '12 oz', price: prodSmallPrice, cost: prodSmallCost, setPrice: setProdSmallPrice, setCost: setProdSmallCost },
                        { label: 'Mediano', emoji: '🧃', sub: '16 oz', price: prodBasePrice, cost: prodBaseCost, setPrice: setProdBasePrice, setCost: setProdBaseCost, isBase: true },
                        { label: 'Grande', emoji: '🍹', sub: '24 oz', price: prodLargePrice, cost: prodLargeCost, setPrice: setProdLargePrice, setCost: setProdLargeCost },
                      ]).map(sz => {
                        const margin = sz.price > 0 ? ((sz.price - sz.cost) / sz.price) * 100 : 0;
                        const mc = margin >= 60 ? 'text-emerald-600' : margin >= 40 ? 'text-amber-600' : 'text-rose-500';
                        const bc = margin >= 60 ? 'bg-emerald-50 border-emerald-200' : margin >= 40 ? 'bg-amber-50/60 border-amber-200' : 'bg-rose-50 border-rose-200';
                        return (
                          <div key={sz.label} className={`p-5 rounded-2xl border-2 space-y-3 ${sz.isBase ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{sz.emoji}</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-800">{sz.label}</span>
                                    {sz.isBase && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">BASE</span>}
                                  </div>
                                  <span className="text-[10px] text-slate-400">{sz.sub}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-2xl font-black font-mono ${mc}`}>{margin.toFixed(0)}%</span>
                                <p className="text-[10px] text-slate-400">margen bruto</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input type="number" required min="0" step="100" value={sz.price} onChange={e => sz.setPrice(Number(e.target.value))} className="w-full pl-8 pr-3 py-3 rounded-xl border-2 border-slate-100 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-400 transition-colors" />
                                <span className="absolute right-3 bottom-1.5 text-[9px] text-slate-400">Precio Venta</span>
                              </div>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input type="number" required min="0" step="100" value={sz.cost} onChange={e => sz.setCost(Number(e.target.value))} className="w-full pl-8 pr-3 py-3 rounded-xl border-2 border-slate-100 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-400 transition-colors" />
                                <span className="absolute right-3 bottom-1.5 text-[9px] text-slate-400">Costo Insumos</span>
                              </div>
                            </div>
                            <div className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${bc} border`}>
                              <span className="text-slate-600 font-medium">Ganancia neta por vaso:</span>
                              <span className={`font-black font-mono ${mc}`}>{formatMoney(sz.price - sz.cost, config.currencySymbol)}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 space-y-3">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">🏆 Puntos de Fidelización</p>
                        <div className="grid grid-cols-2 gap-4 items-center">
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-500 font-medium">Puntos que otorga al comprar</label>
                            <input type="number" min="0" value={prodPointsEarned} onChange={e => setProdPointsEarned(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border-2 border-white bg-white font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-400 transition-colors shadow-sm" />
                          </div>
                          <label className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${prodPointsDiscountApplicable ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-white'}`}>
                            <div className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${prodPointsDiscountApplicable ? 'bg-amber-500' : 'bg-slate-200'}`}>
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prodPointsDiscountApplicable ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              <input type="checkbox" checked={prodPointsDiscountApplicable} onChange={e => setProdPointsDiscountApplicable(e.target.checked)} className="sr-only" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">Aplica descuento de puntos</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Toppings & Adiciones */}
                  {prodFormStep === 3 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Toppings y Adiciones disponibles</label>
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                          <button type="button" onClick={() => { setProdToppingsRestricted(false); setProdAllowedToppings([]); }}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${!prodToppingsRestricted ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            ✅ Todos los toppings permitidos
                          </button>
                          <button type="button" onClick={() => setProdToppingsRestricted(true)}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${prodToppingsRestricted ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            🎯 Definir cuáles aplican
                          </button>
                        </div>
                      </div>

                      {!prodToppingsRestricted && (
                        <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-100 text-center space-y-1">
                          <p className="text-sm font-bold text-emerald-800">✅ Todos los toppings del catálogo disponibles</p>
                          <p className="text-xs text-emerald-600">El cajero podrá ofrecer cualquier topping activo al preparar este granizado.</p>
                        </div>
                      )}

                      {prodToppingsRestricted && (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-500 font-medium">Marca los toppings que aplican para <strong>{prodName || 'este granizado'}</strong>:</p>
                          {(['Salsas', 'Fruta picada', 'Gomitas & Dulces', 'Crocante & Lácteos'] as Topping['category'][]).map(cat => {
                            const catToppings = toppings.filter(t => t.category === cat);
                            if (!catToppings.length) return null;
                            return (
                              <div key={cat}>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <span className="h-px flex-1 bg-slate-100" />{cat}<span className="h-px flex-1 bg-slate-100" />
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {catToppings.map(t => {
                                    const active = prodAllowedToppings.includes(t.id);
                                    return (
                                      <button key={t.id} type="button"
                                        onClick={() => setProdAllowedToppings(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                                        className={`p-3 rounded-xl text-left text-xs transition-all border-2 ${active ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <span className={active ? 'font-bold text-amber-900' : 'font-medium text-slate-700'}>{t.name}</span>
                                          <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${active ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'}`}>
                                            {active && <Check className="w-2.5 h-2.5" />}
                                          </div>
                                        </div>
                                        <div className={`mt-1 font-mono text-[10px] ${active ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                                          +{formatMoney(t.price, config.currencySymbol)}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                          {prodAllowedToppings.length > 0 && (
                            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-700 font-medium">
                              ✅ {prodAllowedToppings.length} topping{prodAllowedToppings.length > 1 ? 's' : ''} seleccionado{prodAllowedToppings.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Footer */}
              <div className="px-7 py-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
                <div className="flex gap-2">
                  {prodFormStep > 1 && (
                    <button type="button" onClick={() => setProdFormStep(s => (s - 1) as 1 | 2 | 3)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm transition-colors">
                      ← Anterior
                    </button>
                  )}
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-400 text-sm hover:text-slate-600 transition-colors">
                    Cancelar
                  </button>
                </div>
                {prodFormStep < 3 ? (
                  <button type="button"
                    onClick={() => { if (!prodName.trim()) { alert('Ingresa el nombre del producto primero'); return; } setProdFormStep(s => (s + 1) as 1 | 2 | 3); }}
                    className="px-7 py-2.5 rounded-xl font-black text-white text-sm shadow-lg transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)', boxShadow: '0 6px 16px -4px rgba(245,158,11,0.45)' }}
                  >
                    Siguiente →
                  </button>
                ) : (
                  <button type="submit" className="px-7 py-2.5 rounded-xl font-black text-white text-sm shadow-lg transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 6px 16px -4px rgba(16,185,129,0.45)' }}
                  >
                    {editingProductId ? '💾 Guardar Cambios' : '✨ Crear Producto'}
                  </button>
                )}
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
                  placeholder="ej. Gomitas Ácidas"
                  value={toppingName}
                  onChange={e => setToppingName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                <select
                  value={toppingCategory}
                  onChange={e => setToppingCategory(e.target.value as Topping['category'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Salsas">Salsas</option>
                  <option value="Fruta picada">Fruta picada</option>
                  <option value="Gomitas & Dulces">Gomitas & Dulces</option>
                  <option value="Crocante & Lácteos">Crocante & Lácteos</option>
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
                  <label className="font-bold text-slate-700 block mb-1">Categoría</label>
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
