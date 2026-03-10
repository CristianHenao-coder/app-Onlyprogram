import { useState } from 'react';
import Logo from './Logo';
import { useTranslation } from "@/contexts/I18nContext";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from '@/services/apiConfig';

// ───────────── Lista de países con indicativo ─────────────
const COUNTRIES = [
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { code: 'US', name: 'Estados Unidos', dial: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', dial: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', dial: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
  { code: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷' },
  { code: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dial: '+504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', dial: '+505', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', dial: '+507', flag: '🇵🇦' },
  { code: 'DO', name: 'Rep. Dominicana', dial: '+1809', flag: '🇩🇴' },
  { code: 'CU', name: 'Cuba', dial: '+53', flag: '🇨🇺' },
  { code: 'ES', name: 'España', dial: '+34', flag: '🇪🇸' },
  { code: 'BR', name: 'Brasil', dial: '+55', flag: '🇧🇷' },
  { code: 'GB', name: 'Reino Unido', dial: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canadá', dial: '+1', flag: '🇨🇦' },
  { code: 'DE', name: 'Alemania', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'Francia', dial: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', dial: '+39', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
];

// ───────────── Validaciones individuales ─────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

function validateField(name: string, value: string): string {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'El nombre es obligatorio.';
      if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
      return '';
    case 'email':
      if (!value.trim()) return 'El correo electrónico es obligatorio.';
      if (!EMAIL_REGEX.test(value.trim())) return 'Ingresa un correo electrónico válido (ej. nombre@dominio.com).';
      return '';
    case 'phone':
      if (!value.trim()) return 'El número de celular es obligatorio.';
      if (value.replace(/\D/g, '').length < 6) return 'El número de celular parece muy corto.';
      return '';
    case 'message':
      if (!value.trim()) return 'El mensaje es obligatorio.';
      if (value.trim().length < 10) return 'El mensaje debe tener al menos 10 caracteres.';
      return '';
    default:
      return '';
  }
}

// ───────────── Componente de campo con error inline ─────────────
function FieldError({ msg }: { msg?: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-center gap-1.5 mt-1"
        >
          <span className="material-symbols-outlined text-red-400 text-[13px] shrink-0">error</span>
          <p className="text-[11px] text-red-400 font-medium">{msg}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Footer() {
  const { t } = useTranslation() as any;

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Colombia por defecto
  const [phoneNumber, setPhoneNumber] = useState('');            // solo el número sin indicativo
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
    setSubmitError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s\-\(\)]/g, ''); // solo dígitos y separadores
    setPhoneNumber(val);
    if (touched.phone) {
      setFieldErrors(prev => ({ ...prev, phone: validateField('phone', val) }));
    }
    setSubmitError('');
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = COUNTRIES.find(c => c.code === e.target.value);
    if (found) setSelectedCountry(found);
  };

  const handleBlur = (name: string, value: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Marcar todos como tocados y validar
    const allTouched = { name: true, email: true, phone: true, message: true };
    setTouched(allTouched);
    const errs: FieldErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      phone: validateField('phone', phoneNumber),
      message: validateField('message', form.message),
    };
    setFieldErrors(errs);
    if (Object.values(errs).some(v => v)) return; // hay errores

    const fullPhone = `${selectedCountry.dial} ${phoneNumber}`.trim();
    setSending(true);
    setSubmitError('');
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), phone: fullPhone, message: form.message.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al enviar');
      setSent(true);
      setForm({ name: '', email: '', message: '' });
      setPhoneNumber('');
      setTouched({});
      setFieldErrors({});
    } catch (err: any) {
      setSubmitError(err.message || 'No se pudo enviar el mensaje. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-white/5 border rounded-2xl py-4 px-6 text-white placeholder:text-silver/20 focus:outline-none transition-all ${touched[field] && fieldErrors[field as keyof FieldErrors]
      ? 'border-red-500/60 focus:border-red-400 focus:ring-1 focus:ring-red-500/20'
      : 'border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
    }`;

  return (
    <footer className="relative bg-black pt-24 pb-12 overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">

          {/* Left Column */}
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo className="h-10 w-10" />
                <span className="text-xl font-black text-white uppercase tracking-tighter">
                  Only <span className="text-primary">Program</span>
                </span>
              </div>
              <p className="text-silver/50 text-lg leading-relaxed max-w-md">{t("footer.description")}</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-[1px] bg-primary"></span>
                {t("footer.contactTitle")}
              </h3>
              <div className="space-y-4">
                <a href="mailto:onlyprogram777@gmail.com" className="flex items-center gap-4 group transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
                    <span className="material-symbols-outlined text-silver/60 group-hover:text-primary transition-colors">mail</span>
                  </div>
                  <div>
                    <p className="text-xs text-silver/40 uppercase font-black tracking-widest">Email</p>
                    <p className="text-white font-medium group-hover:text-primary transition-colors">onlyprogram777@gmail.com</p>
                  </div>
                </a>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-silver/60">public</span>
                  </div>
                  <div>
                    <p className="text-xs text-silver/40 uppercase font-black tracking-widest">Web</p>
                    <p className="text-white font-medium">www.onlyprogram.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <motion.a href="https://t.me/blackproonlyfans" target="_blank" rel="noopener noreferrer" whileHover={{ y: -4 }}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-primary hover:border-primary/30 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.441z" />
                </svg>
              </motion.a>
              <motion.a href="http://instagram.com/blackonlypro/" target="_blank" rel="noopener noreferrer" whileHover={{ y: -4 }}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-primary hover:border-primary/30 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </motion.a>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full" />
            <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 sm:p-10 shadow-2xl">
              <h4 className="text-2xl font-black text-white mb-1">{t("footer.contactTitle")}</h4>
              <p className="text-silver/40 text-sm mb-7">{t("footer.contactSubtitle")}</p>

              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-green-400">check_circle</span>
                  </div>
                  <p className="text-green-400 font-black text-lg">{t("footer.success")}</p>
                  <p className="text-silver/40 text-sm">Nos pondremos en contacto contigo pronto.</p>
                  <button onClick={() => setSent(false)} className="text-xs text-silver/40 hover:text-white transition-colors underline mt-2">
                    Enviar otro mensaje
                  </button>
                </motion.div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit} noValidate>

                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-black text-silver/40 uppercase tracking-widest ml-1 flex items-center gap-1 mb-1.5">
                      {t("footer.labelName")} <span className="text-primary">*</span>
                    </label>
                    <input type="text" name="name" value={form.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('name', form.name)}
                      placeholder="Jane Doe"
                      className={inputClass('name')} />
                    <FieldError msg={touched.name ? fieldErrors.name : undefined} />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-black text-silver/40 uppercase tracking-widest ml-1 flex items-center gap-1 mb-1.5">
                      {t("footer.labelEmail")} <span className="text-primary">*</span>
                    </label>
                    <input type="email" name="email" value={form.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email', form.email)}
                      placeholder="jane@example.com"
                      className={inputClass('email')} />
                    <FieldError msg={touched.email ? fieldErrors.email : undefined} />
                  </div>

                  {/* Celular con selector de país */}
                  <div>
                    <label className="text-xs font-black text-silver/40 uppercase tracking-widest ml-1 flex items-center gap-1 mb-1.5">
                      {t("footer.labelPhone")} <span className="text-primary">*</span>
                    </label>
                    <div className={`flex gap-0 border rounded-2xl overflow-hidden transition-all ${touched.phone && fieldErrors.phone
                        ? 'border-red-500/60'
                        : 'border-white/10 focus-within:border-primary/50'
                      } bg-white/5`}>
                      {/* Country picker */}
                      <div className="relative flex-shrink-0">
                        <select
                          value={selectedCountry.code}
                          onChange={handleCountryChange}
                          className="appearance-none h-full bg-white/5 border-r border-white/10 text-white text-sm pl-3 pr-8 font-mono cursor-pointer focus:outline-none"
                          style={{ WebkitAppearance: 'none' }}
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code} style={{ background: '#0a0a0a' }}>
                              {c.flag} {c.dial}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-silver/40 text-[14px]">
                          expand_more
                        </span>
                      </div>
                      {/* Number input */}
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        onBlur={() => handleBlur('phone', phoneNumber)}
                        placeholder="300 000 0000"
                        className="flex-1 bg-transparent py-4 px-4 text-white placeholder:text-silver/20 focus:outline-none"
                      />
                    </div>
                    {/* Country hint */}
                    <p className="text-[10px] text-silver/30 ml-1 mt-1">
                      {selectedCountry.flag} {selectedCountry.name} — indicativo: <span className="text-primary font-mono">{selectedCountry.dial}</span>
                    </p>
                    <FieldError msg={touched.phone ? fieldErrors.phone : undefined} />
                  </div>

                  {/* Mensaje */}
                  <div>
                    <label className="text-xs font-black text-silver/40 uppercase tracking-widest ml-1 flex items-center gap-1 mb-1.5">
                      {t("footer.labelMessage")} <span className="text-primary">*</span>
                    </label>
                    <textarea name="message" rows={4} value={form.message}
                      onChange={handleChange}
                      onBlur={() => handleBlur('message', form.message)}
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                      className={`${inputClass('message')} resize-none`} />
                    <div className="flex items-center justify-between mt-1">
                      <FieldError msg={touched.message ? fieldErrors.message : undefined} />
                      <span className={`text-[10px] font-mono ml-auto ${form.message.length < 10 && touched.message ? 'text-red-400' : 'text-silver/30'}`}>
                        {form.message.length} / 10 min.
                      </span>
                    </div>
                  </div>

                  {/* Error general de envío */}
                  <AnimatePresence>
                    {submitError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                        <span className="material-symbols-outlined text-red-400 text-base shrink-0">wifi_off</span>
                        <p className="text-xs text-red-400 font-bold">{submitError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button type="submit" disabled={sending}
                    whileHover={sending ? {} : { scale: 1.02 }}
                    whileTap={sending ? {} : { scale: 0.98 }}
                    className="w-full bg-primary py-4 rounded-2xl text-black font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-light transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {sending ? (
                      <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>Enviando...</>
                    ) : t("footer.btnSend")}
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-silver/30 text-xs">© {new Date().getFullYear()} Only Program. {t("footer.rights")}</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-silver/30">
              {t("footer.developedBy")}{' '}
              <span className="font-bold flex items-center gap-1.5 text-silver/60 uppercase group cursor-pointer hover:text-white transition-colors">
                <span className="material-symbols-outlined text-sm text-primary transition-transform group-hover:rotate-12">code</span> Core Devs SAS
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
