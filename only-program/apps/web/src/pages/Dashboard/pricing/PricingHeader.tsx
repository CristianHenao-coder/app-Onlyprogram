import React from "react";

const PricingHeader: React.FC = () => {
  return (
    <div className="text-center space-y-4 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[80px] -z-10" />
      <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
        Planes y <span className="text-primary">Servicios</span>
      </h1>
      <p className="text-silver/60 max-w-2xl mx-auto text-sm leading-relaxed">
        Tu Póliza de Seguro Digital. Infraestructura Anti-Baneos B2B para Creadores de Contenido de Alto Riesgo. Diseñada con técnicas de <strong>Hacking Ético</strong> para blindar tus redes sociales y llevar tu tráfico a OnlyFans sin filtros.
      </p>
    </div>
  );
};

export default PricingHeader;
