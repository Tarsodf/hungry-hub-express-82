import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, Package, LayoutDashboard, History, UtensilsCrossed, TrendingUp, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "menu" | "orders" | "history">("dashboard");

  // Auth is now handled by ProtectedRoute wrapper in App.tsx

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "menu" as const, label: "Cardápio", icon: UtensilsCrossed },
    { id: "orders" as const, label: "Pedidos", icon: Package },
    { id: "history" as const, label: "Histórico", icon: History },
  ];

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg">🔥</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Admin</h1>
              <p className="font-body text-xs text-muted-foreground">Guimarães</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-muted-foreground border-border">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "menu" && <MenuManagement />}
        {activeTab === "orders" && <OrderManagement />}
        {activeTab === "history" && <HistoryView />}
      </div>
    </main>
  );
};

// ---- Dashboard View ----
const DashboardView = () => {
  const { data: items = [] } = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: todayOrders = [] } = useQuery({
    queryKey: ["admin-today-orders"],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, menu_items(category_id, menu_categories(name)))")
        .gte("created_at", startOfDay.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const revenue = todayOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
    const avgTicket = todayOrders.length > 0 ? revenue / todayOrders.length : 0;
    return {
      totalItems: items.length,
      ordersToday: todayOrders.length,
      revenue,
      avgTicket,
    };
  }, [items, todayOrders]);

  // Sales by category
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    todayOrders.forEach((o: any) => {
      o.order_items?.forEach((oi: any) => {
        const catName = oi.menu_items?.menu_categories?.name || "Outros";
        map[catName] = (map[catName] || 0) + (Number(oi.price) * oi.quantity);
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [todayOrders]);

  // Top items
  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    todayOrders.forEach((o: any) => {
      o.order_items?.forEach((oi: any) => {
        const key = oi.name;
        if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0 };
        map[key].qty += oi.quantity;
        map[key].revenue += Number(oi.price) * oi.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [todayOrders]);

  const maxCatRevenue = categoryStats.length > 0 ? categoryStats[0][1] : 1;

  const statCards = [
    { label: "Total de Pratos", value: stats.totalItems.toString(), sub: "Itens no cardápio", icon: UtensilsCrossed, color: "text-blue-400" },
    { label: "Pedidos Hoje", value: stats.ordersToday.toString(), sub: "Desde 00:00", icon: ShoppingCart, color: "text-green-400" },
    { label: "Faturamento Hoje", value: `€${stats.revenue.toFixed(2)}`, sub: "Total arrecadado", icon: DollarSign, color: "text-primary" },
    { label: "Ticket Médio", value: `€${stats.avgTicket.toFixed(2)}`, sub: "Por pedido", icon: TrendingUp, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Dashboard</h2>
        <p className="font-body text-xs text-muted-foreground">Guimarães, Portugal</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-body text-xs text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales by category */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-body text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" /> Vendas por Categoria (Hoje)
          </h3>
          {categoryStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda hoje</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map(([cat, revenue]) => (
                <div key={cat}>
                  <div className="flex justify-between font-body text-xs mb-1">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="text-foreground font-semibold">€{revenue.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${(revenue / maxCatRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top items */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-body text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            🏆 Pratos Mais Vendidos
          </h3>
          {topItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda hoje</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className={`font-body text-sm font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground truncate">{item.name}</p>
                    <p className="font-body text-xs text-muted-foreground">{item.qty}x vendidos</p>
                  </div>
                  <span className="font-body text-sm font-semibold text-primary">€{item.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-body text-sm font-semibold text-foreground mb-4">Pedidos Recentes</h3>
        {todayOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido hoje</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Cliente</th>
                  <th className="text-left py-2">Itens</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-right py-2">Hora</th>
                  <th className="text-right py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayOrders.slice(0, 10).map((order: any) => (
                  <tr key={order.id} className="border-b border-border/50">
                    <td className="py-2 text-muted-foreground">#{order.id.slice(0, 6)}</td>
                    <td className="py-2 text-foreground">{order.customer_name || "—"}</td>
                    <td className="py-2 text-muted-foreground">{order.order_items?.length || 0}</td>
                    <td className="py-2 text-right text-primary font-semibold">€{Number(order.total).toFixed(2)}</td>
                    <td className="py-2 text-right text-muted-foreground">{new Date(order.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-2 text-right">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    received: { label: "Recebido", className: "bg-blue-500/20 text-blue-400" },
    preparing: { label: "Preparando", className: "bg-yellow-500/20 text-yellow-400" },
    ready: { label: "Pronto", className: "bg-green-500/20 text-green-400" },
    delivered: { label: "Entregue", className: "bg-muted text-muted-foreground" },
    cancelled: { label: "Cancelado", className: "bg-destructive/20 text-destructive" },
  };
  const c = config[status] || { label: status, className: "bg-secondary text-muted-foreground" };
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.className}`}>{c.label}</span>;
};

// ---- Menu Management ----
const MenuManagement = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*, menu_categories(name)").order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] }); toast.success("Item removido!"); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("menu_items").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] }); },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Gerenciar Cardápio</h2>
        <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }} className="bg-primary text-primary-foreground font-body">
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>

      {/* Desktop table */}
      <div className="glass rounded-xl overflow-hidden hidden md:block">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/50">
              <th className="text-left py-3 px-4">Imagem</th>
              <th className="text-left py-3 px-4">Nome</th>
              <th className="text-left py-3 px-4">Categoria</th>
              <th className="text-right py-3 px-4">Preço</th>
              <th className="text-center py-3 px-4">Dia</th>
              <th className="text-center py-3 px-4">Ativo</th>
              <th className="text-right py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-2 px-4">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-lg">🍴</div>
                  )}
                </td>
                <td className="py-2 px-4 text-foreground font-medium">{item.name}</td>
                <td className="py-2 px-4 text-muted-foreground">{(item as any).menu_categories?.name}</td>
                <td className="py-2 px-4 text-right text-primary font-semibold">€{Number(item.price).toFixed(2)}</td>
                <td className="py-2 px-4 text-center text-muted-foreground">
                  {item.day_of_week !== null ? DAY_NAMES[item.day_of_week] : "—"}
                </td>
                <td className="py-2 px-4 text-center">
                  <Switch checked={item.is_active ?? true} onCheckedChange={(v) => toggleMutation.mutate({ id: item.id, is_active: v })} />
                </td>
                <td className="py-2 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingItem(item); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && !isLoading && (
          <p className="text-center py-8 text-muted-foreground font-body">Nenhum item no cardápio.</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((item: any) => (
          <div key={item.id} className="glass rounded-xl p-4">
            <div className="flex items-start gap-3">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center text-xl flex-shrink-0">🍴</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-body text-sm font-semibold text-foreground truncate">{item.name}</h3>
                  <span className="font-body text-sm font-bold text-primary flex-shrink-0">€{Number(item.price).toFixed(2)}</span>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  {(item as any).menu_categories?.name || "Sem categoria"}
                  {item.day_of_week !== null && ` • ${DAY_NAMES[item.day_of_week]}`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Switch checked={item.is_active ?? true} onCheckedChange={(v) => toggleMutation.mutate({ id: item.id, is_active: v })} />
                <span className="font-body text-xs text-muted-foreground">{item.is_active ? "Ativo" : "Inativo"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingItem(item); setDialogOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && !isLoading && (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted-foreground font-body">Nenhum item no cardápio.</p>
          </div>
        )}
      </div>

      <MenuItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editingItem} categories={categories} />
    </div>
  );
};

// ---- Menu Item Dialog ----
const MenuItemDialog = ({ open, onOpenChange, item, categories }: { open: boolean; onOpenChange: (v: boolean) => void; item: any; categories: any[] }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name); setDescription(item.description || ""); setPrice(String(item.price));
      setCategoryId(item.category_id || ""); setImageUrl(item.image_url || "");
      setDayOfWeek(item.day_of_week !== null && item.day_of_week !== undefined ? String(item.day_of_week) : "");
      setIngredients(item.ingredients?.join(", ") || "");
    } else {
      setName(""); setDescription(""); setPrice(""); setCategoryId(""); setImageUrl(""); setDayOfWeek(""); setIngredients("");
    }
  }, [item, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("menu-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name, description, price: parseFloat(price), category_id: categoryId || null, image_url: imageUrl,
        day_of_week: dayOfWeek !== "" ? parseInt(dayOfWeek) : null,
        ingredients: ingredients ? ingredients.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      };
      if (item) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
      toast.success(item ? "Item atualizado!" : "Item adicionado!");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{item ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div>
            <Label className="font-body text-sm">Imagem do Produto</Label>
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full rounded-lg object-cover" />}
            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="mt-2 bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-sm">Nome do Prato</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="font-body text-sm">Preço (€)</Label>
              <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-sm">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-body text-sm">Dia da Semana</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Todos os dias" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos os dias</SelectItem>
                  {DAY_NAMES.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="font-body text-sm">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="font-body text-sm">Ingredientes (separados por vírgula)</Label>
            <Input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Arroz, Feijão, Bife..." className="bg-secondary border-border" />
          </div>
          <Button type="submit" disabled={saveMutation.isPending} className="w-full bg-primary text-primary-foreground font-body font-semibold">
            {saveMutation.isPending ? "A guardar..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ---- Order Management ----
const OrderManagement = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Status atualizado!"); },
  });

  const statusLabels: Record<string, string> = {
    received: "Recebido", preparing: "Em Preparação", ready: "Pronto", delivered: "Entregue", cancelled: "Cancelado"
  };

  const filteredOrders = useMemo(() => {
    if (filter === "pending") return orders.filter((o: any) => ["received", "preparing", "ready"].includes(o.status));
    if (filter === "done") return orders.filter((o: any) => ["delivered", "cancelled"].includes(o.status));
    return orders;
  }, [orders, filter]);

  // Filter to today's orders
  const todayOrders = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return filteredOrders.filter((o: any) => new Date(o.created_at) >= startOfDay);
  }, [filteredOrders]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Pedidos do Dia</h2>
        <div className="flex gap-2">
          {[
            { id: "all" as const, label: "Todos" },
            { id: "pending" as const, label: "Pendentes" },
            { id: "done" as const, label: "Concluídos" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-all ${
                filter === f.id ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {todayOrders.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-muted-foreground font-body">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayOrders.map((order: any) => (
            <div key={order.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-sm font-semibold text-foreground">#{order.id.slice(0, 8)}</span>
                    <StatusBadge status={order.status} />
                    <span className="font-body text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    👤 {order.customer_name} • 📞 {order.customer_phone} • {order.delivery_mode === "delivery" ? "🚚 Entrega" : "🏪 Retirada"}
                  </p>
                  {order.address && <p className="font-body text-sm text-muted-foreground">📍 {order.address}</p>}

                  <div className="mt-3 space-y-1">
                    {order.order_items?.map((oi: any) => {
                      const cust = oi.customization as any;
                      return (
                        <div key={oi.id} className="font-body text-sm">
                          <span className="text-foreground">{oi.quantity}x {oi.name}</span>
                          <span className="text-primary ml-2">€{Number(oi.price).toFixed(2)}</span>
                          {cust?.removed?.length > 0 && (
                            <span className="text-xs text-destructive/70 ml-2">❌ {cust.removed.join(", ")}</span>
                          )}
                          {cust?.addons?.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">➕ {cust.addons.map((a: any) => a.name).join(", ")}</span>
                          )}
                          {cust?.meatPoint && (
                            <span className="text-xs text-muted-foreground ml-2">🥩 {cust.meatPoint}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {order.notes && (
                    <p className="font-body text-xs text-muted-foreground italic mt-2">📝 "{order.notes}"</p>
                  )}

                  <p className="font-body text-sm font-bold text-primary mt-2">Total: €{Number(order.total).toFixed(2)}</p>
                </div>

                <Select value={order.status} onValueChange={(v) => statusMutation.mutate({ id: order.id, status: v })}>
                  <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---- History View ----
const HistoryView = () => {
  const { data: allOrders = [] } = useQuery({
    queryKey: ["admin-all-orders-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekOrders = allOrders.filter((o: any) => new Date(o.created_at) >= startOfWeek);
    const monthOrders = allOrders.filter((o: any) => new Date(o.created_at) >= startOfMonth);

    const weekRevenue = weekOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
    const monthRevenue = monthOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
    const totalRevenue = allOrders.reduce((s: number, o: any) => s + Number(o.total), 0);

    return { weekRevenue, monthRevenue, totalRevenue, totalOrders: allOrders.length };
  }, [allOrders]);

  // Group by day
  const dailyStats = useMemo(() => {
    const map: Record<string, { orders: number; revenue: number }> = {};
    allOrders.forEach((o: any) => {
      const day = new Date(o.created_at).toLocaleDateString("pt-PT");
      if (!map[day]) map[day] = { orders: 0, revenue: 0 };
      map[day].orders++;
      map[day].revenue += Number(o.total);
    });
    return Object.entries(map).slice(0, 30);
  }, [allOrders]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Histórico de Vendas</h2>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Esta Semana", value: `€${stats.weekRevenue.toFixed(2)}` },
          { label: "Este Mês", value: `€${stats.monthRevenue.toFixed(2)}` },
          { label: "Total Geral", value: `€${stats.totalRevenue.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-5 text-center">
            <p className="font-body text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display text-2xl font-bold text-primary mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/50">
              <th className="text-left py-3 px-4">Data</th>
              <th className="text-center py-3 px-4">Pedidos</th>
              <th className="text-right py-3 px-4">Faturamento</th>
              <th className="text-right py-3 px-4">Média/Pedido</th>
            </tr>
          </thead>
          <tbody>
            {dailyStats.map(([day, data]) => (
              <tr key={day} className="border-b border-border/50">
                <td className="py-2 px-4 text-foreground">{day}</td>
                <td className="py-2 px-4 text-center text-muted-foreground">{data.orders}</td>
                <td className="py-2 px-4 text-right text-primary font-semibold">€{data.revenue.toFixed(2)}</td>
                <td className="py-2 px-4 text-right text-muted-foreground">€{(data.revenue / data.orders).toFixed(2)}</td>
              </tr>
            ))}
            {dailyStats.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum histórico disponível</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
