import Logo from './Logo';


import { useTranslation } from "@/contexts/I18nContext";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer data-reveal data-delay="2" className="bg-background-dark pt-20 pb-10 border-t border-border">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Socials */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-base font-bold text-white uppercase">
                Only <span className="text-primary text-xs">Program</span>
              </span>
            </div>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex gap-4">
              <a className="text-silver/40 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
              <a className="text-silver/40 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined text-lg">language</span>
              </a>
            </div>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-2 text-xs text-silver/30">
            {t("footer.developedBy")}{' '}
            <span className="font-bold flex items-center gap-1 text-silver/60 uppercase">
              <span className="material-symbols-outlined text-sm">code</span> Core Devs SAS
            </span>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}
