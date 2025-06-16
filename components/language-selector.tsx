"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage, languages, Language } from "@/lib/language-context";
import { SwedishFlag, NorwegianFlag, AmericanFlag } from "@/components/flag-icons";

const flagComponents = {
  SwedishFlag,
  NorwegianFlag,
  AmericanFlag,
};

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const currentLanguage = languages[language];

  const getCurrentFlag = () => {
    const FlagComponent = flagComponents[currentLanguage.flagComponent];
    return <FlagComponent className="w-5 h-3" />;
  };

  const getFlag = (flagComponent: keyof typeof flagComponents) => {
    const FlagComponent = flagComponents[flagComponent];
    return <FlagComponent className="w-5 h-3" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          {getCurrentFlag()}
          <span className="hidden sm:inline">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as Language)}
            className={`flex items-center gap-2 ${
              language === code ? 'bg-accent' : ''
            }`}
          >
            {getFlag(lang.flagComponent as keyof typeof flagComponents)}
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}