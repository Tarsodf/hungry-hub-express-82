import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, Package, LayoutDashboard, History, UtensilsCrossed, TrendingUp, ShoppingCart, DollarSign, BarChart3, AlertTriangle, Calendar, Camera, Truck, Crop, Settings, CalendarDays, Check, X, Phone, Mail, Users } from "lucide-react";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Badge } from "@/components/ui/badge";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const uploadMenuImage = async (file: File, itemId?: string) => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${itemId || "menu-item"}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("menu-images").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
  return data.publicUrl;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "menu" | "orders" | "history" | "reservations" | "settings">("dashboard");

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
    { id: "reservations" as const, label: "Reservas", icon: CalendarDays },
    { id: "settings" as const, label: "Configurações", icon: Settings },
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
        {activeTab === "settings" && <SiteSettingsEditor />}
      </div>
    </main>
  );
};

// ---- Dashboard View ----
type PeriodFilter = "today" | "week" | "month" | "all";

const getStartDate = (period: PeriodFilter): Date | null => {
  const now = new Date();
  if (period === "today") { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  if (period === "week") { const d = new Date(now); d.setDate(now.getDate() - now.getDay()); d.setHours(0, 0, 0, 0); return d; }
  if (period === "month") { return new Date(now.getFullYear(), now.getMonth(), 1); }
  return null;
};

const DashboardView = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgePassword, setPurgePassword] = useState("");
  const [purging, setPurging] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ["admin-all-orders-dash"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, menu_items(category_id, menu_categories(name)))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredOrders = useMemo(() => {
    const start = getStartDate(period);
    if (!start) return allOrders;
    return allOrders.filter((o: any) => new Date(o.created_at) >= start);
  }, [allOrders, period]);

  const stats = useMemo(() => {
    const revenue = filteredOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
    const avgTicket = filteredOrders.length > 0 ? revenue / filteredOrders.length : 0;
    return { totalItems: items.length, ordersCount: filteredOrders.length, revenue, avgTicket };
  }, [items, filteredOrders]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o: any) => {
      o.order_items?.forEach((oi: any) => {
        const catName = oi.menu_items?.menu_categories?.name || "Outros";
        map[catName] = (map[catName] || 0) + (Number(oi.price) * oi.quantity);
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredOrders]);

  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredOrders.forEach((o: any) => {
      o.order_items?.forEach((oi: any) => {
        const key = oi.name;
        if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0 };
        map[key].qty += oi.quantity;
        map[key].revenue += Number(oi.price) * oi.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filteredOrders]);

  const maxCatRevenue = categoryStats.length > 0 ? categoryStats[0][1] : 1;
  const periodLabels: Record<PeriodFilter, string> = { today: "Hoje", week: "Esta Semana", month: "Este Mês", all: "Todo Período" };
  const periodSubs: Record<PeriodFilter, string> = { today: "Desde 00:00", week: "Desde domingo", month: "Desde dia 1", all: "Desde o início" };

  const statCards = [
    { label: "Total de Pratos", value: stats.totalItems.toString(), sub: "Itens no cardápio", icon: UtensilsCrossed, color: "text-blue-400" },
    { label: "Pedidos", value: stats.ordersCount.toString(), sub: periodSubs[period], icon: ShoppingCart, color: "text-green-400" },
    { label: "Faturamento", value: `€${stats.revenue.toFixed(2)}`, sub: periodLabels[period], icon: DollarSign, color: "text-primary" },
    { label: "Ticket Médio", value: `€${stats.avgTicket.toFixed(2)}`, sub: "Por pedido", icon: TrendingUp, color: "text-purple-400" },
  ];

  const handlePurge = async () => {
    setPurging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Usuário não encontrado");
      const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: purgePassword });
      if (authError) throw new Error("Senha incorreta");
      const { error: e1 } = await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (e2) throw e2;
      toast.success("Todos os dados de pedidos foram apagados!");
      queryClient.invalidateQueries({ queryKey: ["admin-all-orders-dash"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-orders-history"] });
      setPurgeOpen(false);
      setPurgePassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao limpar dados");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl font-semibold text-foreground">Dashboard</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
            {(["today", "week", "month", "all"] as PeriodFilter[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md font-body text-xs font-medium transition-all ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {periodLabels[p]}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setPurgeOpen(true)}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Limpar
          </Button>
        </div>
      </div>

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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <h3 className="font-body text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" /> Vendas por Categoria ({periodLabels[period]})
          </h3>
          {categoryStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda no período</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map(([cat, revenue]) => (
                <div key={cat}>
                  <div className="flex justify-between font-body text-xs mb-1">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="text-foreground font-semibold">€{revenue.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(revenue / maxCatRevenue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-body text-sm font-semibold text-foreground flex items-center gap-2 mb-4">🏆 Pratos Mais Vendidos</h3>
          {topItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda no período</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className={`font-body text-sm font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>#{i + 1}</span>
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

      {/* Delivery Fee Stats */}
      <DeliveryFeeStats orders={allOrders} period={period} periodLabels={periodLabels} />

      <div className="glass rounded-xl p-5">
        <h3 className="font-body text-sm font-semibold text-foreground mb-4">Pedidos Recentes</h3>
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido no período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2">ID</th><th className="text-left py-2">Cliente</th><th className="text-left py-2">Itens</th>
                  <th className="text-right py-2">Total</th><th className="text-right py-2">Data/Hora</th><th className="text-right py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 15).map((order: any) => (
                  <tr key={order.id} className="border-b border-border/50">
                    <td className="py-2 text-muted-foreground">#{order.id.slice(0, 6)}</td>
                    <td className="py-2 text-foreground">{order.customer_name || "—"}</td>
                    <td className="py-2 text-muted-foreground">{order.order_items?.length || 0}</td>
                    <td className="py-2 text-right text-primary font-semibold">€{Number(order.total).toFixed(2)}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}{" "}
                      {new Date(order.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2 text-right"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Limpar Dados
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Esta ação irá apagar <strong>todos os pedidos</strong> permanentemente. Não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handlePurge(); }} className="space-y-4">
            <div>
              <Label className="font-body text-sm">Confirme com a sua senha</Label>
              <Input type="password" value={purgePassword} onChange={(e) => setPurgePassword(e.target.value)} placeholder="Digite a sua senha de admin" required className="bg-secondary border-border mt-1" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setPurgeOpen(false); setPurgePassword(""); }}>Cancelar</Button>
              <Button type="submit" variant="destructive" className="flex-1" disabled={purging || !purgePassword}>{purging ? "A apagar..." : "Apagar Tudo"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---- Delivery Fee Stats ----
const DeliveryFeeStats = ({ orders, period, periodLabels }: { orders: any[]; period: PeriodFilter; periodLabels: Record<PeriodFilter, string> }) => {
  const deliveryOrders = useMemo(() => {
    const start = getStartDate(period);
    const filtered = start ? orders.filter((o: any) => new Date(o.created_at) >= start) : orders;
    return filtered.filter((o: any) => o.delivery_mode === "delivery" && Number(o.delivery_fee) > 0);
  }, [orders, period]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allDelivery = orders.filter((o: any) => o.delivery_mode === "delivery" && Number(o.delivery_fee) > 0);
    const todayDelivery = allDelivery.filter((o: any) => new Date(o.created_at) >= startOfDay);
    const weekDelivery = allDelivery.filter((o: any) => new Date(o.created_at) >= startOfWeek);
    const monthDelivery = allDelivery.filter((o: any) => new Date(o.created_at) >= startOfMonth);

    const sum = (arr: any[]) => arr.reduce((s: number, o: any) => s + Number(o.delivery_fee), 0);
    return {
      today: { total: sum(todayDelivery), count: todayDelivery.length },
      week: { total: sum(weekDelivery), count: weekDelivery.length },
      month: { total: sum(monthDelivery), count: monthDelivery.length },
    };
  }, [orders]);

  const dailyDeliveries = useMemo(() => {
    const map: Record<string, { count: number; total: number; orders: { id: string; customer: string; fee: number; time: string }[] }> = {};
    deliveryOrders.forEach((o: any) => {
      const day = new Date(o.created_at).toLocaleDateString("pt-PT");
      if (!map[day]) map[day] = { count: 0, total: 0, orders: [] };
      map[day].count++;
      map[day].total += Number(o.delivery_fee);
      map[day].orders.push({
        id: o.id.slice(0, 6),
        customer: o.customer_name || "—",
        fee: Number(o.delivery_fee),
        time: new Date(o.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
      });
    });
    return Object.entries(map).slice(0, 30);
  }, [deliveryOrders]);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
        <Truck className="h-5 w-5 text-primary" /> Taxas de Entrega — Relatório do Entregador
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Hoje", value: stats.today.total, count: stats.today.count },
          { label: "Esta Semana", value: stats.week.total, count: stats.week.count },
          { label: "Este Mês", value: stats.month.total, count: stats.month.count },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-5 text-center">
            <p className="font-body text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display text-2xl font-bold text-primary mt-1">€{s.value.toFixed(2)}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">{s.count} {s.count === 1 ? "entrega" : "entregas"}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-secondary/50 border-b border-border">
          <h4 className="font-body text-sm font-semibold text-foreground">Detalhe por Dia ({periodLabels[period]})</h4>
        </div>
        {dailyDeliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma entrega no período</p>
        ) : (
          <div className="divide-y divide-border/50">
            {dailyDeliveries.map(([day, data]) => (
              <div key={day} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-sm font-semibold text-foreground">{day}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-xs text-muted-foreground">{data.count} {data.count === 1 ? "entrega" : "entregas"}</span>
                    <span className="font-body text-sm font-bold text-primary">€{data.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {data.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between font-body text-xs text-muted-foreground">
                      <span>#{o.id} • {o.time} • {o.customer}</span>
                      <span className="text-foreground font-medium">€{o.fee.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
    pending_confirmation: { label: "Aguardando", className: "bg-orange-500/20 text-orange-400" },
    pending_payment: { label: "Pagamento Pendente", className: "bg-yellow-500/20 text-yellow-400" },
  };
  const c = config[status] || { label: status, className: "bg-secondary text-muted-foreground" };
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.className}`}>{c.label}</span>;
};

// ---- Menu Management ----
const MenuManagement = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);

  const handleQuickImageChange = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImageFor(itemId);
    try {
      const imageUrl = await uploadMenuImage(file, itemId);
      const { error: updateError } = await supabase.from("menu_items").update({ image_url: imageUrl }).eq("id", itemId);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
      toast.success("Foto atualizada!");
      e.target.value = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar foto");
    } finally {
      setUploadingImageFor(null);
    }
  };

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

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, { category: any; items: any[] }> = {};
    // Initialize groups from categories in sort order
    categories.forEach((cat) => {
      groups[cat.id] = { category: cat, items: [] };
    });
    // Add uncategorized group
    groups["uncategorized"] = { category: { id: "uncategorized", name: "Sem Categoria", emoji: "📋" }, items: [] };
    // Distribute items
    items.forEach((item: any) => {
      const catId = item.category_id || "uncategorized";
      if (groups[catId]) {
        groups[catId].items.push(item);
      } else {
        groups["uncategorized"].items.push(item);
      }
    });
    // Sort items within each group: executivo items by day_of_week (Mon=1 → Sun=0 mapped to 7)
    Object.values(groups).forEach((g) => {
      g.items.sort((a: any, b: any) => {
        const aDow = a.day_of_week;
        const bDow = b.day_of_week;
        // Items without day_of_week go after sorted ones
        if (aDow === null && bDow === null) return 0;
        if (aDow === null) return 1;
        if (bDow === null) return -1;
        // Map Sunday (0) to 7 so Monday (1) comes first
        const aSort = aDow === 0 ? 7 : aDow;
        const bSort = bDow === 0 ? 7 : bDow;
        return aSort - bSort;
      });
    });
    // Return only groups that have items
    return Object.values(groups).filter((g) => g.items.length > 0);
  }, [items, categories]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Gerenciar Cardápio</h2>
        <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }} className="bg-primary text-primary-foreground font-body">
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>

      {/* Grouped by category */}
      <div className="space-y-6">
        {groupedItems.map((group) => (
          <div key={group.category.id}>
            <h3 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <span>{group.category.emoji || "🍽️"}</span> {group.category.name}
              <Badge variant="secondary" className="text-xs font-body">{group.items.length}</Badge>
            </h3>

            {/* Desktop table */}
            <div className="glass rounded-xl overflow-hidden hidden md:block">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/50">
                    <th className="text-left py-3 px-4">Imagem</th>
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-right py-3 px-4">Preço</th>
                    <th className="text-center py-3 px-4">Dia</th>
                    <th className="text-center py-3 px-4">Ativo</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item: any) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-2 px-4">
                        <div className="flex flex-col items-start gap-2">
                          <label className="relative group cursor-pointer inline-block">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickImageChange(item.id, e)} disabled={uploadingImageFor === item.id} />
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-lg">🍴</div>
                            )}
                            <div className="absolute inset-0 rounded-lg bg-foreground/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {uploadingImageFor === item.id ? (
                                <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4 text-background" />
                              )}
                            </div>
                          </label>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickImageChange(item.id, e)} disabled={uploadingImageFor === item.id} />
                          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-body text-muted-foreground hover:text-foreground transition-colors">
                            <Camera className="h-3 w-3" />
                            {uploadingImageFor === item.id ? "A enviar..." : "Alterar foto"}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickImageChange(item.id, e)} disabled={uploadingImageFor === item.id} />
                          </label>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-foreground font-medium">{item.name}</td>
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
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {group.items.map((item: any) => (
                <div key={item.id} className="glass rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <label className="relative group cursor-pointer inline-block">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickImageChange(item.id, e)} disabled={uploadingImageFor === item.id} />
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
                        ) : (
                          <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center text-xl">🍴</div>
                        )}
                        <div className="absolute inset-0 rounded-lg bg-foreground/60 flex items-center justify-center opacity-100 transition-opacity">
                          {uploadingImageFor === item.id ? (
                            <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera className="h-5 w-5 text-background" />
                          )}
                        </div>
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-body text-muted-foreground hover:text-foreground transition-colors">
                        <Camera className="h-3 w-3" />
                        {uploadingImageFor === item.id ? "A enviar..." : "Alterar foto"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickImageChange(item.id, e)} disabled={uploadingImageFor === item.id} />
                      </label>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-body text-sm font-semibold text-foreground truncate">{item.name}</h3>
                        <span className="font-body text-sm font-bold text-primary flex-shrink-0">€{Number(item.price).toFixed(2)}</span>
                      </div>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">
                        {item.day_of_week !== null && `${DAY_NAMES[item.day_of_week]}`}
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
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<CropType>();
  const imgRef = useRef<HTMLImageElement>(null);
  const rawFileRef = useRef<File | null>(null);

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

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const c = centerCrop(makeAspectCrop({ unit: "%", width: 90 }, 4 / 3, width, height), width, height);
    setCrop(c);
    setCompletedCrop(c);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    rawFileRef.current = file;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const getCroppedBlob = async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;
    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelCrop = {
      x: (completedCrop.unit === "%" ? (completedCrop.x / 100) * image.width : completedCrop.x) * scaleX,
      y: (completedCrop.unit === "%" ? (completedCrop.y / 100) * image.height : completedCrop.y) * scaleY,
      width: (completedCrop.unit === "%" ? (completedCrop.width / 100) * image.width : completedCrop.width) * scaleX,
      height: (completedCrop.unit === "%" ? (completedCrop.height / 100) * image.height : completedCrop.height) * scaleY,
    };
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  };

  const handleCropAndUpload = async () => {
    setUploading(true);
    try {
      const blob = await getCroppedBlob();
      if (!blob) throw new Error("Falha ao recortar imagem");
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      const publicUrl = await uploadMenuImage(file, item?.id);
      setImageUrl(publicUrl);
      toast.success("Imagem recortada e enviada!");
      setCropDialogOpen(false);
      setRawImageSrc(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadMenuImage(file, item?.id);
      setImageUrl(publicUrl);
      toast.success("Imagem enviada!");
      e.target.value = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar imagem");
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
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{item ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div>
            <Label className="font-body text-sm">Imagem do Produto</Label>
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full rounded-lg object-cover" />}
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <Label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md bg-secondary border border-border text-sm font-body text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
                  <Camera className="h-4 w-4" /> Enviar Foto
                  <input type="file" accept="image/*" onChange={handleDirectUpload} disabled={uploading} className="hidden" />
                </Label>
              </div>
              <div className="flex-1">
                <Label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md bg-secondary border border-border text-sm font-body text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
                  <Crop className="h-4 w-4" /> Recortar e Enviar
                  <input type="file" accept="image/*" onChange={handleFileSelect} disabled={uploading} className="hidden" />
                </Label>
              </div>
            </div>
            {uploading && <p className="font-body text-xs text-muted-foreground mt-1">A enviar...</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-sm">Nome do Prato</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="font-body text-sm">Preço (€)</Label>
              <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

    {/* Crop Dialog */}
    <Dialog open={cropDialogOpen} onOpenChange={(v) => { if (!v) { setCropDialogOpen(false); setRawImageSrc(null); } }}>
      <DialogContent className="sm:max-w-xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Crop className="h-5 w-5 text-primary" /> Recortar Imagem
          </DialogTitle>
        </DialogHeader>
        {rawImageSrc && (
          <div className="space-y-4">
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={undefined}>
              <img ref={imgRef} src={rawImageSrc} alt="Recortar" onLoad={onImageLoad} className="max-h-[60vh] w-full object-contain" />
            </ReactCrop>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setCropDialogOpen(false); setRawImageSrc(null); }}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1 bg-primary text-primary-foreground" onClick={handleCropAndUpload} disabled={uploading}>
                {uploading ? "A enviar..." : "Recortar e Enviar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
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
    pending_payment: "Pagamento Pendente", pending_confirmation: "Aguardando Confirmação", received: "Recebido", preparing: "Em Preparação", ready: "Pronto", delivered: "Entregue", cancelled: "Cancelado"
  };

  const filteredOrders = useMemo(() => {
    if (filter === "pending") return orders.filter((o: any) => ["pending_payment", "pending_confirmation", "received", "preparing", "ready"].includes(o.status));
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
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
                    {order.payment_method && <span className="ml-1">• 💳 {({card:"Cartão",mbway:"MB WAY",multibanco:"Multibanco",cash:"Dinheiro"} as Record<string,string>)[order.payment_method] || order.payment_method}</span>}
                  </p>
                  {order.address && <p className="font-body text-sm text-muted-foreground">📍 {order.address}</p>}
                  {order.delivery_mode === "delivery" && (
                    <p className="font-body text-sm text-muted-foreground mt-1">
                      💶 Taxa de entrega: <span className="font-semibold text-foreground">€{Number(order.delivery_fee || 0).toFixed(2)}</span>
                    </p>
                  )}

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
                  <SelectTrigger className="w-full sm:w-40 bg-secondary border-border"><SelectValue /></SelectTrigger>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

// ---- Site Settings Editor ----
const SETTINGS_FIELDS = [
  { key: "address_line1", label: "Endereço — Linha 1", group: "Localização" },
  { key: "address_line2", label: "Endereço — Linha 2", group: "Localização" },
  { key: "address_line3", label: "Cidade / Código Postal", group: "Localização" },
  { key: "phone", label: "Telefone", group: "Contactos" },
  { key: "email", label: "Email", group: "Contactos" },
  { key: "instagram_url", label: "Link do Instagram", group: "Redes Sociais" },
  { key: "instagram_handle", label: "Nome do Instagram (ex: @nome)", group: "Redes Sociais" },
  { key: "hours_weekday_label", label: "Dias da semana — Rótulo", group: "Horário" },
  { key: "hours_weekday_time", label: "Dias da semana — Horário", group: "Horário" },
  { key: "hours_saturday_label", label: "Sábado — Rótulo", group: "Horário" },
  { key: "hours_saturday_time", label: "Sábado — Horário", group: "Horário" },
  { key: "hours_sunday_label", label: "Domingo — Rótulo", group: "Horário" },
  { key: "hours_sunday_time", label: "Domingo — Horário", group: "Horário" },
];

const SiteSettingsEditor = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dbSnapshot, setDbSnapshot] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data as { id: string; key: string; value: string }[];
    },
  });

  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      const map: Record<string, string> = {};
      settings.forEach((s: any) => { map[s.key] = s.value; });
      setForm(map);
      setDbSnapshot(map);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const field of SETTINGS_FIELDS) {
        const newVal = form[field.key];
        const oldVal = dbSnapshot[field.key];
        if (newVal !== undefined && newVal !== oldVal) {
          const { error } = await supabase
            .from("site_settings")
            .update({ value: newVal, updated_at: new Date().toISOString() })
            .eq("key", field.key);
          if (error) throw error;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["site_settings"] });
      toast.success("Configurações guardadas com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">A carregar...</div>;

  const groups = [...new Set(SETTINGS_FIELDS.map((f) => f.group))];

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-foreground mb-6">Configurações do Rodapé</h2>
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group} className="glass rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">{group}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {SETTINGS_FIELDS.filter((f) => f.group === group).map((field) => (
                <div key={field.key}>
                  <Label className="font-body text-sm text-muted-foreground mb-1">{field.label}</Label>
                  <Input
                    value={form[field.key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="font-body"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground font-body">
          {saving ? "A guardar..." : "Guardar Alterações"}
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
