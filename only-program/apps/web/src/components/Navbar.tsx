import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-border glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-lg">
              <img 
                src="/src/assets/logo.png" 
                alt="Only Program Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase">
              Only <span className="text-primary text-sm">Program</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a className="text-sm font-medium hover:text-primary transition-colors text-silver/80" href="#home">
              Inicio
            </a>
            <a className="text-sm font-medium hover:text-primary transition-colors text-silver/80" href="#features">
              Funciones
            </a>
            <a className="text-sm font-medium hover:text-primary transition-colors text-silver/80" href="#testimonials">
              Testimonios
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-xs font-semibold text-silver/70 border border-border px-3 py-2 rounded-lg hover:border-primary/50 transition-all">
                <span className="material-symbols-outlined text-sm">language</span>
                Español
                <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-surface border border-border rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-1">
                  <button className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 rounded-lg transition-colors">
                    Español
                  </button>
                  <button className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 rounded-lg transition-colors text-silver/60">
                    English
                  </button>
                  <button className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 rounded-lg transition-colors text-silver/60">
                    Français
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <Link
              to="/login"
              className="text-sm font-semibold text-silver/70 hover:text-primary transition-colors"
            >
              Iniciar Sesión
            </Link>

            {/* Sign Up Button */}
            <Link
              to="/login"
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-primary/25 text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Crear Cuenta
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
