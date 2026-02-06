import { useState } from 'react';
import { useLinkEditor, BlockType, LinkBlock } from '@/hooks/useLinkEditor';
import MobilePreview from '@/components/MobilePreview';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Links() {
  const navigate = useNavigate();
  const {
    data,
    updateData,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock
  } = useLinkEditor();

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const selectedBlock = data.blocks.find(b => b.id === selectedBlockId);

  const handleSave = () => {
    toast.success('Cambios guardados localmente');
    // TODO: Implement backend sync
  };

  const handlePurchase = () => {
    navigate('/dashboard/payments');
  };

  const handleAddBlock = (type: BlockType) => {
    const id = addBlock(type);
    setSelectedBlockId(id);
  };

  const getBlockIcon = (type: BlockType, variant?: string) => {
    if (type === 'button') {
      switch (variant) {
        case 'instagram': return 'photo_camera';
        case 'telegram': return 'send'; // telegram icon not solid in material
        default: return 'smart_button';
      }
    }
    if (type === 'text') return 'text_fields';
    if (type === 'image') return 'image';
    return 'circle';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-dark to-black">
      {/* Warning Banner - Unpaid */}
      {!data.isPaid && (
        <div className="bg-gradient-to-r from-accent/20 to-orange-500/20 border-b border-accent/30 p-4 -mt-6 -mx-6 mb-6">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-accent text-2xl">warning</span>
              <div>
                <p className="text-white font-bold text-sm">
                  Cambios en Vista Previa (No Guardados)
                </p>
                <p className="text-silver/60 text-xs">
                  Tus cambios están en LOCAL. Compra tu link para guardarlos permanentemente.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-white/5 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-colors"
              >
                Guardar Borrador
              </button>
              <button
                onClick={handlePurchase}
                className="px-6 py-2 bg-gradient-to-r from-accent to-orange-500 text-black font-black text-sm rounded-xl hover:scale-105 transition-transform shadow-lg"
              >
                Comprar Link ($60)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar - Blocks List */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Contenido</h3>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                  {data.blocks.length}
                </span>
              </div>

              {/* Add Buttons Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => handleAddBlock('button')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary transition-all group border border-transparent hover:border-primary/30"
                >
                  <span className="material-symbols-outlined text-xl mb-1 group-hover:scale-110 transition-transform">smart_button</span>
                  <span className="text-[9px] font-bold uppercase">Botón</span>
                </button>
                <button
                  onClick={() => handleAddBlock('text')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary transition-all group border border-transparent hover:border-primary/30"
                >
                  <span className="material-symbols-outlined text-xl mb-1 group-hover:scale-110 transition-transform">text_fields</span>
                  <span className="text-[9px] font-bold uppercase">Texto</span>
                </button>
                <button
                  onClick={() => handleAddBlock('image')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary transition-all group border border-transparent hover:border-primary/30"
                >
                  <span className="material-symbols-outlined text-xl mb-1 group-hover:scale-110 transition-transform">image</span>
                  <span className="text-[9px] font-bold uppercase">Imagen</span>
                </button>
              </div>

              <div className="h-px bg-border my-4"></div>

              {/* Blocks List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {data.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`p-3 rounded-xl cursor-pointer group transition-all relative ${
                      selectedBlockId === block.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-white/5 border border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute left-1">
                         <button 
                           onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                           disabled={index === 0}
                           className="text-silver/40 hover:text-white disabled:opacity-0"
                          >
                           <span className="material-symbols-outlined text-[10px]">expand_less</span>
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                           disabled={index === data.blocks.length - 1}
                           className="text-silver/40 hover:text-white disabled:opacity-0"
                          >
                           <span className="material-symbols-outlined text-[10px]">expand_more</span>
                         </button>
                      </div>

                      <div className="pl-5 flex items-center gap-3 overflow-hidden flex-1">
                        <span className="material-symbols-outlined text-sm text-silver/40">
                          {getBlockIcon(block.type, block.variant)}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-bold text-white truncate">
                            {block.title || block.content || (block.type === 'image' ? 'Imagen' : 'Sin título')}
                          </span>
                          <span className="text-[9px] text-silver/40 uppercase font-bold">{block.type}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateBlock(block.id);
                          }}
                          className="p-1 hover:text-primary transition-colors"
                          title="Duplicar"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBlock(block.id);
                            if (selectedBlockId === block.id) setSelectedBlockId(null);
                          }}
                          className="p-1 hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {data.blocks.length === 0 && (
                  <div className="text-center py-8 text-silver/20">
                    <span className="material-symbols-outlined text-3xl mb-2">layers_clear</span>
                    <p className="text-[10px]">Sin bloques de contenido</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Center - Editor Panels */}
          <div className="lg:col-span-5 space-y-6 pb-20 lg:pb-0">
            
            {/* Conditional Editor: Block or General Settings */}
            {selectedBlock ? (
              <section className="bg-surface border-2 border-primary/30 rounded-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-[10px] font-bold text-white rounded-bl-xl flex items-center gap-2">
                  <span>Editando {selectedBlock.type === 'button' ? 'Botón' : selectedBlock.type === 'text' ? 'Texto' : 'Imagen'}</span>
                  <button onClick={() => setSelectedBlockId(null)} className="hover:text-black">
                     <span className="material-symbols-outlined text-sm font-bold">close</span>
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">edit</span>
                    Configuración de Bloque
                  </h3>
                </div>

                {/* BUTTON EDITOR */}
                {selectedBlock.type === 'button' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Texto del Botón</label>
                        <input
                          type="text"
                          value={selectedBlock.title || ''}
                          onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                          className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                          placeholder="Ej: Sígueme en Instagram"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">URL Destino</label>
                        <input
                          type="url"
                          value={selectedBlock.url || ''}
                          onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                          className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                          placeholder="https://"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest block">Estilo</label>
                      <div className="grid grid-cols-3 gap-2">
                         {(['rounded', 'square', 'soft'] as const).map((shape) => (
                           <button
                             key={shape}
                             onClick={() => updateBlock(selectedBlock.id, { buttonShape: shape })}
                             className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                               selectedBlock.buttonShape === shape
                                 ? 'border-2 border-primary bg-primary/5 text-white'
                                 : 'border border-border text-silver/60 hover:border-silver/30'
                             }`}
                           >
                             <div className={`w-6 h-2 bg-current ${shape === 'rounded' ? 'rounded-full' : shape === 'soft' ? 'rounded-md' : 'rounded-sm'}`}></div>
                             <span className="text-[9px] font-bold capitalize">{shape}</span>
                           </button>
                         ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest mb-2 block">Color Fondo</label>
                            <div className="flex items-center gap-2">
                               <input type="color" value={selectedBlock.buttonColor} onChange={(e) => updateBlock(selectedBlock.id, { buttonColor: e.target.value })} className="w-8 h-8 rounded border-none cursor-pointer" />
                               <span className="text-[10px] font-mono text-silver">{selectedBlock.buttonColor}</span>
                            </div>
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest mb-2 block">Color Texto</label>
                            <div className="flex items-center gap-2">
                               <input type="color" value={selectedBlock.textColor} onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })} className="w-8 h-8 rounded border-none cursor-pointer" />
                               <span className="text-[10px] font-mono text-silver">{selectedBlock.textColor}</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEXT EDITOR */}
                {selectedBlock.type === 'text' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Contenido</label>
                       <textarea
                         value={selectedBlock.content || ''}
                         onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                         className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                         placeholder="Escribe tu texto aquí..."
                       />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest block">Alineación</label>
                          <div className="flex bg-[#0B0B0B] rounded-lg p-1 border border-border">
                             {(['left', 'center', 'right'] as const).map(align => (
                                <button
                                  key={align}
                                  onClick={() => updateBlock(selectedBlock.id, { align })}
                                  className={`flex-1 py-1 rounded-md text-center transition-colors ${selectedBlock.align === align ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-white'}`}
                                >
                                   <span className="material-symbols-outlined text-sm">format_align_{align}</span>
                                </button>
                             ))}
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest mb-2 block">Color Texto</label>
                          <div className="flex items-center gap-2">
                             <input type="color" value={selectedBlock.textColor} onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })} className="w-8 h-8 rounded border-none cursor-pointer" />
                             <span className="text-[10px] font-mono text-silver">{selectedBlock.textColor}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* IMAGE EDITOR */}
                {selectedBlock.type === 'image' && (
                  <div className="space-y-6">
                     <div className="w-full aspect-video bg-[#0B0B0B] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                        {selectedBlock.imageBase64 ? (
                           <img src={selectedBlock.imageBase64} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                           <div className="text-center p-4">
                              <span className="material-symbols-outlined text-4xl text-silver/20 mb-2">add_photo_alternate</span>
                              <p className="text-xs text-silver/40 font-bold">Subir Imagen</p>
                           </div>
                        )}
                        <input
                           type="file"
                           accept="image/*"
                           className="absolute inset-0 opacity-0 cursor-pointer"
                           onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                 const reader = new FileReader();
                                 reader.onload = (ev) => updateBlock(selectedBlock.id, { imageBase64: ev.target?.result as string });
                                 reader.readAsDataURL(file);
                              }
                           }}
                        />
                        {selectedBlock.imageBase64 && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); updateBlock(selectedBlock.id, { imageBase64: null }); }}
                             className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                           >
                              <span className="material-symbols-outlined text-sm">close</span>
                           </button>
                        )}
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Leyenda (Opcional)</label>
                        <input
                           type="text"
                           value={selectedBlock.caption || ''}
                           onChange={(e) => updateBlock(selectedBlock.id, { caption: e.target.value })}
                           className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                           placeholder="Descripción de la imagen"
                        />
                     </div>
                  </div>
                )}

              </section>
            ) : (
                /* DEFAULT VIEW: General Settings (Brand, Typography, BG) */
                <>
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
                        <p className="text-[10px] text-silver/40">Recomendado: 500x500px</p>
                      </div>
                    </div>

                    {/* Verified Badge */}
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
                      <div className="md:col-span-2 space-y-2">
                         <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest ml-1">Bio</label>
                         <textarea
                            value={data.bio || ''}
                            onChange={(e) => updateData({ bio: e.target.value })}
                            className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Cuéntanos sobre ti..."
                            rows={3}
                         />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Typography */}
                <section className="bg-surface border border-border rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">text_fields</span>
                    Tipografía
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Familia de Fuente</label>
                      <select
                        value={data.fontFamily}
                        onChange={(e) => updateData({ fontFamily: e.target.value })}
                        className="w-full bg-[#0B0B0B] border border-border rounded-xl px-4 py-3 text-white text-sm outline-none"
                      >
                        <option value="Inter">Inter (Default)</option>
                        <option value="JetBrains Mono">JetBrains Mono</option>
                        <option value="Roboto">Roboto</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Tamaño Global: {data.fontSize}px</label>
                      <input
                        type="range"
                        min="12"
                        max="24"
                        value={data.fontSize}
                        onChange={(e) => updateData({ fontSize: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary mt-3"
                      />
                    </div>
                  </div>
                </section>
                </>
            )}
            
          </div>

          {/* Right - Preview */}
          <aside className="lg:col-span-4 hidden lg:block sticky top-6">
            <MobilePreview data={data} />
          </aside>
        </div>
      </div>
    </div>
  );
}
