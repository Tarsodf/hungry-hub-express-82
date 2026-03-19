import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Plus, Minus, ShoppingCart, Send } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_NUMBER = "351930580520";

const CartPage = () => {
  const {
    items, removeItem, updateQuantity, subtotal, serviceFee, total, itemCount,
    deliveryMode, setDeliveryMode, address, setAddress,
    orderNotes, setOrderNotes, customerName, setCustomerName,
    customerPhone, setCustomerPhone, clearCart,
  } = useCart();
  const [sending, setSending] = useState(false);

  const buildWhatsAppMessage = () => {
    let msg = `🍽️ *Novo Pedido - Dom Bistro Grill*\n\n`;
    msg += `👤 *Nome:* ${customerName}\n`;
    msg += `📞 *Telefone:* ${customerPhone}\n`;
    msg += `📦 *Modo:* ${deliveryMode === "delivery" ? "Entrega" : "Retirada"}\n`;
    if (deliveryMode === "delivery" && address) {
      msg += `📍 *Endereço:* ${address}\n`;
    }
    msg += `\n━━━━━━━━━━━━━━━\n`;
    msg += `📋 *Itens do Pedido:*\n\n`;

    items.forEach((item, idx) => {
      const addonsTotal = item.customization?.addons?.reduce((s, a) => s + a.price, 0) || 0;
      const unitPrice = item.price + addonsTotal;
      msg += `${idx + 1}. *${item.name}* x${item.quantity} — €${(unitPrice * item.quantity).toFixed(2)}\n`;
      if (item.customization?.removed?.length) {
        msg += `   ❌ Sem: ${item.customization.removed.join(", ")}\n`;
      }
      if (item.customization?.addons?.length) {
        msg += `   ➕ Adicionais: ${item.customization.addons.map((a) => `${a.name} (+€${a.price.toFixed(2)})`).join(", ")}\n`;
      }
      if (item.customization?.meatPoint) {
        msg += `   🥩 Ponto: ${item.customization.meatPoint}\n`;
      }
    });

    msg += `\n━━━━━━━━━━━━━━━\n`;
    msg += `💰 Subtotal: €${subtotal.toFixed(2)}\n`;
    msg += `📋 Taxa de serviço: €${serviceFee.toFixed(2)}\n`;
    msg += `🏷️ *Total: €${total.toFixed(2)}*\n`;
    if (orderNotes) {
      msg += `\n📝 *Observações:* ${orderNotes}\n`;
    }
    return msg;
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) { toast.error("Por favor, insira o seu nome."); return; }
    if (!customerPhone.trim()) { toast.error("Por favor, insira o seu telefone."); return; }
    if (deliveryMode === "delivery" && !address.trim()) { toast.error("Por favor, insira o endereço de entrega."); return; }

    setSending(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName.trim(),
          customer_email: "",
          customer_phone: customerPhone.trim(),
          delivery_mode: deliveryMode,
          address: deliveryMode === "delivery" ? address.trim() : "",
          notes: orderNotes.trim(),
          total,
          service_fee: serviceFee,
          status: "received",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customization: item.customization || {},
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      const message = buildWhatsAppMessage();
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      toast.success("Pedido enviado com sucesso!");
      clearCart();
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
          <h1 className="font-display text-2xl font-bold text-foreground">Carrinho Vazio</h1>
          <p className="mt-2 text-muted-foreground font-body">Adicione itens do cardápio para começar.</p>
          <Link to="/cardapio" className="mt-6 inline-block">
            <Button className="bg-primary text-primary-foreground font-body">Ver Cardápio</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-foreground text-center">Seu Pedido</h1>
        <p className="text-center text-muted-foreground font-body mt-1">{itemCount} itens</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, idx) => {
              const addonsTotal = item.customization?.addons?.reduce((s, a) => s + a.price, 0) || 0;
              const unitPrice = item.price + addonsTotal;
              return (
                <div key={`${item.id}-${idx}`} className="glass rounded-xl flex items-start gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body font-semibold text-foreground">{item.name}</h3>
                    <p className="font-body text-sm text-primary font-bold">€{unitPrice.toFixed(2)}</p>
                    {item.customization?.removed && item.customization.removed.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">❌ Sem: {item.customization.removed.join(", ")}</p>
                    )}
                    {item.customization?.addons && item.customization.addons.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">➕ {item.customization.addons.map((a) => a.name).join(", ")}</p>
                    )}
                    {item.customization?.meatPoint && (
                      <p className="text-xs text-muted-foreground mt-1">🥩 {item.customization.meatPoint}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-body font-bold text-foreground">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-body font-bold text-foreground w-20 text-right">€{(unitPrice * item.quantity).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive/70 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div>
            <div className="glass rounded-xl p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-foreground">Finalizar Pedido</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="customerName" className="font-body text-sm text-muted-foreground">Nome *</Label>
                  <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="O seu nome" className="mt-1 bg-secondary border-border text-foreground" />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="font-body text-sm text-muted-foreground">Telefone *</Label>
                  <Input id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+351 9XX XXX XXX" className="mt-1 bg-secondary border-border text-foreground" />
                </div>
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Modo de recebimento</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDeliveryMode("delivery")}
                      className={`rounded-lg p-3 text-center font-body text-sm transition-all ${deliveryMode === "delivery" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                    >
                      🚚 Entrega
                    </button>
                    <button
                      onClick={() => setDeliveryMode("pickup")}
                      className={`rounded-lg p-3 text-center font-body text-sm transition-all ${deliveryMode === "pickup" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                    >
                      🏪 Retirada
                    </button>
                  </div>
                </div>
                {deliveryMode === "delivery" && (
                  <div>
                    <Label htmlFor="address" className="font-body text-sm text-muted-foreground">Endereço de entrega *</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, andar..." className="mt-1 bg-secondary border-border text-foreground" />
                  </div>
                )}
                <div>
                  <Label htmlFor="notes" className="font-body text-sm text-muted-foreground">Observações</Label>
                  <Textarea id="notes" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Alguma observação?" className="mt-1 bg-secondary border-border text-foreground" rows={2} />
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4 space-y-2">
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>Taxa de Serviço (€0.90)</span>
                  <span>€{serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-display text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span className="text-primary">€{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="mt-6 w-full bg-[#25D366] text-white font-body font-bold py-6 hover:bg-[#25D366]/90"
                onClick={handleSubmitOrder}
                disabled={sending}
              >
                <Send className="mr-2 h-5 w-5" />
                {sending ? "Enviando..." : "Enviar pelo WhatsApp"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
