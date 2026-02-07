import { ChangeEvent } from 'react';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageChange: (base64: string) => void;
  label: string;
  maxSizeMB?: number;
}

export default function ImageUploader({ 
  currentImage, 
  onImageChange, 
  label,
  maxSizeMB = 2
}: ImageUploaderProps) {
  
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`La imagen no debe superar ${maxSizeMB}MB`);
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onImageChange(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">
        {label}
      </label>
      
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-20 h-20 rounded-xl bg-background-dark/50 border border-border flex items-center justify-center overflow-hidden">
          {currentImage ? (
            <img 
              src={currentImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-silver/20 text-3xl">
              add_photo_alternate
            </span>
          )}
        </div>

        {/* Upload button */}
        <label className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="px-4 py-3 bg-surface border border-border rounded-xl text-white text-sm font-semibold cursor-pointer hover:border-primary/50 transition-all text-center">
            {currentImage ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
          </div>
        </label>

        {/* Remove button */}
        {currentImage && (
          <button
            onClick={() => onImageChange('')}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        )}
      </div>

      <p className="text-[10px] text-silver/40">
        Máximo {maxSizeMB}MB • JPG, PNG, WEBP
      </p>
    </div>
  );
}
