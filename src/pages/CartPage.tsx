const handleSubmitOrder = async () => {
  if (!validate()) return;
  setSending(true);

  try {
    if (paymentMethod === "card" || paymentMethod === "multibanco") {
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

      // ✅ ALTERADO AQUI
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke("create-order", {
        body: checkoutPayload,
      });

      if (checkoutError) throw checkoutError;
      if (checkoutData?.error) throw new Error(checkoutData.error);

      // ⚠️ só funciona se create-order retornar { url }
      if (checkoutData?.url) {
        clearCart();
        window.location.href = checkoutData.url;
        return;
      } else {
        throw new Error("Stripe URL não retornada pela função create-order");
      }
    } else if (paymentMethod === "mbway") {
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
