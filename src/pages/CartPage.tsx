import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Plus, Minus, ShoppingCart, Send, CreditCard, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DeliveryFeeCalculator from "@/components/DeliveryFeeCalculator";
import PaymentMethodSelector, { type PaymentMethod } from "@/components/PaymentMethodSelector";

const WHATSAPP_NUMBER = "351930580520";
const POSTAL_CODE_REGEX = /^\d{4}-?\d{3}$/;

const CartPage = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    serviceFee,
    deliveryFee,
    deliveryDistance,
    setDeliveryFee,
    clearDeliveryFee,
    total,
    itemCount,
    deliveryMode,
    setDeliveryMode,
    address,
    setAddress,
    orderNotes,
    setOrderNotes,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    clearCart,
  } = useCart();
  const [sending, setSending] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [deliveryNeedsConsultation, setDeliveryNeedsConsultation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [mbwayOrderCreated, setMbwayOrderCreated] = useState(false);
  const [mbwayOrderId, setMbwayOrderId] = useState<string | null>(null);

  const getFormattedPostalCode = () => {
    const trimmed = postalCode.trim();
    if (!trimmed) return "";
    if (/^\d{7}$/.test(trimmed)) return trimmed.replace(/(\d{4})(\d{3})/, "$1-$2");
    return trimmed;
  };

  const getFormattedDeliveryAddress = () => {
    return [address.trim(), getFormattedPostalCode()].filter(Boolean).join(", ");
  };

  const resetDeliveryCalculation = () => {
    clearDeliveryFee();
    setDeliveryNeedsConsultation(false);
  };

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case "card": return "💳 Cartão (Crédito/Débito)";
      case "mbway": return "📱 MB WAY";
      case "multibanco": return "🏧 Multibanco";
      case "cash": return "💵 Dinheiro na entrega";
    }
  };

  const buildWhatsAppMessage = () => {
    const formattedDeliveryAddress = getFormattedDeliveryAddress();
    let msg = `🍽️ *Novo Pedido - Dom Bistro Grill*\n\n`;
    msg += `👤 *Nome:* ${customerName}\n`;
    msg += `📞 *Telefone:* ${customerPhone}\n`;
    msg += `📦 *Modo:* ${deliveryMode === "delivery" ? "Entrega" : "Retirada"}\n`;
    if (deliveryMode === "delivery" && formattedDeliveryAddress) {
      msg += `📍 *Endereço:* ${formattedDeliveryAddress}\n`;
    }
    msg += `💳 *Pagamento:* ${getPaymentMethodLabel()}\n`;
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
    if (deliveryMode === "delivery") {
      if (deliveryNeedsConsultation) {
        msg += `🚚 Taxa de entrega: Consultar estabelecimento\n`;
      } else if (deliveryFee > 0) {
        msg += `🚚 Taxa de entrega: €${deliveryFee.toFixed(2)}${deliveryDistance ? ` (${deliveryDistance.toFixed(1)} km)` : ""}\n`;
      }
    }
    msg += `🏷️ *Total: €${total.toFixed(2)}*\n`;

    if (paymentMethod === "cash") {
      msg += `\n💵 *Pagamento em dinheiro na ${deliveryMode === "delivery" ? "entrega" : "retirada"}*\n`;
    } else {
      msg += `\n💳 *Pagamento online confirmado*\n`;
    }

    if (orderNotes) {
      msg += `\n📝 *Observações:* ${orderNotes}\n`;
    }
    return msg;
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedAddress = address.trim();
    const trimmedPostalCode = postalCode.trim();

    if (!customerName.trim() || customerName.trim().length > 100) errs.customerName = "Nome obrigatório (máx. 100 caracteres)";
    if (!customerPhone.trim() || !/^\+?[0-9\s]{7,20}$/.test(customerPhone.trim())) errs.customerPhone = "Telefone inválido";

    if (deliveryMode === "delivery") {
      if (!trimmedAddress && !trimmedPostalCode) {
        errs.address = "Informe a morada ou o código postal";
      }
      if (trimmedAddress.length > 200) {
        errs.address = "Morada inválida (máx. 200 caracteres)";
      }
      if (trimmedPostalCode && !POSTAL_CODE_REGEX.test(trimmedPostalCode)) {
        errs.postalCode = "Código postal inválido (use 4810-647)";
      }
      if (deliveryNeedsConsultation) {
        errs.delivery = "Acima de 5 km, a entrega fica sujeita à autorização do restaurante";
      } else if (deliveryDistance === null) {
        errs.delivery = "Calcule a taxa de entrega pela morada ou código postal";
      }
    }

    if (orderNotes.length > 500) errs.orderNotes = "Observações: máx. 500 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createOrder = async () => {
    const payload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      delivery_mode: deliveryMode,
      address: deliveryMode === "delivery" ? getFormattedDeliveryAddress() : "",
      notes: orderNotes.trim(),
      delivery_fee: deliveryMode === "delivery" ? deliveryFee : 0,
      items: items.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        customization: {
          removed: item.customization?.removed || [],
          addons: item.customization?.addons || [],
          meatPoint: item.customization?.meatPoint || undefined,
        },
      })),
    };

    const { data, error } = await supabase.functions.invoke("create-order", { body: payload });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const sendWhatsApp = () => {
    const message = buildWhatsAppMessage();
    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
    const opened = window.open(waUrl, "_blank");
    if (!opened) {
      const webUrl = `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMsg}`;
      const opened2 = window.open(webUrl, "_blank");
      if (!opened2) window.location.href = waUrl;
    }
  };

  const handleSubmitOrder = async () => {
    if (!validate()) return;
    setSending(true);

    try {
      if (paymentMethod === "card" || paymentMethod === "multibanco") {
        // Card and Multibanco go through Stripe Checkout
        const checkoutPayload = {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          delivery_mode: deliveryMode,
          address: deliveryMode === "delivery" ? getFormattedDeliveryAddress() : "",
          notes: orderNotes.trim(),
          delivery_fee: deliveryMode === "delivery" ? deliveryFee : 0,
          payment_method: paymentMethod,
          items: items.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            customization: {
              removed: item.customization?.removed || [],
              addons: item.customization?.addons || [],
              meatPoint: item.customization?.meatPoint || undefined,
            },
          })),
        };

        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
          "create-checkout",
          { body: checkoutPayload }
        );

        if (checkoutError) throw checkoutError;
        if (checkoutData?.error) throw new Error(checkoutData.error);

        if (checkoutData?.url) {
          clearCart();
          window.location.href = checkoutData.url;
          return;
        }
      } else if (paymentMethod === "mbway") {
        // MB WAY — manual: create order as pending_confirmation
        const payload = {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          delivery_mode: deliveryMode,
          address: deliveryMode === "delivery" ? getFormattedDeliveryAddress() : "",
          notes: orderNotes.trim(),
          delivery_fee: deliveryMode === "delivery" ? deliveryFee : 0,
          payment_method: "mbway",
          items: items.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            customization: {
              removed: item.customization?.removed || [],
              addons: item.customization?.addons || [],
              meatPoint: item.customization?.meatPoint || undefined,
            },
          })),
        };

        const { data, error } = await supabase.functions.invoke("create-order", { body: payload });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setMbwayOrderId(data?.order_id || null);
        setMbwayOrderCreated(true);
        toast.success("Pedido criado! Efetue o pagamento via MB WAY.");
      } else {
        // Cash — create order then WhatsApp
        const orderData = await createOrder();
        sendWhatsApp();
        toast.success("Pedido enviado com sucesso!");
        clearCart();
      }
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const getSubmitButtonConfig = () => {
    switch (paymentMethod) {
      case "card":
        return { icon: CreditCard, text: "Pagar com Cartão", color: "bg-[#635BFF] hover:bg-[#635BFF]/90" };
      case "mbway":
        return { icon: CreditCard, text: "Pagar com MB WAY", color: "bg-[#E4002B] hover:bg-[#E4002B]/90" };
      case "multibanco":
        return { icon: CreditCard, text: "Pagar com Multibanco", color: "bg-[#0070BA] hover:bg-[#0070BA]/90" };
      case "cash":
        return { icon: Send, text: "Confirmar Pedido (Dinheiro)", color: "bg-[#25D366] hover:bg-[#25D366]/90" };
    }
  };

  const btnConfig = getSubmitButtonConfig();

  if (items.length === 0) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <ShoppingCart className="mb-4 mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold text-foreground">Carrinho Vazio</h1>
          <p className="mt-2 font-body text-muted-foreground">Adicione itens do cardápio para começar.</p>
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
        <p className="mt-1 text-center font-body text-muted-foreground">{itemCount} itens</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, idx) => {
              const addonsTotal = item.customization?.addons?.reduce((s, a) => s + a.price, 0) || 0;
              const unitPrice = item.price + addonsTotal;
              return (
                <div key={`${item.id}-${idx}`} className="glass rounded-xl flex items-start gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body font-semibold text-foreground">{item.name}</h3>
                    <p className="font-body text-sm font-bold text-primary">€{unitPrice.toFixed(2)}</p>
                    {item.customization?.removed && item.customization.removed.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">❌ Sem: {item.customization.removed.join(", ")}</p>
                    )}
                    {item.customization?.addons && item.customization.addons.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">➕ {item.customization.addons.map((a) => a.name).join(", ")}</p>
                    )}
                    {item.customization?.meatPoint && (
                      <p className="mt-1 text-xs text-muted-foreground">🥩 {item.customization.meatPoint}</p>
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
                  <span className="w-20 text-right font-body font-bold text-foreground">€{(unitPrice * item.quantity).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive/70 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div>
            <div className="glass sticky top-24 rounded-xl p-6">
              <h2 className="font-display text-xl font-bold text-foreground">Finalizar Pedido</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="customerName" className="font-body text-sm text-muted-foreground">Nome *</Label>
                  <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value.slice(0, 100))} placeholder="O seu nome" className="mt-1 bg-secondary border-border text-foreground" maxLength={100} />
                  {errors.customerName && <p className="mt-1 text-xs text-destructive">{errors.customerName}</p>}
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="font-body text-sm text-muted-foreground">Telefone *</Label>
                  <Input id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.slice(0, 20))} placeholder="+351 9XX XXX XXX" className="mt-1 bg-secondary border-border text-foreground" maxLength={20} />
                  {errors.customerPhone && <p className="mt-1 text-xs text-destructive">{errors.customerPhone}</p>}
                </div>
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Modo de recebimento</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setDeliveryMode("delivery"); resetDeliveryCalculation(); }}
                      className={`rounded-lg p-3 text-center font-body text-sm transition-all ${deliveryMode === "delivery" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                    >
                      🚚 Entrega
                    </button>
                    <button
                      onClick={() => { setDeliveryMode("pickup"); resetDeliveryCalculation(); }}
                      className={`rounded-lg p-3 text-center font-body text-sm transition-all ${deliveryMode === "pickup" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                    >
                      🏪 Retirada
                    </button>
                  </div>
                </div>
                {deliveryMode === "delivery" && (
                  <>
                    <div>
                      <Label htmlFor="address" className="font-body text-sm text-muted-foreground">Morada de entrega</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => { setAddress(e.target.value.slice(0, 200)); resetDeliveryCalculation(); }}
                        placeholder="Rua, número, andar..."
                        className="mt-1 bg-secondary border-border text-foreground"
                        maxLength={200}
                      />
                      {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
                    </div>
                    <div>
                      <Label htmlFor="postalCode" className="font-body text-sm text-muted-foreground">Código postal</Label>
                      <Input
                        id="postalCode"
                        value={postalCode}
                        onChange={(e) => { setPostalCode(e.target.value.replace(/[^\d-]/g, "").slice(0, 8)); resetDeliveryCalculation(); }}
                        placeholder="4810-647"
                        className="mt-1 bg-secondary border-border text-foreground"
                        maxLength={8}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Pode preencher só o código postal ou combinar com a morada.</p>
                      {errors.postalCode && <p className="mt-1 text-xs text-destructive">{errors.postalCode}</p>}
                    </div>
                    <DeliveryFeeCalculator
                      address={address}
                      postalCode={postalCode}
                      onFeeCalculated={(fee, distance) => { setDeliveryFee(fee, distance); setDeliveryNeedsConsultation(false); }}
                      onConsultRequired={() => { clearDeliveryFee(); setDeliveryNeedsConsultation(true); }}
                      currentFee={deliveryFee > 0 ? deliveryFee : null}
                      currentDistance={deliveryDistance}
                    />
                    {errors.delivery && <p className="text-xs text-destructive">{errors.delivery}</p>}
                  </>
                )}
                <div>
                  <Label htmlFor="notes" className="font-body text-sm text-muted-foreground">Observações</Label>
                  <Textarea id="notes" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value.slice(0, 500))} placeholder="Alguma observação?" className="mt-1 bg-secondary border-border text-foreground" rows={2} maxLength={500} />
                  {errors.orderNotes && <p className="mt-1 text-xs text-destructive">{errors.orderNotes}</p>}
                </div>

                {/* Payment Method Selection */}
                <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

                {/* Payment info for electronic methods */}
                {paymentMethod === "mbway" && !mbwayOrderCreated && (
                  <div className="rounded-lg bg-secondary/50 border border-border p-3 space-y-1">
                    <p className="font-body text-xs font-semibold text-foreground">📱 Pagamento MB WAY</p>
                    <p className="font-body text-xs text-muted-foreground">
                      Após confirmar, envie <strong className="text-foreground">€{total.toFixed(2)}</strong> para o número:
                    </p>
                    <p className="font-body text-sm font-bold text-primary">+351 930 580 520</p>
                    <p className="font-body text-xs text-muted-foreground">
                      Depois envie o comprovativo via WhatsApp para confirmarmos o pedido.
                    </p>
                  </div>
                )}
                {paymentMethod === "mbway" && mbwayOrderCreated && (
                  <div className="rounded-lg bg-primary/10 border border-primary p-4 space-y-3">
                    <p className="font-body text-sm font-bold text-foreground">✅ Pedido criado com sucesso!</p>
                    {mbwayOrderId && (
                      <p className="font-body text-xs text-muted-foreground">
                        Referência: <strong className="text-foreground">{mbwayOrderId.slice(0, 8).toUpperCase()}</strong>
                      </p>
                    )}
                    <div className="space-y-1">
                      <p className="font-body text-xs text-muted-foreground">
                        1. Envie <strong className="text-foreground">€{total.toFixed(2)}</strong> via MB WAY para:
                      </p>
                      <p className="font-body text-lg font-bold text-primary">+351 930 580 520</p>
                      <p className="font-body text-xs text-muted-foreground">
                        2. Envie o comprovativo via WhatsApp:
                      </p>
                    </div>
                    <Button
                      className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-body font-bold"
                      onClick={() => {
                        const msg = encodeURIComponent(
                          `📱 *Comprovativo MB WAY*\n\nPedido: ${mbwayOrderId?.slice(0, 8).toUpperCase()}\nNome: ${customerName}\nValor: €${total.toFixed(2)}\n\n(Anexe o comprovativo de pagamento)`
                        );
                        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Comprovativo via WhatsApp
                    </Button>
                    <Link to="/cardapio" className="block">
                      <Button variant="outline" className="w-full font-body text-sm border-border">
                        Voltar ao Cardápio
                      </Button>
                    </Link>
                  </div>
                )}
                {paymentMethod === "multibanco" && (
                  <div className="rounded-lg bg-secondary/50 border border-border p-3">
                    <p className="font-body text-xs text-muted-foreground">
                      🏧 Será redirecionado para o Stripe. Receberá uma referência Multibanco para efetuar o pagamento.
                    </p>
                  </div>
                )}
                {paymentMethod === "cash" && (
                  <div className="rounded-lg bg-secondary/50 border border-border p-3">
                    <p className="font-body text-xs text-muted-foreground">
                      💵 Pague <strong className="text-foreground">€{total.toFixed(2)}</strong> em dinheiro no momento da {deliveryMode === "delivery" ? "entrega" : "retirada"}.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-border pt-4 space-y-2">
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>Taxa de Serviço</span>
                  <span>€{serviceFee.toFixed(2)}</span>
                </div>
                {deliveryMode === "delivery" && deliveryFee > 0 && (
                  <div className="flex justify-between font-body text-sm text-muted-foreground">
                    <span>🚚 Taxa de Entrega</span>
                    <span>€{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {deliveryMode === "delivery" && deliveryNeedsConsultation && (
                  <div className="flex justify-between font-body text-sm text-muted-foreground">
                    <span>🚚 Taxa de Entrega</span>
                    <span>Consultar estabelecimento</span>
                  </div>
                )}
                <div className="flex justify-between font-display text-lg font-bold text-foreground">
                  <span>{deliveryNeedsConsultation ? "Total parcial" : "Total"}</span>
                  <span className="text-primary">€{total.toFixed(2)}</span>
                </div>
                {deliveryNeedsConsultation && (
                  <p className="text-xs text-muted-foreground">A taxa de entrega será confirmada pelo restaurante para distâncias acima de 5 km.</p>
                )}
              </div>

              {!mbwayOrderCreated && (
                <Button
                  className={`mt-6 w-full text-white font-body font-bold py-6 ${btnConfig.color}`}
                  onClick={handleSubmitOrder}
                  disabled={sending}
                >
                  {sending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <btnConfig.icon className="mr-2 h-5 w-5" />
                  )}
                  {sending ? "Processando..." : btnConfig.text}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
