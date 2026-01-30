import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-background-dark pt-20 pb-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 overflow-hidden rounded">
                <img 
                  src="/src/assets/logo.png" 
                  alt="Only Program Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-lg font-bold text-white uppercase">
                Only <span className="text-primary text-sm">Program</span>
              </span>
            </div>
            <p className="text-sm text-silver/50 mb-6 leading-relaxed">
              La solución definitiva en ciberseguridad para creadores de contenido modernos que valoran su privacidad e ingresos.
            </p>
            <div className="flex gap-4">
              <a className="text-silver/40 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined">mail</span>
              </a>
              <a className="text-silver/40 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined">language</span>
              </a>
              <a className="text-silver/40 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined">support_agent</span>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Plataforma</h4>
            <ul className="space-y-3 text-sm text-silver/60">
              <li><Link className="hover:text-primary transition-colors" to="/">Cómo funciona</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/">Generador de Links</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/">Guía de Seguridad</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/">Docs de API</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Compañía</h4>
            <ul className="space-y-3 text-sm text-silver/60">
              <li><Link className="hover:text-primary transition-colors" to="/">Sobre Nosotros</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/">Carreras</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/">Privacidad</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/">Términos</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Mantente al día</h4>
            <form className="flex gap-2">
              <input
                className="bg-surface border border-border rounded-lg px-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none text-white"
                placeholder="Email"
                type="email"
              />
              <button className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-colors">
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-silver/30">© 2024 Only Program. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-xs text-silver/30">
            Desarrollado por{' '}
            <span className="font-bold flex items-center gap-1 text-silver/60 uppercase">
              <span className="material-symbols-outlined text-sm">code</span> Cybercore Systems
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
