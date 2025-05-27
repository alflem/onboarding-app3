import Image from "next/image";
import Link from "next/link";

export default function Footer() {
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
              <p className="text-sm text-muted-foreground">Onboarding Platform</p>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              Skapad av Albin Flemström
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}