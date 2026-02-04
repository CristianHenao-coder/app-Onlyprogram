import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateLink() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [result, setResult] = useState<{ available: boolean; price: string; domain: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;
    
    setIsSearching(true);
    setResult(null);
    setShowOptions(false);
    
    // Simulation of availability check
    setTimeout(() => {
      const isAvailable = !domain.includes('google') && !domain.includes('facebook');
      setResult({
        domain: domain.includes('.') ? domain : `${domain}.com`,
        available: isAvailable,
        price: isAvailable ? '$12.00 / año' : '',
      });
      setIsSearching(false);
    }, 1200);
  };

  const handleSelection = () => {
    setShowOptions(true); // After selecting domain, show "Manual vs Managed"
  };

  if (showOptions && result) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">¿Cómo quieres configurar tu link?</h1>
          <p className="text-silver/60">Dominio seleccionado: <span className="text-primary font-mono">{result.domain}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
           {/* Managed Option */}
           <div className="bg-primary/10 border-2 border-primary/30 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-6 hover:bg-primary/20 transition-all group lg:scale-105 shadow-2xl shadow-primary/10">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50 group-hover:rotate-12 transition-transform">
                 <span className="material-symbols-outlined text-4xl text-white">auto_awesome</span>
              </div>
              <div className="space-y-4 flex-1">
                 <h3 className="text-2xl font-black text-white">Deja que hagamos todo por ti</h3>
                 <p className="text-silver/70 leading-relaxed font-medium">
                    Ideal si no sabes de DNS o Cloudflare. Nosotros registramos, configuramos la seguridad y te entregamos el link listo.
                 </p>
                 <div className="bg-white/10 px-4 py-2 rounded-xl inline-block">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Recomendado</span>
                 </div>
              </div>
              <button 
                onClick={() => navigate('/dashboard/support', { state: { domain: result.domain, type: 'managed' } })}
                className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-silver transition-all transform group-active:scale-95 shadow-xl shadow-white/5"
              >
                Comienza Ahora
              </button>
           </div>

           {/* Manual Option */}
           <div className="bg-surface/50 border border-border rounded-[2rem] p-8 flex flex-col items-center text-center space-y-6 hover:border-silver/30 transition-all group">
              <div className="h-16 w-16 rounded-full bg-surface border border-border flex items-center justify-center group-hover:bg-white/5 transition-colors">
                 <span className="material-symbols-outlined text-3xl text-silver/40">settings_wrench</span>
              </div>
              <div className="space-y-4 flex-1">
                 <h3 className="text-xl font-bold text-white uppercase tracking-tight">Gestionar yo mismo</h3>
                 <p className="text-silver/60 text-sm leading-relaxed">
                    Usa tu propia cuenta de registrador y configura los DNS manualmente. Para usuarios avanzados.
                 </p>
                 <ul className="text-[10px] text-silver/40 space-y-1 text-left mx-auto max-w-[180px]">
                    <li className="flex items-center gap-2 font-bold"><span className="material-symbols-outlined text-[12px] text-green-500">check</span> Propio control DNS</li>
                    <li className="flex items-center gap-2 font-bold"><span className="material-symbols-outlined text-[12px] text-green-500">check</span> Configuración manual</li>
                 </ul>
              </div>
              <button 
                onClick={() => navigate('/dashboard/links/new/configure', { state: { domain: result.domain } })}
                className="w-full bg-surface border border-border text-white font-bold py-4 rounded-2xl hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
              >
                Configurar Manualmente
              </button>
           </div>
        </div>

        <button 
          onClick={() => setShowOptions(false)}
          className="mx-auto mt-8 block text-silver/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 group"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span> Volver a la búsqueda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight">Adquiere tu nuevo dominio</h1>
        <p className="text-silver/60 font-medium">Cada link protegido necesita su propia identidad profesional.</p>
      </div>

      <div className="bg-surface/50 border border-border rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>

        <form onSubmit={handleSearch} className="space-y-8">
          <div className="relative group">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value.toLowerCase())}
              placeholder="ej: mi-marca-personal.com"
              className="w-full bg-background-dark/30 border-2 border-border/50 rounded-2xl px-6 py-5 text-xl text-white focus:outline-none focus:border-primary transition-all pr-36 placeholder:text-silver/20 font-bold"
            />
            <button
              type="submit"
              disabled={isSearching || !domain}
              className="absolute right-2.5 top-2.5 bottom-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-8 rounded-xl font-black transition-all flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95"
            >
              {isSearching ? (
                <span className="animate-spin material-symbols-outlined font-black">progress_activity</span>
              ) : (
                'Buscar'
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center">
            {['.com', '.net', '.org', '.vip', '.xyz'].map(ext => (
              <button 
                key={ext}
                type="button"
                onClick={() => setDomain(d => d.split('.')[0] + ext)}
                className="px-5 py-2.5 rounded-xl bg-surface/50 border border-border/50 text-xs font-black text-silver/60 hover:text-white hover:border-silver/40 transition-all font-mono hover:scale-110 active:scale-95 hover:bg-surface"
              >
                {ext}
              </button>
            ))}
          </div>
        </form>

        {/* Search Result */}
        {result && (
          <div className={`mt-10 p-8 rounded-[2rem] border-2 animate-slide-up ${
            result.available 
              ? 'bg-green-500/5 border-green-500/10' 
              : 'bg-red-500/5 border-red-500/10'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border-2 shadow-inner ${
                  result.available ? 'border-green-500/30 text-green-400 bg-green-400/5' : 'border-red-500/30 text-red-400 bg-red-400/5'
                }`}>
                  <span className="material-symbols-outlined text-3xl font-bold">
                    {result.available ? 'verified' : 'error'}
                  </span>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white tracking-tight">{result.domain}</h4>
                  <p className={`text-sm font-bold ${result.available ? 'text-green-400/80' : 'text-red-400/80'}`}>
                    {result.available ? '¡Dominio disponible!' : 'Este dominio ya está en uso.'}
                  </p>
                </div>
              </div>
              
              {result.available ? (
                <div className="flex flex-col items-center sm:items-end gap-2">
                  <span className="text-3xl font-black text-white">{result.price}</span>
                  <button 
                    onClick={handleSelection}
                    className="bg-white text-black hover:bg-silver font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-white/5 transform hover:scale-105 active:scale-95 text-lg"
                  >
                    Seleccionar
                  </button>
                </div>
              ) : (
                <button className="text-silver/40 hover:text-white transition-colors text-sm font-black underline underline-offset-8">
                  Ver alternativas
                </button>
              )}
            </div>
          </div>
        )}

        {/* Support Section */}
        <div className="mt-12 pt-8 border-t border-border/30">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-surface-light/30 p-6 rounded-[1.5rem] border border-white/5">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-xl bg-background-dark/50 border border-border flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-primary text-2xl font-bold">support_agent</span>
                 </div>
                 <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">¿Tienes dudas?</p>
                    <p className="text-xs text-silver/60 font-medium">Hacemos todo el trabajo técnico por ti sin costo extra.</p>
                 </div>
              </div>
              <button 
                onClick={() => navigate('/dashboard/support')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-border text-silver hover:text-white hover:border-white/10 hover:bg-white/5 transition-all text-xs font-black uppercase tracking-widest active:scale-95"
              >
                Hablar con Soporte
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
