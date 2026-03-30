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
      case "card":
        return "💳 Cartão (Crédito/Débito)";
      case "mbway":
        return "📱 MB WAY";
      case "multibanco":
        return "🏧 Multibanco";
      case "cash":
        return "💵 Dinheiro na entrega";
      default:
        return "";
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

    const { data, error } = await supabase.functions.invoke("cria-finalização-de-compra", { body: payload });
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

      if (paymentMethod === "card" || paymentMethod === "multibanco" || paymentMethod === "mbway") {
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
          "cria-finalização-de-compra",
          { body: checkoutPayload },
        );

        if (checkoutError) throw checkoutError;
        if (checkoutData?.error) throw new Error(checkoutData.error);

        if (paymentMethod === "mbway") {
          setMbwayOrderId(checkoutData?.order_id || null);
          setMbwayOrderCreated(true);
          toast.success("Pedido criado! Efetue o pagamento via MB WAY.");
        } else if (checkoutData?.url) {
          clearCart();
          window.location.href = checkoutData.url;
          return;
        }
      } else if (paymentMethod === "cash") {
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
      default:
        return { icon: Send, text: "Confirmar Pedido", color: "bg-gray-500 hover:bg-gray-600" };
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
      {/* ... restante do layout do CartPage ... */}
      {/* O resto do JSX permanece igual ao código anterior, sem necessidade de alterações */}
    </main>
  );
};

export default CartPage;
