import Logo from './Logo';
import { useTranslation } from "@/contexts/I18nContext";
import { motion } from "framer-motion";

export default function Footer() {
  const { t } = useTranslation() as any;
  
  return (
    <footer className="relative bg-black pt-24 pb-12 overflow-hidden border-t border-white/5">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          
          {/* Left Column: Contact Info & Brand */}
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo className="h-10 w-10" />
                <span className="text-xl font-black text-white uppercase tracking-tighter">
                  Only <span className="text-primary">Program</span>
                </span>
              </div>
              <p className="text-silver/50 text-lg leading-relaxed max-w-md">
                {t("footer.description")}
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-[1px] bg-primary"></span>
                {t("footer.contactTitle")}
              </h3>
              
              <div className="space-y-4">
                <a 
                  href="mailto:onlyprogram777@gmail.com" 
                  className="flex items-center gap-4 group transition-all duration-300"
                >
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

            {/* Socials */}
            <div className="flex gap-4">
              {['telegram', 'instagram', 'twitter'].map((social) => (
                <motion.a
                  key={social}
                  href="#"
                  whileHover={{ y: -4 }}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-silver/40 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <span className="material-symbols-outlined text-xl">
                    {social === 'telegram' ? 'send' : social === 'instagram' ? 'camera' : 'share'}
                  </span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full" />
            <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 sm:p-10 shadow-2xl">
              <h4 className="text-2xl font-black text-white mb-2">{t("footer.contactTitle")}</h4>
              <p className="text-silver/40 mb-8">{t("footer.contactSubtitle")}</p>
              
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <label className="text-xs font-black text-silver/40 uppercase tracking-widest ml-1">
                    {t("footer.labelName")}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Jane Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-silver/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-silver/40 uppercase tracking-widest ml-1">
                    {t("footer.labelEmail")}
                  </label>
                  <input 
                    type="email" 
                    placeholder="jane@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-silver/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-silver/40 uppercase tracking-widest ml-1">
                    {t("footer.labelMessage")}
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-silver/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary py-4 rounded-2xl text-black font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-light transition-all mt-4"
                >
                  {t("footer.btnSend")}
                </motion.button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-silver/30 text-xs">
            © {new Date().getFullYear()} Only Program. {t("footer.rights")}
          </p>
          
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
