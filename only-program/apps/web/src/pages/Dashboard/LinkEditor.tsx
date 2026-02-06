import { useState } from 'react';
import { useLinkEditor } from '@/hooks/useLinkEditor';
import MobilePreview from '@/components/MobilePreview';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function LinkEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    data,
    updateData,
    addButton,
    updateButton,
    deleteButton,
  } = useLinkEditor();

  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedButton = data.buttons.find(b => b.id === selectedButtonId);

  const handleSave = () => {
    toast.success('Cambios guardados localmente');
  };

  const handlePurchase = () => {
    navigate('/dashboard/payments');
  };

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
            {data.buttons.map((button) => (
              <div
                key={button.id}
                onClick={() => setSelectedButtonId(button.id)}
                className={`p-3 rounded-xl cursor-pointer group transition-all ${
                  selectedButtonId === button.id
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
                        // TODO: Implement duplicate button
                        toast.success('Duplicar botón - próximamente');
                      }}
                      className="p-1 hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteButton(button.id);
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
              onClick={addButton}
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
              {/* Editor Panels */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Brand Identity */}
                <section className="bg-surface border border-border rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">id_card</span>
                    Identidad de Marca
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Photo Upload */}
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

                    {/* Verified Badge */}
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

                    {/* Name & Username */}
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

                {/* Background Section */}
                <section className="bg-surface border border-border rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">wallpaper</span>
                    Fondo de Página
                  </h3>

                  <div className="space-y-6">
                    {/* Type Selector */}
                    <div className="flex p-1 bg-[#0B0B0B] border border-border rounded-xl w-fit">
                      {(['solid', 'gradient', 'image'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => updateData({ backgroundType: type })}
                          className={`px-4 py-2 text-[10px] font-bold transition-colors rounded-lg ${
                            data.backgroundType === type ? 'text-white bg-white/5' : 'text-silver/40 hover:text-white'
                          }`}
                        >
                          {type === 'solid' ? 'Sólido' : type === 'gradient' ? 'Degradado' : 'Imagen'}
                        </button>
                      ))}
                    </div>

                    {/* Solid Color */}
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

                    {/* Gradient */}
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

                {/* Button Style Editor - Only if button selected */}
                {selectedButton && (
                  <section className="bg-surface border-2 border-primary/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-[10px] font-bold text-white rounded-bl-xl">
                      Editando Botón
                    </div>

                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">smart_button</span>
                      Estilodel Botón
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Texto</label>
                          <input
                            type="text"
                            value={selectedButton.title}
                            onChange={(e) => updateButton(selectedButton.id, { title: e.target.value })}
                            className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">URL Destino</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={selectedButton.url}
                              onChange={(e) => updateButton(selectedButton.id, { url: e.target.value })}
                              className="flex-1 bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                              placeholder="https://"
                            />
                            <button className="px-3 bg-surface border border-border rounded-xl text-primary hover:bg-primary hover:text-white transition-all">
                              <span className="material-symbols-outlined text-lg">content_copy</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        {/* Button Shape */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest block">Forma del Botón</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['rounded', 'square', 'soft'] as const).map((shape) => (
                              <button
                                key={shape}
                                onClick={() => updateButton(selectedButton.id, { buttonShape: shape })}
                                className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                                  selectedButton.buttonShape === shape
                                    ? 'border-2 border-primary bg-primary/5 text-white'
                                    : 'border border-border text-silver/60 hover:border-silver/30'
                                }`}
                              >
                                <div className={`w-8 h-3 bg-white/20 ${
                                  shape === 'rounded' ? 'rounded-full' : shape === 'soft' ? 'rounded-md' : 'rounded-sm'
                                }`}></div>
                                <span className="text-[9px] font-bold">{shape}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Border & Shadow */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Grosor Borde</label>
                            <select
                              value={selectedButton.borderWidth}
                              onChange={(e) => updateButton(selectedButton.id, { borderWidth: parseInt(e.target.value) })}
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
                              onChange={(e) => updateButton(selectedButton.id, { shadowIntensity: parseInt(e.target.value) })}
                              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary mt-3"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-lg">image</span>
                          <span className="text-[10px] font-bold uppercase">Cambiar Icono</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-lg">palette</span>
                          <span className="text-[10px] font-bold uppercase">Color Botón</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-silver/40 hover:text-white transition-colors" title="Duplicar">
                          <span className="material-symbols-outlined">content_copy</span>
                        </button>
                        <button
                          onClick={() => deleteButton(selectedButton.id)}
                          className="p-2 text-red-400/60 hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* Typography */}
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
              </div>

              {/* Live Preview - Right Side */}
              <aside className="lg:col-span-4 hidden lg:block">
                <MobilePreview data={data} />
              </aside>
            </div>
          </div>
        </main>

        {/* Sticky Payment Footer */}
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
