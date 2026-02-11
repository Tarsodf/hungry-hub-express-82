import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/cardapio", label: "Cardápio" },
    { to: "/carrinho", label: "Carrinho" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-warm-brown-dark text-primary-foreground shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-2xl font-bold tracking-wide text-warm-gold">
          Dom Bistro Grill
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-body text-sm font-medium tracking-wide uppercase transition-colors hover:text-warm-gold ${
                location.pathname === link.to ? "text-warm-gold" : "text-warm-cream"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/carrinho" className="relative">
            <ShoppingCart className="h-6 w-6 text-warm-cream hover:text-warm-gold transition-colors" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-warm-gold text-xs font-bold text-warm-brown-dark">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <Link to="/carrinho" className="relative">
            <ShoppingCart className="h-6 w-6 text-warm-cream" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-warm-gold text-xs font-bold text-warm-brown-dark">
                {itemCount}
              </span>
            )}
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6 text-warm-cream" /> : <Menu className="h-6 w-6 text-warm-cream" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-warm-burgundy bg-warm-brown-dark px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3 font-body text-sm uppercase tracking-wide transition-colors hover:text-warm-gold ${
                location.pathname === link.to ? "text-warm-gold" : "text-warm-cream"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
