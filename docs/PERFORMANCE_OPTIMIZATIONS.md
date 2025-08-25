# Prestandaoptimeringar för Onboarding App

## Problem som löstes

Sidan laddade om när användaren var på samma sida, vilket orsakades av onödiga autentiseringskontroller och session-uppdateringar.

## Lösningar som implementerades

### 1. AuthProvider Optimering

**Fil:** `components/auth-provider.tsx`

**Ändringar:**
- `refetchInterval={60 * 60}` - Refetch session every 1 hour (Azure AD access token lifetime)
- `refetchOnWindowFocus={false}` - Stängde av automatisk session-uppdatering när fönstret får fokus

**Före:**
```tsx
<SessionProvider
  refetchInterval={5 * 60} // Refetch session every 5 minutes
  refetchOnWindowFocus={true} // Refetch session when window gains focus
  refetchWhenOffline={false}
>
```

**Efter:**
```tsx
<SessionProvider
  refetchInterval={60 * 60} // Refetch session every 1 hour (Azure AD access token lifetime)
  refetchOnWindowFocus={false} // Don't refetch when window gains focus
  refetchWhenOffline={false}
>
```

**Varför 1 timme?**
- **Azure AD Access Token** har en livslängd på 1 timme
- **NextAuth JWT Token** har en livslängd på 30 dagar
- **Azure AD Refresh Token** har en livslängd på 90 dagar
- `refetchInterval` behövs för att synkronisera användardata och hantera Azure AD token-förnyelse

### 2. ViewContext Optimering

**Fil:** `lib/view-context.tsx`

**Ändringar:**
- Lade till `useMemo` för att memoizera användarrollen
- Lade till `status`-kontroll för att endast uppdatera när sessionen är autentiserad
- Förbättrade `useEffect`-dependencies för att undvika onödiga uppdateringar

### 3. Middleware Optimering

**Fil:** `middleware.ts`

**Ändringar:**
- Begränsade loggning till endast development-miljö
- Minskade prestandapåverkan från console.log-anrop

### 4. Nya Session Hooks

**Fil:** `lib/session-utils.ts`

**Nya hooks:**
- `useOptimizedSession()` - För sidor som inte behöver real-time uppdateringar
- `useRequiredSession()` - För sidor som kräver autentisering men inte behöver frekventa kontroller

### 5. JWT Callback Optimering

**Fil:** `app/api/auth/auth-options.ts`

**Ändringar:**
- Optimerade JWT-callback för att endast kontrollera organisation när det verkligen behövs
- Minskade onödiga databasanrop vid varje session-uppdatering

## Token-hantering och varför refetch behövs

### Token-typer och livslängd
```
Azure AD Access Token: 1 timme (behöver förnyas)
Azure AD Refresh Token: 90 dagar (används för att förnya access token)
NextAuth JWT Token: 30 dagar (lokal session)
```

### Varför inte 30 dagar?
Trots att NextAuth JWT är giltig i 30 dagar behöver vi fortfarande `refetchInterval` för att:

1. **Förnya Azure AD Access Token** - Som går ut efter 1 timme
2. **Synkronisera användardata** - Om roll/organisation har ändrats
3. **Hantera Azure AD-specifika uppdateringar** - Som company name, department, etc.

### Optimerad strategi
- **1 timme** = Balanserar prestanda med Azure AD-kompatibilitet
- **Ingen window focus refetch** = Undviker omladdningar vid flikbyte
- **Intelligent JWT-callback** = Endast databaskontroller när nödvändigt

## Användning av optimerade hooks

### För vanliga sidor (utan required: true)
```tsx
import { useOptimizedSession } from "@/lib/session-utils";

export default function MyPage() {
  const { data: session, isAuthenticated, isLoading } = useOptimizedSession();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not authenticated</div>;

  return <div>Welcome {session?.user?.name}</div>;
}
```

### För sidor som kräver autentisering
```tsx
import { useRequiredSession } from "@/lib/session-utils";

export default function ProtectedPage() {
  const { data: session, isLoading } = useRequiredSession();

  if (isLoading) return <div>Loading...</div>;

  return <div>Protected content for {session?.user?.name}</div>;
}
```

## Förväntade förbättringar

1. **Inga omladdningar** när användaren klickar tillbaka till fliken
2. **Minskad serverbelastning** från färre session-kontroller
3. **Bättre användarupplevelse** med stabilare sidor
4. **Optimerad prestanda** för alla autentiserade sidor
5. **Azure AD-kompatibilitet** med automatisk token-förnyelse

## Kompatibilitet

Alla ändringar är bakåtkompatibla och påverkar inte befintlig funktionalitet. Sidor som använder `useSession({ required: true })` kommer fortfarande att fungera som förväntat.

## Framtida optimeringar

- Implementera `useOptimizedSession` på fler sidor
- Lägg till caching för ofta använda data
- Implementera lazy loading för komponenter
- Optimera bundle-storlek med code splitting
- Implementera intelligent token-caching baserat på Azure AD-policyer
