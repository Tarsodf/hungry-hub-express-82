import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart, CartItemAddon } from "@/contexts/CartContext";
import { Plus, Lock, Check, Star } from "lucide-react";
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

  const today = new Date().getDay(); // 0=Sun

  const { data: categories = [] } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .order("sort_order");
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
      const { data, error } = await supabase
        .from("menu_addons")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const categoryNames = ["Todos", ...categories.map((c: any) => `${c.emoji || ""} ${c.name}`.trim())];
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c: any) => {
      map[`${c.emoji || ""} ${c.name}`.trim()] = c.name;
    });
    return map;
  }, [categories]);

  const filteredItems = useMemo(() => {
    const catName = categoryMap[activeCategory] || (activeCategory === "Todos" ? null : activeCategory);
    const items = catName
      ? menuItems.filter((i: any) => i.menu_categories?.name === catName)
      : menuItems;
    return items;
  }, [activeCategory, menuItems, categoryMap]);

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
  };

  const handleAddToCart = () => {
    if (!customizeItem) return;
    addItem({
      id: customizeItem.id,
      name: customizeItem.name,
      price: Number(customizeItem.price),
      image: customizeItem.image_url || "",
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
    if (itemAddons.length > 0 || hasIngredients) {
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

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl text-center">
          Cardápio
        </h1>
        <p className="text-center text-muted-foreground font-body mt-2">
          Hoje é <span className="font-semibold text-accent">{DAY_NAMES[today]}</span>
        </p>

        {/* Category tabs */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {categoryNames.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              }
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Menu items grid */}
        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </Card>
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
                <Card
                  key={item.id}
                  className={`overflow-hidden border-border bg-card flex flex-col transition-opacity ${
                    !available ? "opacity-50" : ""
                  } ${exec && available ? "ring-2 ring-accent" : ""}`}
                >
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="h-48 w-full object-cover" loading="lazy" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-semibold text-card-foreground">{item.name}</h3>
                        {exec && (
                          <Badge variant={available ? "default" : "secondary"} className="mt-1 text-xs">
                            {available ? (
                              <><Star className="h-3 w-3 mr-1" /> Prato do dia</>
                            ) : (
                              <><Lock className="h-3 w-3 mr-1" /> {DAY_NAMES[item.day_of_week]}</>
                            )}
                          </Badge>
                        )}
                      </div>
                      <span className="whitespace-nowrap font-body text-lg font-bold text-accent">
                        €{Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-2 flex-1 font-body text-sm text-muted-foreground">{item.description}</p>
                    {item.ingredients && item.ingredients.length > 0 && (
                      <p className="mt-1 font-body text-xs text-muted-foreground">
                        {item.ingredients.join(" · ")}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Customization dialog */}
      <Dialog open={!!customizeItem} onOpenChange={(open) => !open && setCustomizeItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{customizeItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Remove ingredients */}
            {customizeItem?.ingredients && customizeItem.ingredients.length > 0 && (
              <div>
                <Label className="font-body font-semibold text-sm">Remover ingredientes</Label>
                <div className="mt-2 space-y-2">
                  {customizeItem.ingredients.map((ing: string) => (
                    <label key={ing} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={removedIngredients.includes(ing)}
                        onCheckedChange={(checked) => {
                          setRemovedIngredients((prev) =>
                            checked ? [...prev, ing] : prev.filter((r) => r !== ing)
                          );
                        }}
                      />
                      <span className="font-body text-sm text-foreground">{ing}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Meat point for executivos & hamburgers */}
            {customizeItem && (isExecutivo(customizeItem) || customizeItem.menu_categories?.name === "Hambúrgueres") && (
              <div>
                <Label className="font-body font-semibold text-sm">Ponto da carne</Label>
                <RadioGroup value={meatPoint} onValueChange={setMeatPoint} className="mt-2 space-y-1">
                  {["Mal passado", "Ao ponto", "Bem passado"].map((point) => (
                    <div key={point} className="flex items-center gap-2">
                      <RadioGroupItem value={point} id={`meat-${point}`} />
                      <Label htmlFor={`meat-${point}`} className="font-body text-sm">{point}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Add-ons */}
            {customizeItem && getItemAddons(customizeItem).length > 0 && (
              <div>
                <Label className="font-body font-semibold text-sm">Adicionais</Label>
                <div className="mt-2 space-y-2">
                  {getItemAddons(customizeItem).map((addon: any) => (
                    <label key={addon.id} className="flex items-center justify-between gap-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={!!selectedAddons.find((a) => a.name === addon.name)}
                          onCheckedChange={() => toggleAddon(addon)}
                        />
                        <span className="font-body text-sm text-foreground">{addon.name}</span>
                      </div>
                      <span className="font-body text-sm text-accent font-semibold">+€{Number(addon.price).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="w-full flex items-center justify-between">
              <span className="font-body font-bold text-foreground">
                €{((customizeItem ? Number(customizeItem.price) : 0) + customizeAddonsTotal).toFixed(2)}
              </span>
              <Button onClick={handleAddToCart} className="bg-primary text-primary-foreground">
                <Check className="mr-1 h-4 w-4" /> Adicionar ao Carrinho
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default MenuPage;
