import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsService, Payment } from "../../services/payments.service";
import { supabase } from "../../services/supabase";
import PaymentSelector from "@/components/PaymentSelector";
import toast from "react-hot-toast";

export default function Payments() {
  const location = useLocation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "paypal" | "crypto"
  >("card");
  const [useNewMethod, setUseNewMethod] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "payment" | "domain_choice" | "request_sent"
  >("payment");
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);

  // Domain selection states (reused from Domains.tsx logic if needed)
  const [domainFlow, setDomainFlow] = useState<"buy" | "connect" | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await paymentsService.getHistory();
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method: "card" | "paypal" | "crypto") => {
    setSelectedPaymentMethod(method);
  };

  const handlePaymentSuccess = async (data?: any) => {
    const pendingPurchase = location.state?.pendingPurchase;
    if (!pendingPurchase) return;

    // If we have data from the transaction (like the new linkId), store it
    if (data?.linkId) {
      setActiveLinkId(data.linkId);
    } else if (pendingPurchase.linksData?.[0]?.id) {
      // Fallback: try to guess if it's already a real ID
      setActiveLinkId(pendingPurchase.linksData[0].id);
    }

    const toastId = toast.loading("Finalizando tu configuración...");
    try {
      if (pendingPurchase.type === "domains_bundle") {
        const { items, domainsInput } = pendingPurchase;

        for (const [linkId, action] of Object.entries(items)) {
          if (action === "connect" && domainsInput[linkId]) {
            const domain = domainsInput[linkId];
            console.log(`Fulfilling connection of ${domain} to link ${linkId}`);

            // Clear domain from any other link
            await supabase
              .from("smart_links")
              .update({ custom_domain: null })
              .eq("custom_domain", domain);

            // Assign to current link
            const { error } = await supabase
              .from("smart_links")
              .update({
                custom_domain: domain,
                status: "active",
                is_active: true,
              })
              .eq("id", linkId);

            if (error) throw error;
          }
        }
        toast.success("¡Configuración de dominios completada!", {
          id: toastId,
        });
      } else if (
        ["extra_links", "links_bundle", "link_with_domain"].includes(
          pendingPurchase.type,
        )
      ) {
        // Cleanup localStorage drafts
        localStorage.removeItem("my_links_data");
        toast.success("¡Links activados correctamente!", { id: toastId });
      }

      // Transition to domain selection instead of immediate redirect
      setCurrentStep("domain_choice");
    } catch (error) {
      console.error("Error in fulfillment:", error);
      toast.error("Error al finalizar la configuración. Contacta a soporte.", {
        id: toastId,
      });
    }
  };

  const handleDomainSubmit = async (
    flow: "buy" | "connect",
    domain: string,
  ) => {
    if (!domain) {
      toast.error("Por favor ingresa un dominio");
      return;
    }

    // Since we might not have the linkId if it was just created by the backend webhook,
    // we search for the last created link by the user if linkId is missing.
    let linkId = activeLinkId;

    if (!linkId || linkId.startsWith("page") || linkId.startsWith("draft")) {
      // Try to find the latest active link for this user
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error("Usuario no autenticado.");
        return;
      }

      const { data: latestLink } = await supabase
        .from("smart_links")
        .select("id")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestLink) {
        linkId = latestLink.id;
        setActiveLinkId(linkId);
      }
    }

    if (!linkId) {
      toast.error("No se pudo identificar el link para vincular el dominio.");
      return;
    }

    setIsSubmittingDomain(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token || "";

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/domains/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            linkId,
            domain,
            reservation_type: flow === "buy" ? "buy_new" : "connect_own",
          }),
        },
      );

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Error al procesar la solicitud");

      toast.success(
        flow === "buy"
          ? "¡Dominio reservado!"
          : "¡Solicitud de vinculación enviada!",
      );
      setCurrentStep("request_sent");
    } catch (err: any) {
      toast.error(err.message || "Error al configurar el dominio");
    } finally {
      setIsSubmittingDomain(false);
    }
  };

  const handleDomainCancel = () => {
    navigate("/dashboard/home");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="animate-spin material-symbols-outlined text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  const hasSavedMethod = payments.length > 0;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto pb-20 animate-fade-in">
      {currentStep === "payment" && (
        <>
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
              Registra tu Pago
            </h1>
            <p className="text-silver/60 max-w-2xl mx-auto font-medium">
              Completa tu proceso para activar tus servicios exclusivos.
            </p>
          </div>

          {/* Order Summary Section */}
          {hasSavedMethod && (
            <p className="text-xs text-silver/40 text-center uppercase tracking-widest -mb-4">
              Información de tu suscripción activa
            </p>
          )}
          {location.state?.pendingPurchase && (
            <div className="bg-surface/40 border border-border rounded-3xl p-8 mb-8 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-9xl text-primary">
                  shopping_cart
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  receipt_long
                </span>
                Resumen de Compra
              </h2>

              <div className="space-y-4 max-w-lg relative z-10">
                <div className="flex justify-between items-center text-silver">
                  <span>
                    {location.state.pendingPurchase.type === "domains_bundle"
                      ? "Conexión de Dominios"
                      : "Links Adicionales"}
                  </span>
                  <span className="font-mono">
                    ${location.state.pendingPurchase.amount.toFixed(2)}
                  </span>
                </div>

                {location.state.pendingPurchase.discountApplied && (
                  <div className="flex justify-between items-center text-green-400 text-sm">
                    <span>
                      Descuento (
                      {location.state.pendingPurchase.discountApplied.code})
                    </span>
                    <span className="font-mono">
                      -$
                      {location.state.pendingPurchase.discountApplied.amount.toFixed(
                        2,
                      )}
                    </span>
                  </div>
                )}

                <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                  <span className="text-xl font-bold text-white">
                    Total a Pagar
                  </span>
                  <span className="text-3xl font-black text-primary">
                    ${location.state.pendingPurchase.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Section */}
          <div className="bg-surface/40 border border-border rounded-3xl p-8 md:p-12 shadow-2xl animate-fade-in">
            {useNewMethod && (
              <button
                onClick={() => setUseNewMethod(false)}
                className="mb-6 text-silver/60 hover:text-white text-sm font-bold flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-sm">
                  arrow_back
                </span>
                Volver al método guardado
              </button>
            )}

            <PaymentSelector
              onSelect={handlePaymentMethodSelect}
              initialMethod={selectedPaymentMethod}
              amount={location.state?.pendingPurchase?.amount || 10}
              onSuccess={handlePaymentSuccess}
              linksData={location.state?.pendingPurchase?.linksData}
              customDomain={location.state?.pendingPurchase?.customDomain}
            />
          </div>
        </>
      )}

      {/* STEP 2: DOMAIN CHOICE */}
      {currentStep === "domain_choice" && (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-emerald-400">
                check_circle
              </span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">
              ¡Pago Exitoso!
            </h1>
            <p className="text-silver/60 text-lg">
              Tus links han sido activados. Ahora, configuremos tu dominio para
              que tu sitio sea profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OPTION 1: Buy New */}
            <button
              onClick={() => {
                // Redirect to links or handle buy flow
                navigate("/dashboard/links");
              }}
              className="group bg-surface/40 border border-border hover:border-primary/50 rounded-[2.5rem] p-8 text-left transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl text-primary">
                  add_shopping_cart
                </span>
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">
                  language
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Comprar Nuevo Dominio
              </h3>
              <p className="text-silver/50 text-sm leading-relaxed mb-4">
                Busca y registra un nombre profesional .com. Nosotros nos
                encargamos de toda la configuración técnica.
              </p>
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span>Buscar ahora</span>
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </div>
            </button>

            {/* OPTION 2: Connect Own */}
            <div className="group bg-surface/40 border border-border rounded-[2.5rem] p-8 text-left transition-all relative">
              {domainFlow === "connect" ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      Conectar mi Dominio
                    </h3>
                    <button
                      onClick={() => setDomainFlow(null)}
                      className="text-silver/40 hover:text-white"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">
                      Ingresa tu dominio (ej: misitio.com)
                    </label>
                    <input
                      type="text"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="tudominio.com"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all font-mono"
                    />
                  </div>
                  <button
                    onClick={() => handleDomainSubmit("connect", domainInput)}
                    disabled={isSubmittingDomain}
                    className="w-full py-4 bg-primary text-white font-black rounded-xl hover:bg-primary-light transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {isSubmittingDomain ? (
                      <span className="animate-spin material-symbols-outlined">
                        progress_activity
                      </span>
                    ) : (
                      "Vincular ahora"
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDomainFlow("connect")}
                  className="w-full h-full text-left"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-8xl text-purple-400">
                      link
                    </span>
                  </div>
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">
                      dns
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Conectar Dominio Propio
                  </h3>
                  <p className="text-silver/50 text-sm leading-relaxed mb-4">
                    ¿Ya tienes un dominio? Apunta tus DNS a nuestro servidor y
                    nosotros lo vinculamos a tu cuenta.
                  </p>
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <span>Configurar ahora</span>
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleDomainCancel}
              className="text-silver/40 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto"
            >
              Configurar después
              <span className="material-symbols-outlined text-lg">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REQUEST SENT */}
      {currentStep === "request_sent" && (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-fade-in">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <span className="material-symbols-outlined text-5xl text-primary">
              send
            </span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">
              ¡Solicitud Recibida!
            </h1>
            <p className="text-silver/60 text-lg leading-relaxed">
              Nuestro equipo ha recibido tu solicitud. Estaremos configurando tu
              dominio en las próximas horas. Te notificaremos por correo cuando
              esté listo.
            </p>
          </div>

          <div className="pt-8 flex flex-col items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/links")}
              className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-silver transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              Ir a mis Links
            </button>
            <p className="text-silver/30 text-xs italic">
              Puedes ver el estado de tu dominio en la pestaña Dominio de cada
              link.
            </p>
          </div>
        </div>
      )}

      {/* Decorative Footer */}
      <div className="bg-surface/20 border border-white/5 rounded-2xl p-8">
        <h3 className="text-center text-xs font-black text-silver/40 uppercase tracking-widest mb-6">
          Métodos de Pago Aceptados
        </h3>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-500 text-2xl">
                currency_bitcoin
              </span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">
              Crypto
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-[#0070ba]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0070ba] text-2xl">
                account_balance_wallet
              </span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">
              PayPal
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-2xl">
                credit_card
              </span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">
              Mastercard
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
