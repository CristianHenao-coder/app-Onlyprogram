import DashboardLayout from '@/components/DashboardLayout';

export default function Telegram() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitor de Telegram Rotativo</h1>
          <p className="text-silver/60 text-sm">Gestión centralizada de canales y rotación de tráfico.</p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Nuevo Canal
        </button>
      </div>
      
      <div className="bg-surface/30 border border-border rounded-2xl p-12 text-center">
         <span className="material-symbols-outlined text-6xl text-silver/20 mb-4">analytics</span>
         <p className="text-silver/40">Próximamente: Configura tus canales rotativos aquí.</p>
      </div>
    </div>
  );
}
