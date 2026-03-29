import { Label } from "@/components/ui/label";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category_id?: string;
  menu_categories?: { name: string; id: string };
}

interface ExecutivoExtrasProps {
  isWeekday: boolean;
  drinks: MenuItem[];
  desserts: MenuItem[];
  selectedDrink: string;
  selectedDessert: string;
  onDrinkChange: (name: string) => void;
  onDessertChange: (name: string) => void;
}

const ExecutivoExtras = ({
  isWeekday,
  drinks,
  desserts,
  selectedDrink,
  selectedDessert,
  onDrinkChange,
  onDessertChange,
}: ExecutivoExtrasProps) => {
  return (
    <>
      {/* Drink selection */}
      <div className="glass rounded-lg p-4">
        <Label className="font-body font-semibold text-sm text-foreground flex items-center gap-2">
          🥤 {isWeekday ? "Escolha sua Bebida (incluída)" : "Adicionar Bebida (extra)"}
        </Label>
        <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
          {isWeekday && (
            <button
              onClick={() => onDrinkChange("")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 font-body text-sm transition-all ${
                selectedDrink === ""
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Sem bebida</span>
            </button>
          )}
          {drinks.map((drink) => (
            <button
              key={drink.id}
              onClick={() => onDrinkChange(selectedDrink === drink.name ? "" : drink.name)}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 font-body text-sm transition-all ${
                selectedDrink === drink.name
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{drink.name}</span>
              {isWeekday ? (
                <span className="text-xs font-semibold text-green-500">Incluído</span>
              ) : (
                <span className="font-semibold text-primary">+€{Number(drink.price).toFixed(2)}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dessert selection */}
      <div className="glass rounded-lg p-4">
        <Label className="font-body font-semibold text-sm text-foreground flex items-center gap-2">
          🍰 {isWeekday ? "Escolha sua Sobremesa (incluída)" : "Adicionar Sobremesa (extra)"}
        </Label>
        <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
          {isWeekday && (
            <button
              onClick={() => onDessertChange("")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 font-body text-sm transition-all ${
                selectedDessert === ""
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Sem sobremesa</span>
            </button>
          )}
          {desserts.map((dessert) => (
            <button
              key={dessert.id}
              onClick={() => onDessertChange(selectedDessert === dessert.name ? "" : dessert.name)}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 font-body text-sm transition-all ${
                selectedDessert === dessert.name
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{dessert.name}</span>
              {isWeekday ? (
                <span className="text-xs font-semibold text-green-500">Incluído</span>
              ) : (
                <span className="font-semibold text-primary">+€{Number(dessert.price).toFixed(2)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ExecutivoExtras;
