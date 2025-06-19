"use client";

import Image from "next/image";
import { useLanguage } from '@/lib/language-context';
import { useTranslations } from '@/lib/translations';

export default function Footer() {
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  return (
    <footer className="bg-background border-t border-border mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Image
              src="/hallbara_konsulter_logo.svg"
              alt="Hållbara Konsulter"
              width={80}
              height={80}
              style={{ width: 'auto', height: '80px' }}
            />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Hållbara Konsulter</h3>
              <p className="text-sm text-muted-foreground">Onboarding App</p>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              Skapad av Albin Flemström
            </p>
                                    <a
              href="https://forms.office.com/e/tJ0Z5RR5AY"
              className="text-xs text-muted-foreground hover:text-foreground underline hover:no-underline cursor-pointer transition-colors"
            >
              {t('suggestion_box')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}