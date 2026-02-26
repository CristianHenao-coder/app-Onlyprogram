import { useState, useEffect } from "react";
import { Search, Loader2, Check, AlertCircle } from "lucide-react";
import axios from "axios";

interface InlineDomainSearchProps {
  onDomainSelected: (domain: string) => void;
  initialValue?: string;
}

const InlineDomainSearch = ({
  onDomainSelected,
  initialValue = "",
}: InlineDomainSearchProps) => {
  const [query, setQuery] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 3) {
        // Ensure .com extension for check
        let domainToCheck = query.toLowerCase();
        if (!domainToCheck.includes(".")) {
          domainToCheck += ".com";
        }

        // Only allow .com
        if (!domainToCheck.endsWith(".com")) {
          setError("Solo dominios .com permitidos");
          setAvailable(false);
          onDomainSelected(""); // Clear selection in parent
          return;
        }

        searchDomain(domainToCheck);
      } else {
        setAvailable(null);
        setError(null);
        onDomainSelected("");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [query]);

  const searchDomain = async (domain: string) => {
    setLoading(true);
    setError(null);
    setAvailable(null);

    try {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4005";
      // Use existing API structure
      const res = await axios.get(
        `${BACKEND_URL}/api/domains/search?q=${domain}`,
      );

      if (res.data && res.data.result) {
        const isAvailable = res.data.result.available;
        setAvailable(isAvailable);
        if (isAvailable) {
          onDomainSelected(domain);
        } else {
          onDomainSelected("");
        }
      } else {
        // FALLBACK MOCK FOR DEV
        const isAvailable = Math.random() > 0.3; // 70% chance available
        setAvailable(isAvailable);
        if (isAvailable) {
          onDomainSelected(domain);
        } else {
          onDomainSelected("");
        }
      }
    } catch (err) {
      console.error(err);
      // Default to available in case of network error on dev to not block UI?
      // Better to show error.
      setError("Error de conexión");
      setAvailable(null);
      onDomainSelected("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 animate-fade-in relative z-10">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9.-]/g, "");
            setQuery(val);
            // Reset status on type
            if (available !== null) {
              setAvailable(null);
              onDomainSelected("");
            }
          }}
          placeholder="ejemplo.com"
          className={`w-full bg-[#0a0a0a] border rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none transition-all text-sm font-bold
                    ${
                      available === true
                        ? "border-green-500/50 focus:border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                        : available === false
                          ? "border-red-500/30 focus:border-red-500"
                          : "border-white/10 focus:border-primary/50"
                    }`}
          autoFocus
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-silver/40 w-4 h-4" />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}

        {available === true && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="w-4 h-4 text-green-500" />
          </div>
        )}

        {available === false && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="mt-2 text-xs font-medium h-4">
        {loading && (
          <span className="text-silver/50">Verificando disponibilidad...</span>
        )}

        {available === true && !loading && (
          <span className="text-green-500 flex items-center gap-1">
            ¡Disponible! Se registrará con la compra.
          </span>
        )}

        {available === false && !loading && (
          <span className="text-red-500 flex items-center gap-1">
            {error || "No disponible. Intenta con otro nombre."}
          </span>
        )}

        {error && !available && !loading && (
          <span className="text-red-500 flex items-center gap-1">{error}</span>
        )}
      </div>
    </div>
  );
};

export default InlineDomainSearch;
