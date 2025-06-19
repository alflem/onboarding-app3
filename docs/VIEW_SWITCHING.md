# View Switching för Super-Admins

## Översikt
Super-admins kan nu byta mellan olika användarvyer för att se hur applikationen fungerar för olika roller. Detta är perfekt för demos och för att förstå användarupplevelsen.

## Funktionalitet

### Tillgängliga vyer
- **Medarbetare**: Grundläggande användarupplevelse med checklista och framsteg
- **Admin**: Organisationshantering och användarroller
- **Super Admin**: Fullständig systemadministration

### Hur det fungerar
1. Som super-admin klickar du på din avatar/namn i headern för att öppna användarmenyn
2. I menyn ser du en "Visa som"-sektion med tillgängliga roller
3. Välj vilken roll du vill visa sidan som
4. Navigationen och innehållet uppdateras automatiskt för att matcha den valda rollen
5. Din valda vy sparas i localStorage så den persister mellan sessioner

### Extremt diskret design
- Ingen separat knapp eller indikator i headern
- View switching är helt integrerat i användarmenyn
- Ingen varningsbanner eller påträngande UI
- Helt naturlig användarupplevelse
- Perfect för demos och presentations - åskådarna märker inte att du byter vy

### Säkerhet
- Endast super-admins kan använda funktionen
- Inga faktiska behörigheter ändras - endast gränssnittet anpassas
- Du har fortfarande full super-admin åtkomst i bakgrunden

## Teknisk implementation

### Komponenter
- `ViewProvider`: Context provider för view state
- `useViewContext`: Hook för att använda view context
- View switching är integrerat direkt i `Header.tsx` komponenten

### Hur det påverkar behörigheter
Funktionen använder `currentViewMode` istället för den faktiska användarrollen när den kontrollerar vad som ska visas i gränssnittet. Backend-anrop använder fortfarande din faktiska super-admin-roll.

```typescript
// I Header.tsx - hasRole funktion
const effectiveRole = isViewSwitchingEnabled ? currentViewMode : session.user.role;
```

Detta gör att navigationen och UI:t anpassas till den valda rollen, medan du fortfarande har full åtkomst till alla funktioner.