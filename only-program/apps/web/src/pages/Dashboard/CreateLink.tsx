import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { toast } from 'react-hot-toast';

export default function CreateLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Profile, 2: Domain, 3: Payment

  // Step 1: Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    subtitle: '',
    slug: '',
    folder: '', // New folder field
    photo: null as File | null,
    photoPreview: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder State
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  const handleDeleteFolder = async (folderName: string) => {
    if (!confirm(`¿Eliminar carpeta "${folderName}"? Los links dentro quedarán sin carpeta.`)) return;

    const { error } = await supabase
      .from('smart_links')
      .update({ folder: null })
      .eq('folder', folderName)
      .eq('user_id', user?.id);

    if (!error) {
      toast.success(`Carpeta "${folderName}" eliminada`);
      setExistingFolders(prev => prev.filter(f => f !== folderName));
      if (profileData.folder === folderName) {
        setProfileData(prev => ({ ...prev, folder: '' }));
      }
    } else {
      toast.error("Error al eliminar carpeta");
    }
  };

  // Step 2: Domain State
  const [domain, setDomain] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [domainResult, setDomainResult] = useState<{ available: boolean; price: string; domain: string } | null>(null);

  useEffect(() => {
    if (user) {
      // Fetch existing folders from config.folder (where Links.tsx stores them)
      const fetchFolders = async () => {
        const { data } = await supabase
          .from('smart_links')
          .select('config, folder')
          .eq('user_id', user.id);

        if (data) {
          const allFolders: string[] = [];
          data.forEach(d => {
            // Check top-level folder field
            if (d.folder && typeof d.folder === 'string' && d.folder.trim()) {
              allFolders.push(d.folder.trim());
            }
            // Check config.folder (where Links.tsx saves it)
            if (d.config && typeof d.config === 'object' && (d.config as any).folder) {
              const cf = (d.config as any).folder;
              if (typeof cf === 'string' && cf.trim()) {
                allFolders.push(cf.trim());
              }
            }
          });
          const unique = Array.from(new Set(allFolders));
          setExistingFolders(unique);
        }
      };
      fetchFolders();
    }

    if (editId && user) {
      const fetchLink = async () => {
        // Load from localStorage (drafts) or skip if it's a DB link (shouldn't happen in new flow)
        if (!editId) return;

        try {
          const saved = localStorage.getItem('my_links_data');
          if (saved) {
            const drafts = JSON.parse(saved);
            if (Array.isArray(drafts)) {
              const draft = drafts.find((d: any) => d.id === editId);
              if (draft) {
                setProfileData({
                  name: draft.profileName || '',
                  subtitle: draft.name || '',
                  slug: '',
                  folder: draft.folder || '',
                  photo: null,
                  photoPreview: draft.profileImage || ''
                });
              }
            }
          }
        } catch (e) {
          console.error('Error loading draft from localStorage:', e);
        }
      };
      fetchLink();
    }
  }, [editId, user]);

  // Handlers
  const handleProfileChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProfileChange('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        handleProfileChange('photoPreview', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDomainSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setIsSearching(true);
    setDomainResult(null);

    // Simulation
    setTimeout(() => {
      const isAvailable = !domain.includes('google') && !domain.includes('facebook');
      setDomainResult({
        domain: domain.includes('.') ? domain : `${domain}.com`,
        available: isAvailable,
        price: isAvailable ? '$12.00 / año' : '',
      });
      setIsSearching(false);
    }, 1200);
  };

  // Auto-save draft on step change or unmount
  const saveDraft = async (silent = true) => {
    if (!user || !profileData.name) return; // Need at least a name

    try {
      // Create draft ID (temporary, will be replaced on payment)
      const draftId = editId || `draft_${Date.now()}`;

      // Photo URL
      const photoUrl = profileData.photoPreview || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (profileData.slug || 'draft');

      // Construct draft object
      const draftLink = {
        id: draftId,
        status: 'draft',
        name: profileData.subtitle || profileData.name || 'Mi Link',
        profileName: profileData.name,
        profileImage: photoUrl,
        profileImageSize: 50,
        folder: profileData.folder || '',
        template: 'minimal',
        landingMode: 'circle',
        theme: {
          pageBorderColor: '#333333',
          overlayOpacity: 40,
          backgroundType: 'solid',
          backgroundStart: '#000000',
          backgroundEnd: '#1a1a1a'
        },
        buttons: []
      };

      // Save to localStorage
      const saved = localStorage.getItem('my_links_data');
      const existing = saved ? JSON.parse(saved) : [];
      const existingArray = Array.isArray(existing) ? existing : [];

      // Update or add
      const draftIndex = existingArray.findIndex((p: any) => p.id === draftId);
      if (draftIndex >= 0) {
        existingArray[draftIndex] = draftLink;
      } else {
        existingArray.push(draftLink);
      }

      localStorage.setItem('my_links_data', JSON.stringify(existingArray));

      if (!silent) {
        toast.success("Borrador guardado en tu navegador");
      }
    } catch (err) {
      console.error("Error saving draft:", err);
    }
  };

  // Auto-save when moving between steps
  useEffect(() => {
    if (step > 1) {
      saveDraft(true);
    }
  }, [step]);

  const handleFinish = async () => {
    if (!user) return;
    try {
      // Final save ensures everything is up to date
      await saveDraft(false); // explicit save

      // Navigate to links page
      navigate('/dashboard/links');
    } catch (err) {
      console.error(err);
      toast.error("Error al finalizar");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative pb-20">

      {/* Progress Steps */}
      <div className="flex justify-between items-center max-w-xl mx-auto mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -z-10 rounded-full"></div>
        <div className={`absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>

        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex flex-col items-center gap-2 ${step >= s ? 'text-primary' : 'text-silver/40'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${step >= s ? 'bg-black border-primary text-primary' : 'bg-black border-white/10 text-silver/40'}`}>
              {step > s ? <span className="material-symbols-outlined font-black">check</span> : <span className="font-black text-lg">{s}</span>}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-black px-2">
              {s === 1 ? 'Perfil' : s === 2 ? 'Dominio' : 'Pago'}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: PROFILE */}
      {step === 1 && (
        <div className="animate-slide-up space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">Crea tu Identidad</h1>
            <p className="text-silver/60 font-medium">Configura cómo te verán tus seguidores.</p>
          </div>

          <div className="bg-surface/50 border border-border rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto">
            {/* Photo Upload */}
            <div className="flex justify-center mb-8">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-32 h-32 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-primary transition-colors bg-black/40">
                  {profileData.photoPreview ? (
                    <img src={profileData.photoPreview} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-silver/40 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-3xl mb-1">cloud_upload</span>
                      <span className="text-[10px] uppercase font-bold">Subir Foto</span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-4 border-[#111]">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-silver/60 pl-4">Nombre Público</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-silver/60 pl-4">Profesión / Subtítulo</label>
                <input
                  type="text"
                  value={profileData.subtitle}
                  onChange={(e) => handleProfileChange('subtitle', e.target.value)}
                  placeholder="Ej. Creador de Contenido"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Folder Selection (Custom Combobox) */}
              <div className="space-y-2 relative">
                <label className="text-xs font-black uppercase tracking-widest text-silver/60 pl-4">Carpeta / Proyecto</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profileData.folder}
                    onChange={(e) => handleProfileChange('folder', e.target.value)}
                    placeholder="Seleccionar o crear carpeta..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                    type="button"
                    className={`w-14 h-full bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-silver hover:text-white hover:bg-white/10 transition-all ${showFolderDropdown ? 'border-primary text-primary bg-primary/10' : ''}`}
                  >
                    <span className="material-symbols-outlined">expand_more</span>
                  </button>
                </div>

                {/* Dropdown List */}
                {showFolderDropdown && existingFolders.length > 0 && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                    {existingFolders.map(folder => (
                      <div key={folder} className="flex items-center justify-between p-3 hover:bg-white/5 group border-b border-white/5 last:border-0 transition-colors">
                        <button
                          type="button"
                          onClick={() => {
                            handleProfileChange('folder', folder);
                            setShowFolderDropdown(false);
                          }}
                          className="flex-1 text-left font-bold text-sm text-silver group-hover:text-white flex items-center gap-2 pl-2"
                        >
                          <span className="material-symbols-outlined text-lg opacity-50">folder</span>
                          {folder}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar carpeta"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-silver/60 pl-4">URL Personalizada (Slug)</label>
                <div className="flex items-center bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus-within:border-primary transition-colors">
                  <span className="text-silver/40 font-mono mr-1">onlyprogram.com/</span>
                  <input
                    type="text"
                    value={profileData.slug}
                    onChange={(e) => handleProfileChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="juan-perez"
                    className="flex-1 bg-transparent text-white font-bold focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
              <button
                onClick={() => {
                  if (!profileData.name || !profileData.slug) return toast.error("Nombre y URL son obligatorios");
                  setStep(2);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] hover:scale-105 transition-all flex items-center gap-3"
              >
                SIGUIENTE PASO <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* STEP 2: DOMAIN */}
      {
        step === 2 && (
          <div className="animate-slide-up space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">Elige tu Dominio</h1>
              <p className="text-silver/60 font-medium">Puedes usar un dominio gratuito o conectar el tuyo.</p>
            </div>

            <div className="max-w-3xl mx-auto bg-surface/50 border border-border rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl">
              <form onSubmit={handleDomainSearch} className="space-y-8">
                <div className="relative group">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value.toLowerCase())}
                    placeholder="Buscar dominio personalizado..."
                    className="w-full bg-background-dark/30 border-2 border-border/50 rounded-2xl px-6 py-5 text-xl text-white focus:outline-none focus:border-primary transition-all pr-36 placeholder:text-silver/20 font-bold"
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !domain}
                    className="absolute right-2.5 top-2.5 bottom-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-8 rounded-xl font-black transition-all flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95"
                  >
                    {isSearching ? <span className="animate-spin material-symbols-outlined">progress_activity</span> : 'Buscar'}
                  </button>
                </div>
              </form>

              {domainResult && (
                <div className={`mt-8 p-6 rounded-2xl border-2 ${domainResult.available ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-white">{domainResult.domain}</h4>
                      <p className={domainResult.available ? 'text-green-400' : 'text-red-400'}>{domainResult.available ? 'Disponible' : 'No disponible'}</p>
                    </div>
                    {domainResult.available && (
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-white">{domainResult.price}</span>
                        <button onClick={() => setStep(3)} className="bg-white text-black px-6 py-2 rounded-xl font-black hover:scale-105 transition-transform">Seleccionar</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <button onClick={() => setStep(1)} className="text-silver/60 hover:text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined">arrow_back</span> Atrás</button>
                <button onClick={() => setStep(3)} className="text-silver/40 hover:text-white text-xs font-bold uppercase tracking-widest">Saltar por ahora</button>
              </div>
            </div>
          </div>
        )
      }

      {/* STEP 3: PAYMENT & SUMMARY */}
      {
        step === 3 && (
          <div className="animate-slide-up space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">Resumen</h1>
              <p className="text-silver/60 font-medium">Revisa los detalles antes de crear tu perfil.</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-surface/50 border border-border rounded-[2.5rem] p-8 overflow-hidden relative">
                <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-8">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden border border-white/10">
                    {profileData.photoPreview ? <img src={profileData.photoPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-silver/20 text-3xl">person</span></div>}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{profileData.name}</h3>
                    <p className="text-silver/60">@{profileData.slug}</p>
                    <p className="text-silver/40 text-sm mt-1">{profileData.subtitle}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-silver/60 font-medium">Plan</span>
                    <span className="text-white font-bold">Standard</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-silver/60 font-medium">Dominio</span>
                    <span className="text-white font-bold">{domainResult?.domain || 'Subdominio Gratuito'}</span>
                  </div>
                  {domainResult?.available && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-silver/60 font-medium">Costo Dominio</span>
                      <span className="text-white font-bold">{domainResult.price}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xl">
                    <span className="text-white font-black">Total</span>
                    <span className="text-primary font-black">$0.00</span>
                  </div>
                  <p className="text-xs text-center text-silver/30 mt-4">* El pago se procesará en el siguiente paso.</p>
                </div>
              </div>

              <div className="flex justify-between items-center px-4">
                <button onClick={() => setStep(2)} className="text-silver/60 hover:text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined">arrow_back</span> Atrás</button>
                <button
                  onClick={handleFinish}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] hover:scale-105 transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined">rocket_launch</span>
                  CREAR PERFIL
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
