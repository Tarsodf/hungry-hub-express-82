import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Shield } from "lucide-react";
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
    { to: "/reserva", label: "Reservas" },
    { to: "/carrinho", label: "Carrinho" },
  ];

  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-sm md:text-lg font-bold text-primary-foreground">🔥</span>
          </div>
          <div className="min-w-0">
            <span className="font-display text-base md:text-xl font-bold text-foreground block truncate">Dom Bistro Grill</span>
            <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-muted-foreground">Brasileiro • Guimarães</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-body text-sm font-medium tracking-wide transition-colors hover:text-primary ${
                location.pathname === link.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/carrinho" className="relative">
            <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            {itemCount > 0 && (
              <span className="badge-pulse absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
          <Link to="/admin/login">
            <Shield className="h-4 w-4 text-muted-foreground/50 hover:text-primary transition-colors" />
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <Link to="/carrinho" className="relative">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            {itemCount > 0 && (
              <span className="badge-pulse absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-foreground">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-border glass px-4 pb-4 md:hidden animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3 font-body text-sm tracking-wide transition-colors hover:text-primary ${
                location.pathname === link.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/admin/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-3 font-body text-sm text-muted-foreground/50 tracking-wide"
          >
            Área Admin
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
