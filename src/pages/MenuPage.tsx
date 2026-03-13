import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart, CartItemAddon } from "@/contexts/CartContext";
import { Plus, Lock, Check, Star, Minus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("categoria") || "Todos";
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const { addItem } = useCart();

  // Customization dialog state
  const [customizeItem, setCustomizeItem] = useState<any>(null);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<CartItemAddon[]>([]);
  const [meatPoint, setMeatPoint] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [itemQty, setItemQty] = useState(1);

  const today = new Date().getDay();

  const { data: categories = [] } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, menu_categories(name, id)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: addons = [] } = useQuery({
    queryKey: ["menu-addons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_addons").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const filteredItems = useMemo(() => {
    if (activeCategory === "Todos") return menuItems;
    return menuItems.filter((i: any) => i.menu_categories?.name === activeCategory);
  }, [activeCategory, menuItems]);

  const getItemAddons = (item: any) => {
    const catId = item.category_id || item.menu_categories?.id;
    return addons.filter((a: any) => a.category_id === catId);
  };

  const isExecutivo = (item: any) => item.day_of_week !== null && item.day_of_week !== undefined;
  const isAvailableToday = (item: any) => !isExecutivo(item) || item.day_of_week === today;

  const openCustomize = (item: any) => {
    setCustomizeItem(item);
    setRemovedIngredients([]);
    setSelectedAddons([]);
    setMeatPoint("");
    setItemNotes("");
    setItemQty(1);
  };

  const handleAddToCart = () => {
    if (!customizeItem) return;
    addItem({
      id: customizeItem.id,
      name: customizeItem.name,
      price: Number(customizeItem.price),
      image: customizeItem.image_url || "",
      quantity: itemQty,
      notes: itemNotes || undefined,
      customization: {
        removed: removedIngredients,
        addons: selectedAddons,
        meatPoint: meatPoint || undefined,
      },
    });
    toast.success(`${customizeItem.name} adicionado ao carrinho!`);
    setCustomizeItem(null);
  };

  const handleQuickAdd = (item: any) => {
    const itemAddons = getItemAddons(item);
    const hasIngredients = item.ingredients && item.ingredients.length > 0;
    const needsMeatPoint = isExecutivo(item) || item.menu_categories?.name === "Hambúrgueres";
    if (itemAddons.length > 0 || hasIngredients || needsMeatPoint) {
      openCustomize(item);
    } else {
      addItem({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image: item.image_url || "",
        customization: { removed: [], addons: [] },
      });
      toast.success(`${item.name} adicionado ao carrinho!`);
    }
  };

  const toggleAddon = (addon: any) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.name === addon.name);
      if (exists) return prev.filter((a) => a.name !== addon.name);
      return [...prev, { name: addon.name, price: Number(addon.price) }];
    });
  };

  const customizeAddonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const categoryNames = ["Todos", ...categories.map((c: any) => c.name)];

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Cardápio</h1>
          <p className="text-muted-foreground font-body mt-2">
            🔥 Hoje é <span className="font-semibold text-primary">{DAY_NAMES[today]}</span> — 
            Os Pratos Executivos mudam diariamente!
          </p>
        </div>

        {/* Category tabs */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full font-body text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu items grid */}
        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-5 space-y-3">
                <Skeleton className="h-40 w-full rounded-lg bg-secondary" />
                <Skeleton className="h-6 w-3/4 bg-secondary" />
                <Skeleton className="h-4 w-full bg-secondary" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground font-body">
            Nenhum item encontrado nesta categoria.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item: any) => {
              const available = isAvailableToday(item);
              const exec = isExecutivo(item);
              return (
                <div
                  key={item.id}
                  className={`menu-card glass rounded-xl overflow-hidden flex flex-col ${
                    !available ? "disabled-day" : ""
                  } ${exec && available ? "ring-1 ring-primary/50" : ""}`}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-48 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-48 w-full bg-secondary flex items-center justify-center text-4xl">
                      {exec ? "🍽️" : "🍴"}
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-semibold text-foreground">{item.name}</h3>
                        {exec && (
                          <Badge className={`mt-1 text-xs ${available ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary text-muted-foreground"}`}>
                            {available ? (
                              <><Star className="h-3 w-3 mr-1" /> Prato do dia</>
                            ) : (
                              <><Lock className="h-3 w-3 mr-1" /> {DAY_NAMES[item.day_of_week]}</>
                            )}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-body text-lg font-bold text-primary">
                          €{Number(item.price).toFixed(2)}
                        </span>
                        <p className="text-[10px] text-muted-foreground">+ €0.90 taxa</p>
                      </div>
                    </div>
                    {item.description && (
                      <p className="mt-2 flex-1 font-body text-sm text-muted-foreground">{item.description}</p>
                    )}
                    {item.ingredients && item.ingredients.length > 0 && (
                      <p className="mt-1 font-body text-xs text-muted-foreground/70">
                        {item.ingredients.join(" · ")}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 font-body"
                      onClick={() => handleQuickAdd(item)}
                      disabled={!available}
                    >
                      {available ? (
                        <><Plus className="mr-1 h-4 w-4" /> Adicionar</>
                      ) : (
                        <><Lock className="mr-1 h-4 w-4" /> Disponível {DAY_NAMES[item.day_of_week]}</>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customization dialog */}
      <Dialog open={!!customizeItem} onOpenChange={(open) => !open && setCustomizeItem(null)}>
        <DialogContent className="max-w-md glass border-border bg-card">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-xl">{customizeItem?.name}</DialogTitle>
              <span className="font-body text-lg font-bold text-primary">
                €{Number(customizeItem?.price || 0).toFixed(2)}
                <span className="text-xs text-muted-foreground ml-1">+ €0.90 taxa</span>
              </span>
            </div>
          </DialogHeader>
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Meat point */}
            {customizeItem && (isExecutivo(customizeItem) || customizeItem.menu_categories?.name === "Hambúrgueres") && (
              <div className="glass rounded-lg p-4">
                <Label className="font-body font-semibold text-sm text-foreground flex items-center gap-2">
                  🥩 Ponto da Carne
                </Label>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { value: "Mal passado", label: "Mal Passado", desc: "Suculenta" },
                    { value: "Ao ponto", label: "Ao Ponto", desc: "Equilibrado" },
                    { value: "Bem passado", label: "Bem Passado", desc: "Totalmente cozida" },
                  ].map((point) => (
                    <button
                      key={point.value}
                      onClick={() => setMeatPoint(point.value)}
                      className={`rounded-lg p-3 text-center transition-all ${
                        meatPoint === point.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <p className="font-body text-xs font-semibold">{point.label}</p>
                      <p className="font-body text-[10px] mt-0.5 opacity-70">{point.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Remove ingredients */}
            {customizeItem?.ingredients && customizeItem.ingredients.length > 0 && (
              <div className="glass rounded-lg p-4">
                <Label className="font-body font-semibold text-sm text-foreground flex items-center gap-2">
                  ❌ Remover Ingredientes
                </Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {customizeItem.ingredients.map((ing: string) => (
                    <button
                      key={ing}
                      onClick={() => setRemovedIngredients((prev) =>
                        prev.includes(ing) ? prev.filter((r) => r !== ing) : [...prev, ing]
                      )}
                      className={`rounded-full px-3 py-1.5 font-body text-xs transition-all ${
                        removedIngredients.includes(ing)
                          ? "bg-destructive/20 text-destructive line-through"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {ing}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {customizeItem && getItemAddons(customizeItem).length > 0 && (
              <div className="glass rounded-lg p-4">
                <Label className="font-body font-semibold text-sm text-foreground flex items-center gap-2">
                  ➕ Adicionais
                </Label>
                <div className="mt-3 space-y-2">
                  {getItemAddons(customizeItem).map((addon: any) => (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 font-body text-sm transition-all ${
                        selectedAddons.find((a) => a.name === addon.name)
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{addon.name}</span>
                      <span className="font-semibold text-primary">+€{Number(addon.price).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="glass rounded-lg p-4">
              <Label className="font-body font-semibold text-sm text-foreground">📝 Observações</Label>
              <Textarea
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Ex: sem cebola, mais molho..."
                className="mt-2 bg-secondary border-border text-foreground"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setItemQty(Math.max(1, itemQty - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-body font-bold text-foreground w-6 text-center">{itemQty}</span>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setItemQty(itemQty + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleAddToCart} className="bg-primary text-primary-foreground font-body font-semibold px-6">
                Adicionar — €{(((customizeItem ? Number(customizeItem.price) : 0) + customizeAddonsTotal) * itemQty).toFixed(2)}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default MenuPage;
