import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-border glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 overflow-hidden rounded-lg transition-transform group-hover:scale-110">
              <img 
                src="/src/assets/img/logo.png" 
                alt="Only Program" 
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase hidden sm:inline">
              Only <span className="text-primary text-sm">Program</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#home"
              className="text-silver hover:text-white transition-colors font-medium"
            >
              {t('nav.home')}
            </a>
            <a
              href="/#features"
              className="text-silver hover:text-white transition-colors font-medium"
            >
              {t('nav.features')}
            </a>
            <Link
              to="/pricing"
              className="text-silver hover:text-white transition-colors font-medium"
            >
              {t('nav.pricing')}
            </Link>
            <a
              href="/#testimonials"
              className="text-silver hover:text-white transition-colors font-medium"
            >
              {t('nav.testimonials')}
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Selector */}
            <LanguageSelector />

            {user ? (
              <Link
                to="/dashboard"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold transition-all shadow-lg shadow-primary/20"
              >
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-silver hover:text-white transition-colors font-semibold"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold transition-all shadow-lg shadow-primary/20"
                >
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined text-white text-2xl">
              {isOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-4">
              <a href="/#home" className="text-silver hover:text-white transition-colors font-medium">
                {t('nav.home')}
              </a>
              <a href="/#features" className="text-silver hover:text-white transition-colors font-medium">
                {t('nav.features')}
              </a>
              <Link to="/pricing" className="text-silver hover:text-white transition-colors font-medium">
                {t('nav.pricing')}
              </Link>
              <a href="/#testimonials" className="text-silver hover:text-white transition-colors font-medium">
                {t('nav.testimonials')}
              </a>

              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <LanguageSelector />
                
                {user ? (
                  <Link
                    to="/dashboard"
                    className="text-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold"
                  >
                    {t('nav.dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-center text-silver font-semibold">
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/register"
                      className="text-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold"
                    >
                      {t('nav.signup')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
