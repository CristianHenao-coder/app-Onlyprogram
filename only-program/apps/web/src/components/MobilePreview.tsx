import { LinkEditorData, LinkBlock } from '@/hooks/useLinkEditor';

interface MobilePreviewProps {
  data: LinkEditorData;
}

export default function MobilePreview({ data }: MobilePreviewProps) {
  
  const getBackgroundStyle = () => {
    const { backgroundType, backgroundColor, backgroundGradientStart, backgroundGradientEnd, backgroundImageBase64, backgroundOpacity } = data;
    
    const opacity = backgroundOpacity / 100;
    
    if (backgroundType === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${backgroundGradientStart}, ${backgroundGradientEnd})`,
        opacity,
      };
    }
    
    if (backgroundType === 'image' && backgroundImageBase64) {
      return {
        backgroundImage: `url(${backgroundImageBase64})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity,
      };
    }
    
    return {
      backgroundColor,
      opacity,
    };
  };

  const getButtonShape = (shape?: string) => {
    switch (shape) {
      case 'rounded': return 'rounded-full';
      case 'soft': return 'rounded-2xl';
      case 'square': return 'rounded-lg';
      default: return 'rounded-full';
    }
  };

  const renderBlock = (block: LinkBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div className="w-full px-2" style={{ textAlign: block.align || 'center' }}>
            <p 
               style={{ 
                 color: block.textColor || '#fff',
                 fontSize: data.fontSize,
                 whiteSpace: 'pre-wrap',
                 width: '100%'
               }}
               className="leading-relaxed"
            >
              {block.content || '...'}
            </p>
          </div>
        );
        
      case 'image':
        return (
          <div className="w-full">
             {block.imageBase64 ? (
               <div className="rounded-xl overflow-hidden">
                 <img src={block.imageBase64} alt={block.caption} className="w-full h-auto object-cover" />
               </div>
             ) : (
                <div className="w-full aspect-video bg-white/5 rounded-xl border border-dashed border-white/20 flex items-center justify-center">
                   <span className="material-symbols-outlined text-white/20">image</span>
                </div>
             )}
             {block.caption && (
               <p className="text-[10px] text-center text-white/60 mt-2">{block.caption}</p>
             )}
          </div>
        );

      case 'button':
      default:
        return (
          <div
            className={`
              w-full p-3.5 flex items-center gap-3 shadow-lg transition-all
              ${getButtonShape(block.buttonShape)}
            `}
            style={{
              backgroundColor: (block.buttonColor || '#000') + '20',
              borderWidth: block.borderWidth || 1,
              borderColor: (block.buttonColor || '#000') + '40',
              boxShadow: block.shadowIntensity && block.shadowIntensity > 0 
                ? `0 ${block.shadowIntensity / 10}px ${block.shadowIntensity}px ${(block.buttonColor || '#000')}33`
                : 'none',
              cursor: 'pointer'
            }}
          >
            {/* Icon */}
            <div 
              className={`w-8 h-8 flex items-center justify-center shrink-0 ${getButtonShape(block.buttonShape)}`}
              style={{ backgroundColor: (block.buttonColor || '#000') + '40' }}
            >
              {block.iconBase64 ? (
                <img src={block.iconBase64} alt="" className="w-5 h-5 object-contain" />
              ) : (
                <span className="material-symbols-outlined text-sm" style={{ color: block.textColor }}>
                  {block.iconType || 'link'}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="flex-1 overflow-hidden">
              <p 
                className="text-[12px] font-bold truncate"
                style={{ color: block.textColor, fontSize: data.fontSize - 4 }}
              >
                {block.title || 'Título del botón'}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="sticky top-6">
      <div className="text-[10px] font-bold text-white uppercase tracking-widest mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">smartphone</span>
          Vista Previa Real
        </div>
        <span className="text-primary">Live</span>
      </div>

      {/* iPhone Mockup */}
      <div className="relative mx-auto w-[280px] h-[580px] bg-black rounded-[2.8rem] border-[10px] border-[#161616] shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Notch */}
        <div className="absolute top-0 w-full h-7 bg-black flex justify-center items-center z-20">
          <div className="w-24 h-4 bg-[#161616] rounded-b-2xl"></div>
        </div>

        {/* Screen Content */}
        <div 
          className="h-full w-full flex flex-col p-5 pt-12 relative overflow-y-auto custom-scrollbar"
          style={{
            ...getBackgroundStyle(),
            fontFamily: data.fontFamily
          }}
        >
          {/* Profile Section */}
          <div className="flex flex-col items-center mb-8">
            {/* Profile Photo */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 border border-white/5 flex items-center justify-center mb-4 relative shadow-xl overflow-hidden">
              {data.profilePhotoBase64 ? (
                <img 
                  src={data.profilePhotoBase64} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-primary text-4xl">person</span>
              )}
              
              {/* Verified Badge */}
              {data.verifiedBadge && (
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#0B0B0B] rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[14px] fill-current">
                    verified
                  </span>
                </div>
              )}
            </div>

            {/* Name & Username */}
            <h4 className="text-white font-extrabold text-lg text-center leading-tight">
              {data.displayName || 'Tu Nombre'}
            </h4>
            <p className="text-silver/40 text-[10px] text-center mt-1">
              @{data.username || 'usuario'}
            </p>

            {/* Bio */}
            {data.bio && (
              <p className="text-silver/60 text-[11px] text-center px-4 mt-3 leading-relaxed">
                {data.bio}
              </p>
            )}
          </div>

          {/* Blocks */}
          <div className="space-y-4">
            {data.blocks.filter(b => b.visible).map((block) => (
              <div key={block.id}>
                 {renderBlock(block)}
              </div>
            ))}

            {/* Empty state */}
            {data.blocks.length === 0 && (
              <div className="text-center py-12 text-silver/20">
                <span className="material-symbols-outlined text-4xl mb-2">link_off</span>
                <p className="text-xs">Sin contenido</p>
              </div>
            )}
          </div>

          {/* Footer Branding */}
          <div className="mt-auto flex items-center justify-center gap-1.5 opacity-20 pt-6">
            <span className="material-symbols-outlined text-[10px]">shield</span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">
              Only Program
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
