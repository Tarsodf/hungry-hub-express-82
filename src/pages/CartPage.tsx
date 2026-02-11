import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CartPage = () => {
  const {
    items, removeItem, updateQuantity, total, itemCount,
    deliveryMode, setDeliveryMode, address, setAddress,
    orderNotes, setOrderNotes,
  } = useCart();

  if (items.length === 0) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground">Carrinho Vazio</h1>
        <p className="mt-2 text-muted-foreground font-body">Adicione itens do cardápio para começar.</p>
        <Link to="/cardapio" className="mt-6">
          <Button className="bg-primary text-primary-foreground">Ver Cardápio</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-foreground text-center">Carrinho</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="flex items-center gap-4 p-4 border-border bg-card">
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-card-foreground">{item.name}</h3>
                  <p className="font-body text-sm text-accent font-bold">€{item.price.toFixed(2)}</p>
                  {item.customization?.removed && item.customization.removed.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Sem: {item.customization.removed.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-body font-bold text-foreground">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="font-body font-bold text-foreground w-20 text-right">
                  €{(item.price * item.quantity).toFixed(2)}
                </span>
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive/80">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>

          {/* Order summary */}
          <div>
            <Card className="p-6 border-border bg-card sticky top-24">
              <h2 className="font-display text-xl font-bold text-card-foreground">Resumo do Pedido</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <Label className="font-body font-semibold text-card-foreground">Modo de recebimento</Label>
                  <RadioGroup value={deliveryMode} onValueChange={(v) => setDeliveryMode(v as "delivery" | "pickup")} className="mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="font-body">Entrega ao domicílio</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="font-body">Retirada no local</Label>
                    </div>
                  </RadioGroup>
                </div>

                {deliveryMode === "delivery" && (
                  <div>
                    <Label htmlFor="address" className="font-body font-semibold text-card-foreground">Endereço de entrega</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, número, andar..."
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes" className="font-body font-semibold text-card-foreground">Observações</Label>
                  <Textarea
                    id="notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Alguma observação para o pedido?"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4 space-y-2">
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>Subtotal ({itemCount} itens)</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-display text-lg font-bold text-card-foreground">
                  <span>Total</span>
                  <span className="text-accent">€{total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="mt-6 w-full bg-warm-gold text-warm-brown-dark font-body font-bold uppercase tracking-wider hover:bg-warm-gold/90 py-6">
                Finalizar Pedido
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
