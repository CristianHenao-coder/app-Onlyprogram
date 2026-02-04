import { useState, useEffect } from 'react';
import { cmsService } from '@/services/cmsService';

const SectionTab = ({ active, label, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest
      ${active 
        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
        : 'bg-white/5 text-silver/40 hover:bg-white/10 hover:text-white'}
    `}
  >
    <span className="material-symbols-outlined text-sm">{icon}</span>
    {label}
  </button>
);

const CmsEditor = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({
    general: { logoText: 'Only Program', logoSub: 'Program' },
    hero: { badge: '', title: '', titleHighlight: '', subtitle: '', ctaText: '' },
    testimonials: [],
    pricing: []
  });

  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      const [general, hero, testimonials, pricing] = await Promise.all([
        cmsService.getConfig('general'),
        cmsService.getConfig('hero'),
        cmsService.getConfig('testimonials'),
        cmsService.getConfig('pricing')
      ]);

      setConfig({
        general: general || { logoText: 'Only Program', logoSub: 'Program' },
        hero: hero || { 
          badge: 'Next-Generation Security for Creators', 
          title: 'Stop the leaks.', 
          titleHighlight: 'Protect your links.',
          subtitle: 'Automatic bot detection and anti-leach technology for your premium content.',
          ctaText: 'Secure your account'
        },
        testimonials: testimonials || [],
        pricing: pricing || []
      });
      setLoading(false);
    };

    fetchConfigs();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await cmsService.saveConfig(activeTab, config[activeTab]);
      alert('Configuración guardada correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) {
     return <div className="h-64 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">CMS Editor</h1>
          <p className="text-silver/40 text-sm font-medium">Manage landing page content without touching code.</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-primary text-white font-black uppercase tracking-widest rounded-xl text-xs hover:scale-105 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div> : <span className="material-symbols-outlined text-sm">save</span>}
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-border/50 pb-6">
        <SectionTab label="General" icon="settings" active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
        <SectionTab label="Hero Section" icon="rocket_launch" active={activeTab === 'hero'} onClick={() => setActiveTab('hero')} />
        <SectionTab label="Testimonials" icon="forum" active={activeTab === 'testimonials'} onClick={() => setActiveTab('testimonials')} />
        <SectionTab label="Pricing" icon="payments" active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')} />
      </div>

      <div className="bg-surface/30 border border-border/50 p-8 rounded-3xl">
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Global Branding</h2>
            <div>
              <label className="block text-xs font-black text-silver/40 uppercase tracking-widest mb-2">Logo Main Text</label>
              <input 
                type="text" 
                value={config.general.logoText} 
                onChange={(e) => updateField('general', 'logoText', e.target.value)}
                className="w-full bg-background-dark border border-border rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-silver/40 uppercase tracking-widest mb-2">Logo Subtitle (Red text)</label>
              <input 
                type="text" 
                value={config.general.logoSub} 
                onChange={(e) => updateField('general', 'logoSub', e.target.value)}
                className="w-full bg-background-dark border border-border rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {activeTab === 'hero' && (
          <div className="space-y-6 max-w-4xl">
             <h2 className="text-xl font-bold text-white mb-6">Hero Header Content</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-black text-silver/40 uppercase tracking-widest mb-2">Top Badge Text</label>
                   <input 
                      type="text" 
                      value={config.hero.badge} 
                      onChange={(e) => updateField('hero', 'badge', e.target.value)}
                      className="w-full bg-background-dark border border-border rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all"
                   />
                </div>
                <div>
                  <label className="block text-xs font-black text-silver/40 uppercase tracking-widest mb-2">CTA Button Text</label>
                  <input 
                    type="text" 
                    value={config.hero.ctaText} 
                    onChange={(e) => updateField('hero', 'ctaText', e.target.value)}
                    className="w-full bg-background-dark border border-border rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all"
                  />
                </div>
             </div>
             <div>
                <label className="block text-xs font-black text-silver/40 uppercase tracking-widest mb-2">Main Title (Static part)</label>
                <input 
                  type="text" 
                  value={config.hero.title} 
                  onChange={(e) => updateField('hero', 'title', e.target.value)}
                  className="w-full bg-background-dark border border-border rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all"
                />
             </div>
             <div>
                <label className="block text-xs font-black text-silver/40 uppercase tracking-widest mb-2">Highlighted Title (Gold animated part)</label>
                <input 
                  type="text" 
                  value={config.hero.titleHighlight} 
                  onChange={(e) => updateField('hero', 'titleHighlight', e.target.value)}
                  className="w-full bg-background-dark border border-border rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all"
                />
             </div>
             <div>
                <label className="block text-xs font-black text-silver/40 uppercase tracking-widest mb-2">Subtitle Paragraph</label>
                <textarea 
                  rows={4}
                  value={config.hero.subtitle} 
                  onChange={(e) => updateField('hero', 'subtitle', e.target.value)}
                  className="w-full bg-background-dark border border-border rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all resize-none"
                />
             </div>
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold text-white">Testimonial Models</h2>
               <button 
                onClick={() => {
                  const newList = [...config.testimonials, { name: '', role: '', quote: '', badge: 'New' }];
                  setConfig({ ...config, testimonials: newList });
                }}
                className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
               >
                 <span className="material-symbols-outlined text-sm">add</span>
                 Add Testimonial
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {config.testimonials.map((t: any, index: number) => (
                 <div key={index} className="bg-background-dark/50 border border-border/50 p-6 rounded-2xl relative group">
                    <button 
                      onClick={() => {
                        const newList = config.testimonials.filter((_: any, i: number) => i !== index);
                        setConfig({ ...config, testimonials: newList });
                      }}
                      className="absolute top-4 right-4 h-8 w-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>

                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[10px] font-black text-silver/20 uppercase tracking-widest mb-1">Model Name</label>
                             <input 
                              type="text" 
                              value={t.name} 
                              onChange={(e) => {
                                const newList = [...config.testimonials];
                                newList[index].name = e.target.value;
                                setConfig({ ...config, testimonials: newList });
                              }}
                              className="w-full bg-background-dark border border-border/50 rounded-lg p-3 text-sm text-white focus:border-primary/50 outline-none transition-all"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-silver/20 uppercase tracking-widest mb-1">Role/Company</label>
                             <input 
                              type="text" 
                              value={t.role} 
                              onChange={(e) => {
                                const newList = [...config.testimonials];
                                newList[index].role = e.target.value;
                                setConfig({ ...config, testimonials: newList });
                              }}
                              className="w-full bg-background-dark border border-border/50 rounded-lg p-3 text-sm text-white focus:border-primary/50 outline-none transition-all"
                             />
                          </div>
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-silver/20 uppercase tracking-widest mb-1">Quote</label>
                          <textarea 
                            rows={3}
                            value={t.quote} 
                            onChange={(e) => {
                              const newList = [...config.testimonials];
                              newList[index].quote = e.target.value;
                              setConfig({ ...config, testimonials: newList });
                            }}
                            className="w-full bg-background-dark border border-border/50 rounded-lg p-3 text-sm text-white focus:border-primary/50 outline-none transition-all resize-none"
                          />
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            {config.testimonials.length === 0 && (
              <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-border/50">
                <p className="text-silver/40 text-sm">No testimonials added yet. Click "Add Testimonial" to start.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-white mb-6">Plans & Pricing</h2>
            <div className="grid grid-cols-1 gap-6">
               {(config.pricing || []).map((plan: any, index: number) => (
                 <div key={index} className="bg-background-dark/50 border border-border/50 p-6 rounded-2xl relative group">
                    <button 
                      onClick={() => {
                        const newList = config.pricing.filter((_: any, i: number) => i !== index);
                        setConfig({ ...config, pricing: newList });
                      }}
                      className="absolute top-4 right-4 h-8 w-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div>
                          <label className="block text-[10px] font-black text-silver/20 uppercase tracking-widest mb-1">Plan Name</label>
                          <input 
                            type="text" 
                            value={plan.name} 
                            onChange={(e) => {
                              const newList = [...config.pricing];
                              newList[index].name = e.target.value;
                              setConfig({ ...config, pricing: newList });
                            }}
                            className="w-full bg-background-dark border border-border/50 rounded-lg p-3 text-sm text-white focus:border-primary/50 outline-none transition-all"
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-silver/20 uppercase tracking-widest mb-1">Monthly Price</label>
                          <input 
                            type="text" 
                            value={plan.price} 
                            onChange={(e) => {
                              const newList = [...config.pricing];
                              newList[index].price = e.target.value;
                              setConfig({ ...config, pricing: newList });
                            }}
                            className="w-full bg-background-dark border border-border/50 rounded-lg p-3 text-sm text-white focus:border-primary/50 outline-none transition-all"
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-silver/20 uppercase tracking-widest mb-1">Yearly Price</label>
                          <input 
                            type="text" 
                            value={plan.priceYearly} 
                            onChange={(e) => {
                              const newList = [...config.pricing];
                              newList[index].priceYearly = e.target.value;
                              setConfig({ ...config, pricing: newList });
                            }}
                            className="w-full bg-background-dark border border-border/50 rounded-lg p-3 text-sm text-white focus:border-primary/50 outline-none transition-all"
                          />
                       </div>
                    </div>
                 </div>
               ))}
               <button 
                onClick={() => {
                  const newList = [...(config.pricing || []), { name: 'New Plan', price: '0', priceYearly: '0' }];
                  setConfig({ ...config, pricing: newList });
                }}
                className="w-full py-4 bg-white/5 border border-dashed border-border/50 rounded-2xl text-silver/40 font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
               >
                 <span className="material-symbols-outlined text-sm">add</span>
                 Add New Pricing Tier
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CmsEditor;
