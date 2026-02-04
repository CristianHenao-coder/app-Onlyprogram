import { useState, useEffect, useRef } from 'react';
import { cmsService } from '@/services/cmsService';
import { storageService } from '@/services/storageService';
import Home from '@/pages/Home';
import { useTranslation } from '@/contexts/I18nContext';
import { useModal } from '@/contexts/ModalContext';
import { validation } from '@/utils/validation';
import { logActions } from '@/services/auditService';
import { useUndoable, createUndoableAction } from '@/hooks/useUndoable';
import Snackbar from '@/components/Snackbar';

const CmsEditor = () => {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewScale, setPreviewScale] = useState(1);
  const [previewKey, setPreviewKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [undoAction, setUndoAction] = useState<any>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const { addAction, undo } = useUndoable();

  const [config, setConfig] = useState<any>({
    general: { 
      logoText: 'Only Program', 
      logoSub: 'Program',
      logoUrl: '',
      tagline: 'Security & Ethics',
      menuHome: 'Inicio',
      menuFeatures: 'Funciones',
      menuPricing: 'Precios',
      menuTestimonials: 'Testimonios'
    },
    hero: { 
      badge: 'Seguridad de nueva generación para creadores', 
      title: 'Detén las filtraciones.', 
      titleHighlight: 'Protege tus enlaces.',
      subtitle: 'Detección automática de bots y tecnología anti-leach para tu contenido premium.',
      ctaText: 'Asegura tu cuenta'
    },
    testimonials: [],
    pricing: []
  });

   const handleFileUpload = async (file: File, path: string, callback: (url: string) => void) => {
      try {
         const url = await storageService.uploadImage(file, path);
         callback(url);
      } catch (err) {
         console.error("Upload error:", err);
         showAlert({
            title: "Error de Carga",
            message: "No se pudo subir la imagen. Verifica los permisos del bucket 'cms-assets' en tu panel de Supabase.",
            type: "error"
         });
      }
   };

   const handleDeleteMedia = async (url: string, section: string, keyOrIdx: string | number) => {
      const confirmed = await showConfirm({
         title: "Eliminar Imagen",
         message: "¿Estás seguro de que quieres borrar esta imagen? Se eliminará permanentemente del servidor.",
         type: "warning",
         confirmText: "Sí, borrar",
         cancelText: "Cancelar"
      });

      if (!confirmed) return;
      
      try {
         await storageService.deleteImage(url);
         
         const newConfig = { ...config };
         if (section === 'general') {
            newConfig.general[keyOrIdx as string] = '';
         } else if (section === 'testimonials') {
            newConfig.testimonials[keyOrIdx as number].avatar = '';
         }
         
         setConfig(newConfig);
         await cmsService.saveConfig(section, newConfig[section]);
         await logActions.cmsDelete(section, keyOrIdx.toString(), { url });
      } catch (err) {
         console.error("Delete media error:", err);
      }
   };

   const deleteTestimonial = (index: number) => {
      const deletedTestimonial = config.testimonials[index];
      const newTestimonials = config.testimonials.filter((_: any, idx: number) => idx !== index);
      
      const action = createUndoableAction(
        'DELETE_TESTIMONIAL',
        `Testimonio de ${deletedTestimonial.name || 'Sin nombre'} eliminado`,
        { index, testimonial: deletedTestimonial },
        async (data) => {
          const testimonials = [...config.testimonials];
          testimonials.splice(data.index, 0, data.testimonial);
          setConfig((prev: any) => ({ ...prev, testimonials }));
          await logActions.cmsUpdate('testimonials', { action: 'undo_delete', index: data.index });
        },
        async (data) => {
           const testimonials = config.testimonials.filter((_: any, idx: number) => idx !== data.index);
           setConfig((prev: any) => ({ ...prev, testimonials }));
        }
      );

      addAction(action);
      setConfig({ ...config, testimonials: newTestimonials });
      setUndoAction(action);
      logActions.cmsDelete('testimonials', index.toString(), { name: deletedTestimonial.name });
   };

  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      try {
        const [general, hero, testimonials, pricing] = await Promise.all([
          cmsService.getConfig('general'),
          cmsService.getConfig('hero'),
          cmsService.getConfig('testimonials'),
          cmsService.getConfig('pricing')
        ]);

        setConfig({
          general: general || config.general,
          hero: hero || config.hero,
          testimonials: testimonials || [],
          pricing: pricing || []
        });
      } catch (err) {
        console.error("Error fetching CMS config:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  useEffect(() => {
    if (!previewContainerRef.current) return;
    
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.clientWidth - 40;
      const targetWidth = previewMode === 'desktop' ? 1440 : 375;
      const scale = containerWidth / targetWidth;
      setPreviewScale(Math.min(scale, 1));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(previewContainerRef.current);
    updateScale();

    return () => observer.disconnect();
  }, [showPreview, previewMode]);

  const handleSave = async () => {
    // Validation
    const formErrors: Record<string, string> = {};
    
    // Validate General
    const logoTextVal = validation.text(config.general.logoText, { required: true, minLength: 2, label: 'Texto Logo' });
    if (!logoTextVal.valid) formErrors['general.logoText'] = logoTextVal.error!;
    
    const logoSubVal = validation.text(config.general.logoSub, { required: true, label: 'Acento Logo' });
    if (!logoSubVal.valid) formErrors['general.logoSub'] = logoSubVal.error!;
    
    const taglineVal = validation.text(config.general.tagline, { required: true, label: 'Eslogan' });
    if (!taglineVal.valid) formErrors['general.tagline'] = taglineVal.error!;
    
    // Validate Hero
    const heroTitleVal = validation.text(config.hero.title, { required: true, minLength: 5, label: 'Título Principal' });
    if (!heroTitleVal.valid) formErrors['hero.title'] = heroTitleVal.error!;

    const heroSubtitleVal = validation.text(config.hero.subtitle, { required: true, minLength: 10, label: 'Subtítulo' });
    if (!heroSubtitleVal.valid) formErrors['hero.subtitle'] = heroSubtitleVal.error!;

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      showAlert({
        title: "Error de Validación",
        message: "Por favor, corrige los errores en el formulario antes de guardar.",
        type: "error"
      });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
         await Promise.all([
            cmsService.saveConfig('general', config.general),
            cmsService.saveConfig('hero', config.hero),
            cmsService.saveConfig('testimonials', config.testimonials),
            cmsService.saveConfig('pricing', config.pricing)
         ]);
         
         await logActions.cmsUpdate('all', { sections: ['general', 'hero', 'testimonials', 'pricing'] });

         showAlert({
            title: "¡Éxito!",
            message: "Los cambios se han guardado correctamente y ya están en vivo.",
            type: "success"
         });
      } catch (err) {
         console.error(err);
         showAlert({
            title: "Error al Guardar",
            message: "Ocurrió un problema al sincronizar los cambios con la base de datos.",
            type: "error"
         });
      } finally {
         setSaving(false);
      }
   };

   const handleRefreshPreview = () => {
      setPreviewKey(prev => prev + 1);
   };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-8 h-auto xl:h-[calc(100vh-140px)] animate-in fade-in duration-700">
      {/* Editor Side */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8 ${showPreview ? 'xl:max-w-[450px]' : ''}`}>
        <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm py-4 z-10 border-b border-border/50 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Editor CMS</h1>
            <p className="text-silver/40 text-[10px] font-black uppercase tracking-widest">{t('admin.cms.subtitle') || 'Personaliza tu landing page'}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-white/5 border border-border/50 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
            >
              {showPreview ? 'Ocultar Previa' : 'Ver Previa'}
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        <section className="bg-surface/30 border border-border/50 p-6 rounded-3xl space-y-6">
           <h2 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">branding_watermark</span>
              Marca y Navbar
           </h2>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Texto Logo</label>
                 <input 
                   type="text" 
                   value={config.general.logoText}
                   onChange={e => setConfig({ ...config, general: { ...config.general, logoText: e.target.value } })}
                   className={`w-full bg-background-dark border ${errors['general.logoText'] ? 'border-red-500' : 'border-border/50'} rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50`}
                 />
                 {errors['general.logoText'] && <p className="text-[10px] text-red-500 font-bold mt-1">{errors['general.logoText']}</p>}
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Acento Logo</label>
                 <input 
                   type="text" 
                   value={config.general.logoSub}
                   onChange={e => setConfig({ ...config, general: { ...config.general, logoSub: e.target.value } })}
                   className={`w-full bg-background-dark border ${errors['general.logoSub'] ? 'border-red-500' : 'border-border/50'} rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50`}
                 />
                 {errors['general.logoSub'] && <p className="text-[10px] text-red-500 font-bold mt-1">{errors['general.logoSub']}</p>}
              </div>
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Logo (Imagen)</label>
              <div className="flex gap-3 items-center">
                 <div className="w-14 h-14 rounded-2xl bg-background-dark border border-border/50 overflow-hidden flex items-center justify-center group relative">
                    {config.general.logoUrl ? (
                       <>
                          <img src={config.general.logoUrl} className="w-full h-full object-contain" />
                          <button 
                             type="button"
                             onClick={() => handleDeleteMedia(config.general.logoUrl, 'general', 'logoUrl')}
                             className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          >
                             <span className="material-symbols-outlined font-black">delete</span>
                          </button>
                       </>
                    ) : (
                       <span className="material-symbols-outlined text-silver/20">image</span>
                    )}
                 </div>
                 <div className="flex-1">
                    <label className="block">
                       <span className="sr-only">Elegir Logo</span>
                       <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logos', (url) => setConfig({...config, general: {...config.general, logoUrl: url}}))}
                          className="block w-full text-xs text-silver/40
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0
                             file:text-[10px] file:font-black file:uppercase
                             file:bg-primary/10 file:text-primary
                             hover:file:bg-primary/20 cursor-pointer"
                       />
                    </label>
                    <p className="text-[9px] text-silver/30 mt-1 uppercase font-black tracking-widest">Recomendado: WebP/PNG transparente</p>
                 </div>
              </div>
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Eslogan (Tagline)</label>
              <input 
                type="text" 
                value={config.general.tagline}
                onChange={e => setConfig({ ...config, general: { ...config.general, tagline: e.target.value } })}
                className={`w-full bg-background-dark border ${errors['general.tagline'] ? 'border-red-500' : 'border-border/50'} rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50`}
              />
              {errors['general.tagline'] && <p className="text-[10px] text-red-500 font-bold mt-1">{errors['general.tagline']}</p>}
           </div>
           <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Menú: Inicio</label>
                 <input 
                   type="text" 
                   value={config.general.menuHome}
                   onChange={e => setConfig({ ...config, general: { ...config.general, menuHome: e.target.value } })}
                   className="w-full bg-background-dark border border-border/50 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Menú: Funciones</label>
                 <input 
                   type="text" 
                   value={config.general.menuFeatures}
                   onChange={e => setConfig({ ...config, general: { ...config.general, menuFeatures: e.target.value } })}
                   className="w-full bg-background-dark border border-border/50 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Menú: Precios</label>
                 <input 
                   type="text" 
                   value={config.general.menuPricing}
                   onChange={e => setConfig({ ...config, general: { ...config.general, menuPricing: e.target.value } })}
                   className="w-full bg-background-dark border border-border/50 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Menú: Testimonios</label>
                 <input 
                   type="text" 
                   value={config.general.menuTestimonials}
                   onChange={e => setConfig({ ...config, general: { ...config.general, menuTestimonials: e.target.value } })}
                   className="w-full bg-background-dark border border-border/50 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50"
                 />
              </div>
           </div>
        </section>

        {/* Hero Section */}
        <section className="bg-surface/30 border border-border/50 p-6 rounded-3xl space-y-4">
           <h2 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Sección Hero
           </h2>
           <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Badge Superior</label>
                 <input 
                   type="text" 
                   value={config.hero.badge}
                   onChange={e => setConfig({ ...config, hero: { ...config.hero, badge: e.target.value } })}
                   className="w-full bg-background-dark border border-border/50 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Título Principal</label>
                 <input 
                   type="text" 
                   value={config.hero.title}
                   onChange={e => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                   className={`w-full bg-background-dark border ${errors['hero.title'] ? 'border-red-500' : 'border-border/50'} rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50`}
                 />
                 {errors['hero.title'] && <p className="text-[10px] text-red-500 font-bold mt-1">{errors['hero.title']}</p>}
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Título Resaltado</label>
                 <input 
                   type="text" 
                   value={config.hero.titleHighlight}
                   onChange={e => setConfig({ ...config, hero: { ...config.hero, titleHighlight: e.target.value } })}
                   className="w-full bg-background-dark border border-border/50 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] text-silver/40 font-black uppercase tracking-widest">Subtítulo</label>
                 <textarea 
                   value={config.hero.subtitle}
                   onChange={e => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                   className={`w-full bg-background-dark border ${errors['hero.subtitle'] ? 'border-red-500' : 'border-border/50'} rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 h-24 resize-none`}
                 />
                 {errors['hero.subtitle'] && <p className="text-[10px] text-red-500 font-bold mt-1">{errors['hero.subtitle']}</p>}
              </div>
           </div>
        </section>

        {/* Testimonials */}
        <section className="bg-surface/30 border border-border/50 p-6 rounded-3xl space-y-4">
           <div className="flex justify-between items-center">
             <h2 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">forum</span>
                Testimonios
             </h2>
             <button 
                type="button"
                onClick={() => setConfig({ ...config, testimonials: [...config.testimonials, { name: '', role: '', content: '', avatar: '' }] })}
                className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
             >
                <span className="material-symbols-outlined text-sm">add</span>
             </button>
           </div>
           
           <div className="space-y-4">
              {config.testimonials.map((t: any, i: number) => (
                 <div key={i} className="p-4 bg-background-dark/50 border border-border/50 rounded-2xl relative group">
                    <button 
                       type="button"
                       onClick={() => deleteTestimonial(i)}
                       className="absolute top-2 right-2 h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded"
                    >
                       <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                     <div className="space-y-3">
                        <div className="flex gap-3">
                           <div className="w-12 h-12 rounded-xl bg-background border border-border overflow-hidden shrink-0 group relative">
                              {t.avatar ? (
                                 <>
                                    <img src={t.avatar} className="w-full h-full object-cover" />
                                    <button 
                                       type="button"
                                       onClick={() => handleDeleteMedia(t.avatar, 'testimonials', i)}
                                       className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                    >
                                       <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                 </>
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-silver/20">
                                    <span className="material-symbols-outlined">image</span>
                                 </div>
                              )}
                           </div>
                           <div className="flex-1">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={e => {
                                   if (e.target.files?.[0]) {
                                      handleFileUpload(e.target.files[0], 'testimonials', (url) => {
                                         const newT = [...config.testimonials];
                                         newT[i].avatar = url;
                                         setConfig({ ...config, testimonials: newT });
                                      });
                                   }
                                }}
                                className="block w-full text-xs text-silver/40 mb-1
                                   file:mr-2 file:py-1 file:px-3
                                   file:rounded-lg file:border-0
                                   file:text-[8px] file:font-black file:uppercase
                                   file:bg-white/5 file:text-silver/60
                                   hover:file:bg-white/10 cursor-pointer"
                              />
                              <p className="text-[8px] text-silver/30 uppercase font-black">Avatar del creador</p>
                           </div>
                        </div>
                        <input 
                          placeholder="Nombre"
                          value={t.name}
                          onChange={e => {
                             const newT = [...config.testimonials];
                             newT[i].name = e.target.value;
                             setConfig({ ...config, testimonials: newT });
                          }}
                          className="w-full bg-transparent border-b border-border/50 p-1 text-xs text-white outline-none focus:border-primary"
                        />
                       <input 
                         placeholder="Rol (e.g. Creador de contenido)"
                         value={t.role}
                         onChange={e => {
                            const newT = [...config.testimonials];
                            newT[i].role = e.target.value;
                            setConfig({ ...config, testimonials: newT });
                         }}
                         className="w-full bg-transparent border-b border-border/50 p-1 text-[10px] text-silver/60 outline-none focus:border-primary"
                       />
                       <textarea 
                         placeholder="Contenido del testimonio..."
                         value={t.content}
                         onChange={e => {
                            const newT = [...config.testimonials];
                            newT[i].content = e.target.value;
                            setConfig({ ...config, testimonials: newT });
                         }}
                         className="w-full bg-transparent border-b border-border/50 p-1 text-[10px] text-silver/40 outline-none focus:border-primary h-16 resize-none"
                       />
                     </div>
                 </div>
              ))}
           </div>
        </section>

        {/* Pricing */}
        <section className="bg-surface/30 border border-border/50 p-6 rounded-3xl space-y-4">
           <div className="flex justify-between items-center">
             <h2 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">payments</span>
                Planes de Precios
             </h2>
             <button 
                type="button"
                onClick={() => setConfig({ ...config, pricing: [...config.pricing, { name: '', price: '', description: '', features: [], isPopular: false }] })}
                className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
             >
                <span className="material-symbols-outlined text-sm">add</span>
             </button>
           </div>
           
           <div className="space-y-4">
              {config.pricing.map((p: any, i: number) => (
                 <div key={i} className="p-4 bg-background-dark/50 border border-border/50 rounded-2xl relative group space-y-3">
                    <button 
                       type="button"
                       onClick={() => setConfig({ ...config, pricing: config.pricing.filter((_: any, idx: number) => idx !== i) })}
                       className="absolute top-2 right-2 h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded"
                    >
                       <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                       <input 
                         placeholder="Nombre del Plan"
                         value={p.name}
                         onChange={e => {
                            const newP = [...config.pricing];
                            newP[i].name = e.target.value;
                            setConfig({ ...config, pricing: newP });
                         }}
                         className="bg-transparent border-b border-border/50 p-1 text-xs text-white outline-none focus:border-primary"
                       />
                       <input 
                         placeholder="Precio"
                         value={p.price}
                         onChange={e => {
                            const newP = [...config.pricing];
                            newP[i].price = e.target.value;
                            setConfig({ ...config, pricing: newP });
                         }}
                         className="bg-transparent border-b border-border/50 p-1 text-xs text-primary font-black outline-none focus:border-primary"
                       />
                    </div>
                    <input 
                       placeholder="Descripción corta"
                       value={p.description}
                       onChange={e => {
                          const newP = [...config.pricing];
                          newP[i].description = e.target.value;
                          setConfig({ ...config, pricing: newP });
                       }}
                       className="w-full bg-transparent border-b border-border/50 p-1 text-[10px] text-silver/60 outline-none focus:border-primary"
                    />
                 </div>
              ))}
           </div>
        </section>
      </div>

      {/* Preview Side */}
      {showPreview && (
        <div className="flex-1 bg-[#050505] border border-border/50 rounded-[2.5rem] overflow-hidden relative shadow-2xl flex flex-col min-h-[600px] xl:min-h-0">
          <div className="h-14 border-b border-border/30 bg-[#0B0B0B] flex items-center justify-between px-6 shrink-0">
             <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/50"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/50"></div>
             </div>
             
             <div className="flex items-center gap-4">
                <button 
                  onClick={handleRefreshPreview}
                  className="material-symbols-outlined text-lg text-silver/20 hover:text-primary transition-colors"
                  title="Refrescar vista previa"
                >
                  refresh
                </button>
                <div className="h-4 w-px bg-border/30"></div>
                <button 
                  onClick={() => setPreviewMode('desktop')}
                  className={`material-symbols-outlined text-lg transition-colors ${previewMode === 'desktop' ? 'text-primary' : 'text-silver/20 hover:text-silver/40'}`}
                >
                  desktop_windows
                </button>
                <button 
                  onClick={() => setPreviewMode('mobile')}
                  className={`material-symbols-outlined text-lg transition-colors ${previewMode === 'mobile' ? 'text-primary' : 'text-silver/20 hover:text-silver/40'}`}
                >
                  smartphone
                </button>
             </div>

             <div className="px-3 py-1 bg-white/5 rounded-lg border border-border/30">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest italic flex items-center gap-2">
                   <span className="h-1 w-1 rounded-full bg-primary animate-pulse"></span>
                   Modo Vista Previa
                </span>
             </div>
          </div>

          <div 
            ref={previewContainerRef}
            className="flex-1 overflow-auto bg-black/40 relative flex items-start justify-center p-8 no-scrollbar"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
             <div 
                style={{ 
                   transform: `scale(${previewScale})`,
                   transformOrigin: 'top center',
                   width: previewMode === 'desktop' ? '1440px' : '375px',
                   minHeight: previewMode === 'desktop' ? '900px' : '812px',
                   maxHeight: previewMode === 'desktop' ? '4000px' : '3000px',
                   transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                   backgroundColor: '#050505',
                   boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7)',
                   border: 'none',
                   borderRadius: previewMode === 'mobile' ? '48px' : '0px',
                }}
                className="relative shrink-0"
             >
                  <div className="w-full h-full overflow-y-auto overflow-x-hidden" style={{ pointerEvents: 'auto' }}>
                  <Home key={previewKey} previewData={config} />
                </div>
                 
                 {previewMode === 'mobile' && (
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1a1a] rounded-b-2xl z-50"></div>
                 )}
             </div>

             {/* Dynamic Zoom Info */}
             <div className="fixed bottom-10 right-10 px-4 py-2 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 text-[11px] font-mono text-primary font-bold shadow-2xl z-50">
                {Math.round(previewScale * 100)}% ZOOM
             </div>
          </div>

          <div className="h-10 border-t border-border/30 bg-[#0B0B0B] flex items-center justify-center shrink-0">
             <div className="h-1 w-20 rounded-full bg-white/10 shrink-0"></div>
          </div>
        </div>
      )}

      {undoAction && (
        <Snackbar 
          message={undoAction.description}
          isOpen={!!undoAction}
          onClose={() => setUndoAction(null)}
          action={{
            label: 'Deshacer',
            onClick: undo
          }}
          type="info"
        />
      )}
    </div>
  );
};

export default CmsEditor;
