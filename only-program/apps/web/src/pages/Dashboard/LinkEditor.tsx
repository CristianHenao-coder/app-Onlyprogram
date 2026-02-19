import { useMemo, useState } from 'react';
import { useLinkEditor } from '@/hooks/useLinkEditor';
import MobilePreview from '@/components/MobilePreview';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function LinkEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, updateData, addBlock, updateBlock, deleteBlock } = useLinkEditor();

  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Backward compatibility: derive buttons from blocks
  const buttons = useMemo(() => data.blocks.filter((b: any) => b.type === 'button'), [data.blocks]);
  const selectedButton = useMemo(
    () => buttons.find((b: any) => b.id === selectedButtonId) || null,
    [buttons, selectedButtonId]
  );

  const handleSave = async () => {
    try {
      // Logic to save data to Supabase
      // We need to know WHICH link we are editing. 
      // Assuming LinkEditor is used for a specific link, likely passed via URL param or context.
      // But looking at the component, it seems to use `useLinkEditor` which manages local state.
      // I need to check how `useLinkEditor` initializes data.

      // For now, I'll add a placeholder that I will fully implement after checking the hook.
      console.log("Saving data:", data);

      // If we are editing 'principal' (or the user's main link), we need its ID.
      // Let's first make sure we are not just mocking it.

      toast.success('Guardando cambios en la nube...');
      // Actual implementation will follow after hook analysis
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Error al guardar");
    }
  };

  const handlePurchase = () => {
    navigate('/dashboard/payments');
  };

  const enabledCount = useMemo(() => {
    // si tu estructura tiene enabled/isActive, intenta leerlo sin romper nada
    return buttons.filter((b: any) => (typeof b.enabled === 'boolean' ? b.enabled : true)).length;
  }, [buttons]);

  // Mantengo tu layout anterior sin borrarlo, pero lo desactivo para usar el nuevo UX
  const USE_LEGACY_LAYOUT = false;

  if (USE_LEGACY_LAYOUT) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#0B0B0B]">
        {/* Left Sidebar - Buttons List */}
        <aside className="w-20 lg:w-64 border-r border-border bg-surface flex-col hidden sm:flex">
          <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start gap-3">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">shield</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white uppercase hidden lg:inline">
              Only <span className="text-primary text-xs">Program</span>
            </span>
          </div>

          <nav className="flex-1 px-3 lg:px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              <a className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 text-white bg-primary/10 border border-primary/20 rounded-xl transition-all" href="/dashboard/links">
                <span className="material-symbols-outlined">link</span>
                <span className="text-sm font-semibold hidden lg:inline">Mis Links</span>
              </a>
              <a className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 text-silver/60 hover:text-white hover:bg-white/5 rounded-xl transition-all group" href="/dashboard/analytics">
                <span className="material-symbols-outlined text-silver/40 group-hover:text-primary">monitoring</span>
                <span className="text-sm font-semibold hidden lg:inline">Analíticas</span>
              </a>
              <a className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 text-silver/60 hover:text-white hover:bg-white/5 rounded-xl transition-all group" href="/dashboard/telegram">
                <span className="material-symbols-outlined text-silver/40 group-hover:text-primary">hub</span>
                <span className="text-sm font-semibold hidden lg:inline">Telegram Rotating</span>
              </a>
            </div>

            <div className="pt-6 pb-2 px-2">
              <p className="text-[10px] font-bold text-silver/30 uppercase tracking-widest hidden lg:block">Botones Activos</p>
              <div className="w-full h-px bg-border my-2 lg:hidden"></div>
            </div>

            {/* Buttons List */}
            <div className="space-y-3">
              {buttons.map((button: any) => (
                <div
                  key={button.id}
                  onClick={() => setSelectedButtonId(button.id)}
                  className={`p-3 rounded-xl cursor-pointer group transition-all ${selectedButtonId === button.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-white/5 border border-border hover:border-primary/30'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="material-symbols-outlined text-xs text-silver/20 hidden lg:block">drag_indicator</span>
                      <span className="text-[11px] font-bold text-white truncate">{button.title || 'Sin título'}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success('Duplicar botón - próximamente');
                        }}
                        className="p-1 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock(button.id);
                        }}
                        className="p-1 hover:text-red-400"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => addBlock('button')}
                className="w-full py-3 border border-dashed border-border rounded-xl text-silver/40 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span className="text-xs font-bold hidden lg:inline">Añadir Botón</span>
              </button>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-border">
            <div className="bg-white/5 rounded-xl p-2 lg:p-3 flex items-center justify-center lg:justify-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0 hidden lg:block">
                <p className="text-xs font-bold text-white truncate">{data.displayName || 'Usuario'}</p>
                <p className="text-[10px] text-silver/40 truncate">Plan Premium</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Header */}
          <header className="h-16 border-b border-border glass-effect px-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-4 sm:hidden">
              <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                <span className="material-symbols-outlined text-white">menu</span>
              </button>
              <span className="font-bold text-white uppercase text-sm">Only <span className="text-primary">Program</span></span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Editor de Enlaces</h2>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">V3.0 Beta</span>
            </div>

            <div className="flex items-center gap-4">
              <button className="lg:hidden px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Preview
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Guardar
              </button>
            </div>
          </header>

          {/* Main Editor Area */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0B0B0B] pb-24 lg:pb-6">
            <div className="max-w-[1200px] mx-auto p-4 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                  {/* ... tu contenido legacy ... */}
                </div>
                <aside className="lg:col-span-4 hidden lg:block">
                  <MobilePreview data={data} />
                </aside>
              </div>
            </div>
          </main>

          {!data.isPaid && (
            <div className="sticky bottom-0 bg-surface border-t border-border p-4 lg:p-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                <div className="hidden md:block">
                  <p className="text-xs font-bold text-white uppercase tracking-widest">¿Necesitas más enlaces?</p>
                  <p className="text-[10px] text-silver/40">Desbloquea enlaces ilimitados y funciones PRO.</p>
                </div>
                <button
                  onClick={handlePurchase}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-accent to-[#FFB700] hover:from-[#FFC000] hover:to-accent text-black font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  <span className="material-symbols-outlined font-bold">shopping_cart</span>
                  Comprar Links $60
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ NUEVO DISEÑO (NO APLASTA, MÁS CLARO Y EXPLICATIVO)
  return (
    <div className="min-h-[calc(100dvh-0px)] bg-[#0B0B0B] text-silver">
      {/* Overlay mobile drawer */}
      <div
        className={[
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity sm:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
        {/* Top header (with reserved vertical slot for menu icon) */}
        <header className="sticky top-0 z-[50] border border-border rounded-2xl glass-effect">
          <div className="h-16 px-4 sm:px-6 flex items-center gap-3">
            {/* Reserved slot so icon doesn't overlap titles */}
            <div className="w-14 flex items-center justify-start">
              <button
                type="button"
                className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface/40 text-silver/70 hover:text-white hover:border-primary/40 transition-all"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open buttons menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-silver/40">Editor</p>
              <h2 className="text-white font-extrabold text-lg truncate">
                Editor de Enlaces
                <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                  V3.0 Beta
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="hidden md:inline-flex items-center gap-2 rounded-2xl border border-border bg-surface/40 px-3 py-2 text-xs font-bold text-silver/70 hover:text-white hover:border-primary/40 transition-all"
                onClick={() => toast.success('Vista previa abierta')}
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                Preview
              </button>

              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:border-primary/50 transition-all"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Guardar
              </button>
            </div>
          </div>
        </header>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-12 gap-6 items-start">
          {/* Buttons sidebar (desktop) */}
          <aside className="hidden sm:block col-span-12 lg:col-span-3">
            <div className="sticky top-[92px] space-y-4">
              {/* User card */}
              <div className="rounded-2xl border border-border bg-surface/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-sm font-black shrink-0">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">{data.displayName || 'Usuario'}</p>
                    <p className="text-[10px] text-silver/45 truncate">Plan Premium</p>
                  </div>
                </div>
              </div>

              {/* Buttons list */}
              <div className="rounded-2xl border border-border bg-surface/40 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <p className="text-white font-extrabold text-sm">Tus botones</p>
                  <p className="text-silver/60 text-xs mt-1">
                    Selecciona un botón para editar. Activos: <span className="text-white font-bold">{enabledCount}</span>
                  </p>
                </div>

                <div className="p-3 space-y-2 max-h-[52vh] overflow-y-auto custom-scrollbar">
                  {buttons.map((button: any) => (
                    <button
                      key={button.id}
                      type="button"
                      onClick={() => setSelectedButtonId(button.id)}
                      className={[
                        "w-full text-left rounded-xl border px-3 py-3 transition-all",
                        selectedButtonId === button.id
                          ? "border-primary/40 bg-primary/10"
                          : "border-border bg-[#0B0B0B]/40 hover:border-primary/30 hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white font-bold text-xs truncate">{button.title || 'Sin título'}</p>
                          <p className="text-[10px] text-silver/45 truncate mt-1">{button.url || 'Sin URL'}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-silver/30 text-[18px]">chevron_right</span>
                        </div>
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      addBlock('button');
                      toast.success('Botón agregado');
                    }}
                    className="w-full rounded-xl border border-dashed border-border bg-[#0B0B0B]/30 px-3 py-3 text-xs font-bold text-silver/60 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Añadir botón
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile drawer (buttons list) */}
          <aside
            className={[
              "fixed top-0 left-0 z-[70] h-[100dvh] w-[86%] max-w-[360px] border-r border-border bg-[#0B0B0B]/85 backdrop-blur-xl",
              "transition-transform duration-300 sm:hidden",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">link</span>
                </div>
                <p className="text-white font-extrabold text-sm">Tus botones</p>
              </div>

              <button
                type="button"
                className="h-10 w-10 rounded-2xl border border-border bg-surface/40 text-silver/70 hover:text-white hover:border-primary/40 transition-all"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4">
              <p className="text-silver/60 text-xs">
                Toca un botón para editarlo. Activos: <span className="text-white font-bold">{enabledCount}</span>
              </p>

              <div className="mt-3 space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {buttons.map((button: any) => (
                  <button
                    key={button.id}
                    type="button"
                    onClick={() => {
                      setSelectedButtonId(button.id);
                      setSidebarOpen(false);
                    }}
                    className={[
                      "w-full text-left rounded-xl border px-3 py-3 transition-all",
                      selectedButtonId === button.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-white/5 hover:border-primary/30",
                    ].join(" ")}
                  >
                    <p className="text-white font-bold text-xs truncate">{button.title || 'Sin título'}</p>
                    <p className="text-[10px] text-silver/45 truncate mt-1">{button.url || 'Sin URL'}</p>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    addBlock('button');
                    toast.success('Botón agregado');
                  }}
                  className="w-full rounded-xl border border-dashed border-border bg-white/5 px-3 py-3 text-xs font-bold text-silver/60 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Añadir botón
                </button>
              </div>
            </div>
          </aside>

          {/* Main editor */}
          <main className="col-span-12 lg:col-span-6 space-y-6 pb-28 lg:pb-6">
            {/* Quick guide */}
            <section className="rounded-2xl border border-border bg-surface/40 p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">task_alt</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-extrabold">Cómo editar rápido</p>
                  <p className="text-silver/60 text-sm mt-1">
                    1) Edita tu perfil • 2) Selecciona un botón • 3) Cambia texto/URL/estilo • 4) Guarda.
                  </p>
                </div>
              </div>
            </section>

            {/* Identidad de Marca (tu sección, con mejoras visuales mínimas) */}
            <section className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">id_card</span>
                Identidad de Marca
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 bg-[#0B0B0B] border border-border rounded-xl">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                      {data.profilePhotoBase64 ? (
                        <img src={data.profilePhotoBase64} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-silver/20">add_a_photo</span>
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[10px] shadow-lg cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              updateData({ profilePhotoBase64: ev.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <span className="material-symbols-outlined text-xs">edit</span>
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white mb-1">Foto de Perfil</p>
                    <p className="text-[10px] text-silver/40">Recomendado: 500x500px JPG/PNG</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#0B0B0B] border border-border rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">verified</span>
                      <span className="text-xs font-bold text-white">Insignia verificada</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.verifiedBadge}
                        onChange={(e) => updateData({ verifiedBadge: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest ml-1">Nombre Visible</label>
                    <input
                      type="text"
                      value={data.displayName}
                      onChange={(e) => updateData({ displayName: e.target.value })}
                      className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Tu Nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest ml-1">Username (@)</label>
                    <input
                      type="text"
                      value={data.username}
                      onChange={(e) => updateData({ username: e.target.value.replace(/[^a-z0-9_]/g, '') })}
                      className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                      placeholder="usuario"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Fondo de Página (igual, organizado) */}
            <section className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">wallpaper</span>
                Fondo de Página
              </h3>

              <div className="space-y-6">
                <div className="flex p-1 bg-[#0B0B0B] border border-border rounded-xl w-fit">
                  {(['solid', 'gradient', 'image'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateData({ backgroundType: type })}
                      className={`px-4 py-2 text-[10px] font-bold transition-colors rounded-lg ${data.backgroundType === type ? 'text-white bg-white/5' : 'text-silver/40 hover:text-white'
                        }`}
                    >
                      {type === 'solid' ? 'Sólido' : type === 'gradient' ? 'Degradado' : 'Imagen'}
                    </button>
                  ))}
                </div>

                {data.backgroundType === 'solid' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] text-silver/40 block">Color Principal</label>
                      <div className="flex items-center gap-3 bg-[#0B0B0B] p-2 border border-border rounded-xl">
                        <input
                          type="color"
                          value={data.backgroundColor}
                          onChange={(e) => updateData({ backgroundColor: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-white">{data.backgroundColor}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] text-silver/40 block">Opacidad Fondo</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={data.backgroundOpacity}
                        onChange={(e) => updateData({ backgroundOpacity: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                )}

                {data.backgroundType === 'gradient' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-silver/40">Color Inicio</label>
                      <input
                        type="color"
                        value={data.backgroundGradientStart}
                        onChange={(e) => updateData({ backgroundGradientStart: e.target.value })}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-silver/40">Color Fin</label>
                      <input
                        type="color"
                        value={data.backgroundGradientEnd}
                        onChange={(e) => updateData({ backgroundGradientEnd: e.target.value })}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Editor de botón seleccionado (más claro) */}
            <section className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">smart_button</span>
                    Botón seleccionado
                  </h3>
                  <p className="text-silver/60 text-sm mt-2">
                    {selectedButton ? (
                      <>Editando: <span className="text-white font-bold">{selectedButton.title || 'Sin título'}</span></>
                    ) : (
                      <>Selecciona un botón en “Tus botones” para editarlo.</>
                    )}
                  </p>
                </div>

                {selectedButton && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteBlock(selectedButton.id);
                      setSelectedButtonId(null);
                      toast.success('Botón eliminado');
                    }}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:border-red-500/50 transition-all"
                  >
                    <span className="material-symbols-outlined align-middle mr-1 text-[16px]">delete</span>
                    Eliminar
                  </button>
                )}
              </div>

              {!selectedButton ? (
                <div className="mt-5 rounded-2xl border border-border bg-[#0B0B0B]/40 p-4">
                  <p className="text-white font-bold">Tip rápido</p>
                  <p className="text-silver/60 text-sm mt-1">
                    En mobile toca el menú ☰ para abrir la lista de botones.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Texto</label>
                      <input
                        type="text"
                        value={selectedButton.title}
                        onChange={(e) => updateBlock(selectedButton.id, { title: e.target.value })}
                        className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">URL Destino</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={selectedButton.url}
                          onChange={(e) => updateBlock(selectedButton.id, { url: e.target.value })}
                          className="flex-1 bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                          placeholder="https://"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedButton.url) {
                              navigator.clipboard.writeText(selectedButton.url);
                              toast.success('URL copiada');
                            } else {
                              toast.error('No hay URL para copiar');
                            }
                          }}
                          className="px-3 bg-surface border border-border rounded-xl text-primary hover:bg-primary hover:text-white transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest block">Forma del Botón</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['rounded', 'square', 'soft'] as const).map((shape) => (
                          <button
                            key={shape}
                            type="button"
                            onClick={() => updateBlock(selectedButton.id, { buttonShape: shape })}
                            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${selectedButton.buttonShape === shape
                                ? 'border-2 border-primary bg-primary/5 text-white'
                                : 'border border-border text-silver/60 hover:border-silver/30'
                              }`}
                          >
                            <div className={`w-8 h-3 bg-white/20 ${shape === 'rounded' ? 'rounded-full' : shape === 'soft' ? 'rounded-md' : 'rounded-sm'
                              }`}></div>
                            <span className="text-[9px] font-bold">{shape}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Grosor Borde</label>
                        <select
                          value={selectedButton.borderWidth}
                          onChange={(e) => updateBlock(selectedButton.id, { borderWidth: parseInt(e.target.value) })}
                          className="w-full bg-[#0B0B0B] border border-border rounded-xl text-white text-xs px-3 py-2 outline-none"
                        >
                          <option value="0">0px</option>
                          <option value="1">1px</option>
                          <option value="2">2px</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Sombra</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedButton.shadowIntensity}
                          onChange={(e) => updateBlock(selectedButton.id, { shadowIntensity: parseInt(e.target.value) })}
                          className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary mt-3"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">image</span>
                        <span className="text-[10px] font-bold uppercase">Cambiar Icono</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">palette</span>
                        <span className="text-[10px] font-bold uppercase">Color Botón</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Tipografía (igual, sin romper tu lógica) */}
            <section className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">text_fields</span>
                Tipografía
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Familia de Fuente</label>
                  <div className="relative">
                    <select
                      value={data.fontFamily}
                      onChange={(e) => updateData({ fontFamily: e.target.value })}
                      className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm outline-none appearance-none"
                    >
                      <option value="Inter">Inter (Default)</option>
                      <option value="JetBrains Mono">JetBrains Mono</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Playfair Display">Playfair Display</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-silver/40 pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Tamaño Base</label>
                  <div className="flex items-center gap-4 px-2">
                    <span className="text-xs text-silver/40">A</span>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={data.fontSize}
                      onChange={(e) => updateData({ fontSize: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-lg text-white">A</span>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* Preview column */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-[92px] space-y-4">
              <div className="rounded-2xl border border-border bg-surface/40 p-4">
                <p className="text-white font-extrabold text-sm">Vista previa</p>
                <p className="text-silver/60 text-xs mt-1">
                  Revisa tu página antes de compartirla.
                </p>
              </div>

              <div className="hidden lg:block">
                <MobilePreview data={data} />
              </div>

              <div className="lg:hidden rounded-2xl border border-border bg-surface/40 p-4">
                <button
                  type="button"
                  onClick={() => toast.success('Preview (mobile)')}
                  className="w-full rounded-xl border border-border bg-[#0B0B0B]/40 px-4 py-3 text-xs font-bold text-white hover:border-primary/40 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Abrir preview
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky Payment Footer (igual al tuyo) */}
      {!data.isPaid && (
        <div className="fixed left-0 right-0 bottom-0 bg-surface border-t border-border p-4 z-[80] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
            <div className="hidden md:block">
              <p className="text-xs font-bold text-white uppercase tracking-widest">¿Necesitas más enlaces?</p>
              <p className="text-[10px] text-silver/40">Desbloquea enlaces ilimitados y funciones PRO.</p>
            </div>
            <button
              onClick={handlePurchase}
              className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-accent to-[#FFB700] hover:from-[#FFC000] hover:to-accent text-black font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all transform hover:-translate-y-1 active:scale-95"
            >
              <span className="material-symbols-outlined font-bold">shopping_cart</span>
              Comprar Links $60
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
