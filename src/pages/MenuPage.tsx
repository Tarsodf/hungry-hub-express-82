import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("categoria") || "Todos";
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const { addItem } = useCart();

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
        .select("*, menu_categories(name)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const categoryNames = ["Todos", ...categories.map((c) => c.name)];

  const filteredItems = activeCategory === "Todos"
    ? menuItems
    : menuItems.filter((i: any) => i.menu_categories?.name === activeCategory);

  const handleAddToCart = (item: any) => {
    addItem({ id: item.id, name: item.name, price: Number(item.price), image: item.image_url || "" });
    toast.success(`${item.name} adicionado ao carrinho!`);
  };

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl text-center">
          Cardápio
        </h1>

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
            Nenhum item encontrado nesta categoria. Adicione itens pelo painel administrativo.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item: any) => (
              <Card key={item.id} className="overflow-hidden border-border bg-card flex flex-col">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="h-48 w-full object-cover" loading="lazy" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-card-foreground">{item.name}</h3>
                    <span className="whitespace-nowrap font-body text-lg font-bold text-accent">
                      €{Number(item.price).toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 font-body text-sm text-muted-foreground">{item.description}</p>
                  <Button
                    size="sm"
                    className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleAddToCart(item)}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Adicionar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MenuPage;
