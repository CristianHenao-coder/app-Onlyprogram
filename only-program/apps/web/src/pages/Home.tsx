import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="scroll-smooth dark">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" id="home">
          <div className="hero-gradient absolute inset-0 -z-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Seguridad de Próxima Generación para Creadores
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-[1.1] animate-slide-up">
              Detén las filtraciones. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Protege tus links.
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-silver/80 mb-10 leading-relaxed animate-fade-in">
              Detección automática de bots y tecnología anti-leach para tu contenido premium. Genera pasarelas seguras y
              encriptadas que verifican a cada visitante.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up">
              <Link
                to="/login"
                className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2 hover:scale-105 transform"
              >
                Asegura tu cuenta
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
              <button className="bg-surface border border-border px-8 py-4 rounded-xl font-bold text-lg transition-all hover:border-primary/50 flex items-center justify-center gap-2 text-white hover:scale-105 transform">
                Ver Demo
              </button>
            </div>
          </div>
        </section>

        {/* Screenshots Gallery */}
        <section className="py-12 bg-surface/30">
          <div className="max-w-7xl mx-auto px-4 overflow-hidden">
            <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar snap-x">
              <div className="flex-none w-[350px] md:w-[600px] aspect-video bg-surface border border-border rounded-2xl overflow-hidden snap-center group">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <span className="text-silver/40 text-sm">Vista previa del panel</span>
                </div>
              </div>
              <div className="flex-none w-[350px] md:w-[600px] aspect-video bg-surface border border-border rounded-2xl overflow-hidden snap-center group">
                <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <span className="text-silver/40 text-sm">Ajustes de seguridad</span>
                </div>
              </div>
              <div className="flex-none w-[350px] md:w-[600px] aspect-video bg-surface border border-border rounded-2xl overflow-hidden snap-center group">
                <div className="w-full h-full bg-gradient-to-br from-cyan/20 to-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <span className="text-silver/40 text-sm">Analíticas de datos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="animate-fade-in">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Monitoreo de Seguridad en Tiempo Real
                </h2>
                <p className="text-silver/70 mb-8 leading-relaxed">
                  Nuestro panel de control te otorga el dominio absoluto sobre quién accede a tu contenido. Monitorea el
                  tráfico entrante, bloquea IPs sospechosas al instante y recibe notificaciones de brechas potenciales.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">verified</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white">Encriptación de Grado Militar</span>
                      <p className="text-sm text-silver/50">Protección de extremo a extremo para cada enlace generado.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">shield</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white">Escudo Inteligente contra Bots</span>
                      <p className="text-sm text-silver/50">
                        Identifica y bloquea el 99.9% de los bots de scraping automáticamente.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Live Dashboard Preview */}
              <div className="relative animate-fade-in">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-2xl rounded-3xl -z-10"></div>
                <div className="bg-[#0F1012] border border-border rounded-2xl overflow-hidden shadow-2xl relative">
                  <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="ml-4 text-xs font-mono text-silver/40 uppercase tracking-widest">
                        Enlaces Seguros Activos
                      </span>
                    </div>
                    <span className="text-xs font-mono text-primary animate-pulse">● ESTADO EN VIVO</span>
                  </div>
                  <div className="p-6 space-y-4 font-mono">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-green-500 text-sm">lock</span>
                        <div className="flex flex-col">
                          <span className="text-xs text-white">LNK-8921-XPR</span>
                          <span className="text-[10px] text-silver/40">Creado: hace 2m</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                          AES-256
                        </span>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse-glow"></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
                        <div className="flex flex-col">
                          <span className="text-xs text-white">LNK-4412-VFY</span>
                          <span className="text-[10px] text-silver/40">Creado: hace 15m</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/30">
                          BOT-SHIELD
                        </span>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse-glow"></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-yellow-500 text-sm">warning</span>
                        <div className="flex flex-col">
                          <span className="text-xs text-white">LNK-9011-BOT</span>
                          <span className="text-[10px] text-silver/40">Intento Bloqueado: 1s</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/30">
                          DENEGADO
                        </span>
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse-glow"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-surface/10" id="testimonials">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Confiado por Creadores Top</h2>
              <p className="text-silver/60">Casos de éxito de nuestra comunidad global que prioriza la privacidad.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-surface border border-border p-6 rounded-2xl hover:border-primary/30 transition-all hover:scale-105 transform">
                <div className="aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg mb-6 relative overflow-hidden group cursor-pointer border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-white group-hover:scale-110 transition-transform">
                      play_circle
                    </span>
                  </div>
                </div>
                <p className="text-silver/80 italic mb-6">
                  "Desde que uso Only Program, las filtraciones de mi contenido han desaparecido por completo. La protección
                  contra bots es simplemente la mejor del mercado."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    AL
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Alana López</h4>
                    <p className="text-xs text-silver/40">Creadora Premium</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-surface border border-border p-6 rounded-2xl hover:border-primary/30 transition-all hover:scale-105 transform">
                <div className="aspect-video bg-gradient-to-br from-cyan/20 to-blue-500/20 rounded-lg mb-6 relative overflow-hidden group cursor-pointer border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-white group-hover:scale-110 transition-transform">
                      play_circle
                    </span>
                  </div>
                </div>
                <p className="text-silver/80 italic mb-6">
                  "La tranquilidad de saber que mis links están encriptados no tiene precio. El sistema detecta cualquier
                  intento de copia ilegal antes de que suceda."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                    MC
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Marco Castro</h4>
                    <p className="text-xs text-silver/40">Director de Agencia</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-surface border border-border p-6 rounded-2xl hover:border-primary/30 transition-all hover:scale-105 transform">
                <div className="aspect-video bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg mb-6 relative overflow-hidden group cursor-pointer border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-white group-hover:scale-110 transition-transform">
                      play_circle
                    </span>
                  </div>
                </div>
                <p className="text-silver/80 italic mb-6">
                  "Privacidad absoluta. Mis seguidores acceden de forma segura y yo mantengo mis ingresos protegidos de
                  raspadores automáticos."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    VR
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Valeria Ruiz</h4>
                    <p className="text-xs text-silver/40">Artista Independiente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="py-16 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-silver/40 mb-10">
              Opciones de Pago Seguras Aceptadas
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="material-symbols-outlined text-4xl hover:text-primary transition-colors">credit_card</span>
              <span className="material-symbols-outlined text-4xl hover:text-primary transition-colors">
                currency_bitcoin
              </span>
              <span className="material-symbols-outlined text-4xl hover:text-primary transition-colors">payments</span>
              <span className="material-symbols-outlined text-4xl hover:text-primary transition-colors">
                account_balance
              </span>
              <div className="flex items-center gap-1 font-bold text-2xl text-white hover:text-primary transition-colors">
                <span className="material-symbols-outlined">contactless</span> Pay
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
