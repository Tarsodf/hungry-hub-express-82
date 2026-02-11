import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin/login"); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) { navigate("/admin/login"); }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Painel Admin</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant={activeTab === "menu" ? "default" : "outline"} onClick={() => setActiveTab("menu")}>
            Cardápio
          </Button>
          <Button variant={activeTab === "orders" ? "default" : "outline"} onClick={() => setActiveTab("orders")}>
            <Package className="mr-2 h-4 w-4" /> Pedidos
          </Button>
        </div>

        {activeTab === "menu" ? <MenuManagement /> : <OrderManagement />}
      </div>
    </main>
  );
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

  const openEdit = (item: any) => { setEditingItem(item); setDialogOpen(true); };
  const openNew = () => { setEditingItem(null); setDialogOpen(true); };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Itens do Cardápio</h2>
        <Button onClick={openNew} className="bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Novo Item
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item: any) => (
          <Card key={item.id} className="flex items-center gap-4 p-4 border-border bg-card">
            {item.image_url && <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded-md object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-card-foreground truncate">{item.name}</h3>
                <Badge variant={item.is_active ? "default" : "secondary"}>
                  {item.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{(item as any).menu_categories?.name} • €{Number(item.price).toFixed(2)}</p>
            </div>
            <Switch checked={item.is_active ?? true} onCheckedChange={(v) => toggleMutation.mutate({ id: item.id, is_active: v })} />
            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
        {items.length === 0 && !isLoading && (
          <p className="text-center py-8 text-muted-foreground">Nenhum item no cardápio. Adicione o primeiro!</p>
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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name); setDescription(item.description || ""); setPrice(String(item.price));
      setCategoryId(item.category_id || ""); setImageUrl(item.image_url || "");
    } else {
      setName(""); setDescription(""); setPrice(""); setCategoryId(""); setImageUrl("");
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
    } catch (err: any) {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, description, price: parseFloat(price), category_id: categoryId || null, image_url: imageUrl };
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{item ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div>
            <Label className="font-body">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label className="font-body">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-body">Preço (€)</Label>
              <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div>
              <Label className="font-body">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="font-body">Imagem</Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-24 rounded-md object-cover" />}
          </div>
          <Button type="submit" disabled={saveMutation.isPending} className="w-full bg-primary text-primary-foreground">
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

  const statusColors: Record<string, string> = {
    received: "bg-blue-100 text-blue-800", preparing: "bg-yellow-100 text-yellow-800",
    ready: "bg-green-100 text-green-800", delivered: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800"
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground">Pedidos</h2>
      {orders.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum pedido recebido ainda.</p>
      ) : (
        orders.map((order: any) => (
          <Card key={order.id} className="p-4 border-border bg-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-card-foreground">
                    Pedido #{order.id.slice(0, 8)}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-body font-medium ${statusColors[order.status] || ""}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.delivery_mode === "delivery" ? "Entrega" : "Retirada"} • €{Number(order.total).toFixed(2)} • {new Date(order.created_at).toLocaleString("pt-PT")}
                </p>
                {order.address && <p className="text-sm text-muted-foreground">📍 {order.address}</p>}
                {order.notes && <p className="text-sm text-muted-foreground italic">"{order.notes}"</p>}
                <div className="mt-2 space-y-1">
                  {order.order_items?.map((oi: any) => (
                    <p key={oi.id} className="text-sm text-foreground">{oi.quantity}x {oi.name} — €{Number(oi.price).toFixed(2)}</p>
                  ))}
                </div>
              </div>
              <Select value={order.status} onValueChange={(v) => statusMutation.mutate({ id: order.id, status: v })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default AdminDashboard;
