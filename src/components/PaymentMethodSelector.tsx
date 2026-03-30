import { CreditCard, Smartphone, Landmark, Banknote } from "lucide-react";

export type PaymentMethod = "card" | "mbway" | "multibanco" | "cash";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const methods = [
  { id: "card" as const, label: "Cartão", icon: CreditCard, desc: "Crédito / Débito" },
  { id: "mbway" as const, label: "MB WAY", icon: Smartphone, desc: "Pagamento móvel" },
  { id: "multibanco" as const, label: "Multibanco", icon: Landmark, desc: "Referência MB" },
  { id: "cash" as const, label: "Dinheiro", icon: Banknote, desc: "Pagar na entrega" },
];

const PaymentMethodSelector = ({ selected, onSelect }: PaymentMethodSelectorProps) => {
  return (
    <div>
      <p className="font-body text-sm text-muted-foreground mb-2">Método de pagamento *</p>
      <div className="grid grid-cols-2 gap-2">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={`flex flex-col items-center gap-1 rounded-lg p-3 text-center transition-all border ${
              selected === m.id
                ? "bg-primary/10 border-primary text-primary"
                : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <m.icon className="h-5 w-5" />
            <span className="font-body text-xs font-semibold">{m.label}</span>
            <span className="font-body text-[10px] opacity-70">{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
