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
      default: return "";
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
    if (orderNotes) {
      msg += `\n📝 *Observações:* ${orderNotes}\n`;
    }
    return msg;
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedAddress = address.trim();
    const trimmedPostalCode = postalCode.trim();

    if (!customerName.trim() || customerName.trim().length > 100)
      errs.customerName = "Nome obrigatório (máx. 100 caracteres)";
    if (!customerPhone.trim() || !/^\+?[0-9\s]{7,20}$/.test(customerPhone.trim()))
      errs.customerPhone = "Telefone inválido";

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

      if (paymentMethod === "card" || paymentMethod === "multibanco") {
        // Stripe Checkout flow
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
          "create-checkout",
          { body: checkoutPayload },
        );

        if (checkoutError) throw checkoutError;
        if (checkoutData?.error) throw new Error(checkoutData.error);

        if (checkoutData?.url) {
          clearCart();
          window.location.href = checkoutData.url;
          return;
        } else {
          throw new Error("URL de pagamento não retornada");
        }
      } else if (paymentMethod === "mbway") {
        // MB WAY manual flow - create order with pending_confirmation
        const { data, error } = await supabase.functions.invoke("create-order", {
          body: { ...checkoutPayload, payment_method: "mbway" },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setMbwayOrderId(data?.order_id || null);
        setMbwayOrderCreated(true);
        toast.success("Pedido criado! Siga as instruções para pagar via MB WAY.");
      } else if (paymentMethod === "cash") {
        // Cash - create order and send WhatsApp
        const { data, error } = await supabase.functions.invoke("create-order", {
          body: { ...checkoutPayload, payment_method: "cash" },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

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
      default:
        return { icon: Send, text: "Confirmar Pedido", color: "bg-gray-500 hover:bg-gray-600" };
    }
  };

  const btnConfig = getSubmitButtonConfig();

  const getCustomizationKey = (c?: { removed?: string[]; addons?: { name: string; price: number }[]; meatPoint?: string }) =>
    c ? JSON.stringify(c) : "default";

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
    <main className="bg-background min-h-screen pb-8">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
          🛒 Carrinho ({itemCount} {itemCount === 1 ? "item" : "itens"})
        </h1>

        {/* Cart Items */}
        <div className="space-y-3 mb-8">
          {items.map((item) => {
            const key = `${item.id}-${getCustomizationKey(item.customization)}`;
            const addonsTotal = item.customization?.addons?.reduce((s, a) => s + a.price, 0) || 0;
            const unitPrice = item.price + addonsTotal;
            return (
              <div key={key} className="bg-card rounded-xl border border-border p-4 flex items-start gap-4">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground truncate">{item.name}</h3>
                  {item.customization?.removed?.length ? (
                    <p className="text-xs text-muted-foreground">❌ Sem: {item.customization.removed.join(", ")}</p>
                  ) : null}
                  {item.customization?.addons?.length ? (
                    <p className="text-xs text-muted-foreground">
                      ➕ {item.customization.addons.map((a) => `${a.name}${a.price > 0 ? ` (+€${a.price.toFixed(2)})` : ""}`).join(", ")}
                    </p>
                  ) : null}
                  {item.customization?.meatPoint && (
                    <p className="text-xs text-muted-foreground">🥩 {item.customization.meatPoint}</p>
                  )}
                  <p className="font-body text-sm text-primary font-semibold mt-1">€{(unitPrice * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity - 1, getCustomizationKey(item.customization))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-body text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity + 1, getCustomizationKey(item.customization))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(item.id, getCustomizationKey(item.customization))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Customer Info + Delivery */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">📋 Dados do Cliente</h2>
              <div>
                <Label htmlFor="name" className="font-body">Nome *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                  maxLength={100}
                />
                {errors.customerName && <p className="text-xs text-destructive mt-1">{errors.customerName}</p>}
              </div>
              <div>
                <Label htmlFor="phone" className="font-body">Telefone *</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+351 912 345 678"
                  maxLength={20}
                />
                {errors.customerPhone && <p className="text-xs text-destructive mt-1">{errors.customerPhone}</p>}
              </div>
            </div>

            {/* Delivery Mode */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">📦 Modo de Entrega</h2>
              <div className="flex gap-3">
                <Button
                  variant={deliveryMode === "delivery" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => { setDeliveryMode("delivery"); resetDeliveryCalculation(); }}
                >
                  🚚 Entrega
                </Button>
                <Button
                  variant={deliveryMode === "pickup" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => { setDeliveryMode("pickup"); resetDeliveryCalculation(); }}
                >
                  🏪 Retirada
                </Button>
              </div>

              {deliveryMode === "delivery" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="address" className="font-body">Morada</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => { setAddress(e.target.value); resetDeliveryCalculation(); }}
                      placeholder="Rua, número, andar..."
                      maxLength={200}
                    />
                    {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <Label htmlFor="postalCode" className="font-body">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => { setPostalCode(e.target.value); resetDeliveryCalculation(); }}
                      placeholder="4810-647"
                      maxLength={8}
                    />
                    {errors.postalCode && <p className="text-xs text-destructive mt-1">{errors.postalCode}</p>}
                  </div>
                  <DeliveryFeeCalculator
                    address={address}
                    postalCode={postalCode}
                    onFeeCalculated={(fee, distance) => {
                      setDeliveryFee(fee, distance);
                      setDeliveryNeedsConsultation(false);
                    }}
                    onConsultRequired={(distance) => {
                      setDeliveryNeedsConsultation(true);
                      clearDeliveryFee();
                    }}
                    currentFee={deliveryFee > 0 ? deliveryFee : null}
                    currentDistance={deliveryDistance}
                  />
                  {errors.delivery && <p className="text-xs text-destructive mt-1">{errors.delivery}</p>}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">📝 Observações</h2>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Alguma observação? (opcional)"
                maxLength={500}
                rows={3}
              />
              {errors.orderNotes && <p className="text-xs text-destructive mt-1">{errors.orderNotes}</p>}
            </div>
          </div>

          {/* Right: Payment + Summary */}
          <div className="space-y-6">
            {/* Payment Method */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">💳 Método de Pagamento</h2>
              <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
            </div>

            {/* MB WAY Instructions */}
            {mbwayOrderCreated && paymentMethod === "mbway" && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-5 space-y-3">
                <h3 className="font-display text-lg font-semibold text-green-800 dark:text-green-200">
                  📱 Pedido Criado — Pague via MB WAY
                </h3>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <p>📞 Envie o pagamento para: <strong>+351 930 580 520</strong></p>
                  <p>💰 Valor: <strong>€{total.toFixed(2)}</strong></p>
                  {mbwayOrderId && (
                    <p>📋 Referência: <strong>{mbwayOrderId.slice(0, 8).toUpperCase()}</strong></p>
                  )}
                  <p className="text-xs mt-2 opacity-80">
                    Após efetuar o pagamento, envie o comprovativo via WhatsApp.
                  </p>
                </div>
                <Button
                  className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `✅ Comprovativo MB WAY\n\nPedido: ${mbwayOrderId?.slice(0, 8).toUpperCase()}\nValor: €${total.toFixed(2)}\nNome: ${customerName}`
                    );
                    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
                  }}
                >
                  📤 Enviar Comprovativo via WhatsApp
                </Button>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">🧾 Resumo</h2>
              <div className="space-y-2 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de serviço</span>
                  <span className="text-foreground">€{serviceFee.toFixed(2)}</span>
                </div>
                {deliveryMode === "delivery" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span className="text-foreground">
                      {deliveryNeedsConsultation
                        ? "Consultar"
                        : deliveryFee > 0
                          ? `€${deliveryFee.toFixed(2)}`
                          : "—"}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="text-primary">€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            {!mbwayOrderCreated && (
              <Button
                className={`w-full text-white font-body text-lg py-6 ${btnConfig.color}`}
                onClick={handleSubmitOrder}
                disabled={sending}
              >
                {sending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <btnConfig.icon className="mr-2 h-5 w-5" />
                )}
                {sending ? "A processar..." : btnConfig.text}
              </Button>
            )}

            <Link to="/cardapio" className="block text-center">
              <Button variant="ghost" className="font-body text-muted-foreground">
                ← Continuar a comprar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
