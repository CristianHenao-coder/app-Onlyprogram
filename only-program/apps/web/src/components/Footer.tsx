import { Link } from 'react-router-dom';
import Logo from './Logo';


import { useTranslation } from "@/contexts/I18nContext";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer data-reveal data-delay="2" className="bg-background-dark pt-20 pb-10 border-t border-border">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Logo className="h-10 w-10" />
              <span className="text-lg font-bold text-white uppercase">
                Only <span className="text-primary text-sm">Program</span>
              </span>
            </div>
            <p className="text-sm text-silver/50 mb-6 leading-relaxed">
              {t("footer.brandDesc")}
            </p>
            <div className="flex gap-4">
              <a className="text-silver/40 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined">mail</span>
              </a>
              <a className="text-silver/40 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined">language</span>
              </a>
              <a className="text-silver/40 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined">support_agent</span>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">{t("footer.platform.title")}</h4>
            <ul className="space-y-3 text-sm text-silver/60">
              {(t("footer.platform.items") as string[]).map((item, i) => (
                <li key={i}><Link className="hover:text-primary transition-colors" to="/">{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">{t("footer.company.title")}</h4>
            <ul className="space-y-3 text-sm text-silver/60">
              {(t("footer.company.items") as string[]).map((item, i) => (
                <li key={i}><Link className="hover:text-primary transition-colors" to="/">{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">{t("footer.newsletter.title")}</h4>
            <form className="flex gap-2">
              <input
                className="bg-surface border border-border rounded-lg px-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none text-white"
                placeholder={t("footer.newsletter.placeholder")}
                type="email"
              />
              <button className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-colors">
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-silver/30">© 2026 Only Program. {t("footer.rights")}.</p>
          <div className="flex items-center gap-2 text-xs text-silver/30">
            {t("footer.developedBy")}{' '}
            <span className="font-bold flex items-center gap-1 text-silver/60 uppercase">
              <span className="material-symbols-outlined text-sm">code</span> Core Devs SAS
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
