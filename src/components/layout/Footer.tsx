const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg">🔥</span>
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">Dom Bistro Grill</h3>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            Rua de Santa Maria, 123 · 4810-445 Guimarães, Portugal · +351 930 580 520
          </p>
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dom Bistro Grill — Guimarães, Portugal. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
