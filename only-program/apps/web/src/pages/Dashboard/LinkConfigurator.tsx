import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Section {
  id: string;
  type: 'button' | 'text' | 'image';
  content: string;
  subtext?: string;
  url?: string;
}

export default function LinkConfigurator() {
  const location = useLocation();
  const navigate = useNavigate();
  const domain = location.state?.domain || 'mi-marca.com';
  
  const [sections, setSections] = useState<Section[]>([
    { id: '1', type: 'text', content: '¡Hola! Bienvenida a mi contenido exclusivo.' },
    { id: '2', type: 'button', content: 'Ver mi contenido 🌶️', url: 'https://onlyfans.com/user' },
  ]);

  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'button' ? 'Nuevo Botón' : 'Nuevo Texto',
      url: type === 'button' ? 'https://' : undefined
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-160px)]">
      {/* Editor Side */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-2xl font-bold text-white">Configura tu página</h1>
              <p className="text-silver/60 text-sm">Dominio: <span className="text-primary font-mono">{domain}</span></p>
           </div>
           <button 
             className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
             onClick={() => navigate('/dashboard')}
           >
             Guardar Cambios
           </button>
        </div>

        {/* Sections Editor */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={section.id} className="bg-surface/50 border border-border p-4 rounded-2xl group transition-all hover:border-primary/30">
               <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                     <button onClick={() => moveSection(index, 'up')} className="text-silver/20 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg leading-none">expand_less</span>
                     </button>
                     <button onClick={() => moveSection(index, 'down')} className="text-silver/20 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg leading-none">expand_more</span>
                     </button>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                     <input 
                        type="text" 
                        value={section.content}
                        onChange={(e) => {
                           const newSections = [...sections];
                           newSections[index].content = e.target.value;
                           setSections(newSections);
                        }}
                        className="bg-transparent text-white font-bold w-full focus:outline-none focus:text-primary transition-colors"
                     />
                     {section.type === 'button' && (
                        <input 
                           type="text" 
                           value={section.url}
                           onChange={(e) => {
                              const newSections = [...sections];
                              newSections[index].url = e.target.value;
                              setSections(newSections);
                           }}
                           className="bg-background-dark/50 border border-border px-3 py-1.5 rounded-lg text-xs text-silver w-full focus:outline-none"
                           placeholder="URL de destino"
                        />
                     )}
                  </div>

                  <button 
                    onClick={() => removeSection(section.id)}
                    className="p-2 text-silver/20 hover:text-red-400 transition-colors"
                  >
                     <span className="material-symbols-outlined">delete</span>
                  </button>
               </div>
            </div>
          ))}

          <div className="grid grid-cols-3 gap-3">
             <button 
               onClick={() => addSection('button')}
               className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
             >
                <span className="material-symbols-outlined text-silver/40 group-hover:text-primary mb-1">smart_button</span>
                <span className="text-[10px] uppercase font-bold text-silver/40 group-hover:text-primary">Añadir Botón</span>
             </button>
             <button 
               onClick={() => addSection('text')}
               className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
             >
                <span className="material-symbols-outlined text-silver/40 group-hover:text-primary mb-1">text_fields</span>
                <span className="text-[10px] uppercase font-bold text-silver/40 group-hover:text-primary">Texto Simple</span>
             </button>
             <button 
               onClick={() => addSection('image')}
               className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
             >
                <span className="material-symbols-outlined text-silver/40 group-hover:text-primary mb-1">image</span>
                <span className="text-[10px] uppercase font-bold text-silver/40 group-hover:text-primary">Imagen</span>
             </button>
          </div>
        </div>
      </div>

      {/* Preview Side */}
      <div className="w-full lg:w-[400px] flex flex-col items-center">
         <div className="sticky top-8 w-full max-w-[320px] aspect-[9/18.5] bg-[#0F0F0F] rounded-[3rem] border-[8px] border-[#1F1F1F] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
            {/* Phone Notch */}
            <div className="h-6 w-1/3 bg-[#1F1F1F] mx-auto rounded-b-2xl mb-4"></div>
            
            {/* Live Render Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 custom-scrollbar">
               <div className="flex flex-col items-center text-center pt-4 mb-4">
                  <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center mb-3">
                     <span className="material-symbols-outlined text-primary text-3xl font-bold">person</span>
                  </div>
                  <h3 className="text-white font-bold leading-none mb-1 text-sm">Mi Marca Personal</h3>
                  <p className="text-silver/50 text-[10px] uppercase tracking-widest font-bold">@modelo_premium</p>
               </div>

               {sections.map((section) => (
                  <div key={section.id}>
                     {section.type === 'text' && (
                        <p className="text-white text-xs text-center leading-relaxed">
                           {section.content}
                        </p>
                     )}
                     {section.type === 'button' && (
                        <div className="w-full bg-primary py-3 rounded-xl text-white text-xs font-bold text-center shadow-lg shadow-primary/20">
                           {section.content}
                        </div>
                     )}
                     {section.type === 'image' && (
                        <div className="w-full aspect-video bg-surface rounded-xl flex items-center justify-center border border-border">
                           <span className="material-symbols-outlined text-silver/20">image</span>
                        </div>
                     )}
                  </div>
               ))}
            </div>

            {/* Brand Footer */}
            <div className="py-4 text-center border-t border-white/5">
                <p className="text-[8px] text-silver/20 uppercase tracking-[0.2em] font-bold">Powered by Only Program</p>
            </div>
         </div>
         <p className="mt-4 text-silver/40 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-xs">smartphone</span> Vista Previa Real
         </p>
      </div>
    </div>
  );
}
