import { Language } from './language-context';

// Typ för översättningsnycklar
type TranslationKey =
  | 'welcome'
  | 'home'
  | 'checklist'
  | 'buddy_checklist'
  | 'organization'
  | 'login'
  | 'logout'
  | 'theme'
  | 'language'
  | 'onboarding_platform'
  | 'platform_intro'
  | 'need_help'
  | 'support'
  | 'intranet'
  | 'loading_organization'
  // Home page
  | 'welcome_to_platform'
  | 'welcome_user'
  | 'logged_in_to'
  | 'seamless_onboarding_desc'
  | 'get_started_now'
  | 'continue'
  | 'remaining'
  | 'benefits'
  | 'why_use_platform'
  | 'personal_checklists'
  | 'buddy_system'
  | 'customizable_checklists'
  | 'clear_progress_tracking'
  | 'loading'
  // Checklist page
  | 'your_onboarding_checklist'
  | 'follow_steps_desc'
  | 'your_progress'
  | 'completed_progress_desc'
  | 'completed_tasks'
  | 'of'
  | 'contact_it_support'
  | 'intranet_desc'
  // Common
  | 'close'
  | 'save'
  | 'cancel'
  | 'delete'
  | 'edit'
  | 'add'
  | 'remove'
  | 'yes'
  | 'no'
  // Admin & Super Admin pages
  | 'organization_management'
  | 'basic_information'
  | 'manage_org_settings'
  | 'organization_name'
  | 'organization_id'
  | 'created'
  | 'buddy_system_settings'
  | 'enable_buddy_system'
  | 'buddy_help_new_employees'
  | 'users_in_organization'
  | 'manage_user_roles'
  | 'name'
  | 'email'
  | 'role'
  | 'admin'
  | 'super_admin'
  | 'member_since'
  | 'no_users_found'
  | 'access_denied'
  | 'no_organization_found'
  | 'not_linked_to_org'
  | 'database_management'
  | 'full_crud_functionality'
  | 'organizations'
  | 'users'
  | 'tasks'
  | 'create_new'
  | 'actions'
  | 'buddy_enabled'
  | 'user_count'
  | 'title'
  | 'description'
  | 'category'
  | 'buddy_task'
  | 'link'
  | 'order'
  | 'buddy_checklist_page'
  | 'buddy_function_disabled'
  | 'not_a_buddy'
  | 'tasks_to_complete_for_buddy'
  | 'buddy_progress'
  | 'completed_buddy_tasks_desc'
  | 'completed_buddy_tasks'
  | 'no_buddy_tasks_found'
  | 'open_link'
  // Auth pages
  | 'sign_in_to_account'
  | 'enter_email_password'
  | 'password'
  | 'sign_in'
  | 'signing_in'
  | 'sign_out_confirm'
  | 'confirm_sign_out'
  | 'sign_out'
  | 'signing_out'
  | 'auth_error'
  | 'auth_error_desc'
  | 'try_again'
  // Error messages
  | 'error_occurred'
  | 'try_again_later'
  | 'could_not_load_data'
  | 'could_not_update'
  | 'could_not_create'
  | 'could_not_delete'
  // Admin page
  | 'administration_panel'
  | 'loading_admin_panel'
  | 'onboarding_checklist'
  | 'your_org_checklist'
  | 'categories'
  | 'no_checklist'
  | 'create_first_checklist'
  | 'creating'
  | 'create_checklist'
  | 'edit_checklist'
  | 'buddy_tasks'
  | 'buddy_tasks_desc'
  | 'manage_categories_tasks'
  | 'employees'
  | 'manage_employees'
  | 'manage_employees_and_buddy'
  | 'click_row_for_details'
  | 'progress'
  | 'assigned'
  | 'assign_buddy'
  | 'no_employees_found'
  | 'delete_employee_confirm'
  | 'delete_employee_desc'
  | 'deleting'
  | 'assign_buddy_dialog'
  | 'select_employee_buddy'
  | 'select_buddy'
  | 'choose_buddy'
  | 'assign'
  | 'saving'
  | 'employee_details'
  | 'onboarding_status_buddy'
  | 'start_date'
  | 'unknown'
  | 'onboarding_progress'
  | 'total_progress'
  | 'completed_tasks_in_category'
  | 'buddy_assignment'
  | 'no_buddy_assigned'
  | 'remove'
  | 'removing'
  | 'change_buddy'
  | 'select_new_buddy'
  | 'change'
  | 'changing'
  | 'could_not_load_employee_details'
  | 'configure_buddy'
  | 'tasks_completed'
  | 'tasks_completed_count'
  | 'recent_activity'
  | 'save_changes'
  | 'save_buddy_settings';

// Översättningar
const translations: Record<Language, Record<TranslationKey, string>> = {
  sv: {
    welcome: 'Välkommen',
    home: 'Hem',
    checklist: 'Checklista',
    buddy_checklist: 'Buddychecklista',
    organization: 'Organisation',
    login: 'Logga in',
    logout: 'Logga ut',
    theme: 'Tema',
    language: 'Språk',
    onboarding_platform: 'Onboarding Platform',
    platform_intro: 'Vår onboardingplattform hjälper nya medarbetare att komma igång på ett smidigt och strukturerat sätt.',
    need_help: 'Behöver du hjälp?',
    support: 'IT-support',
    intranet: 'Intranätet',
    intranet_desc: 'Här hittar du allt inom XLENT consulting group',
    loading_organization: 'Laddar organisation...',
    // Home page
    welcome_to_platform: 'Välkommen till plattformen för onboarding!',
    welcome_user: 'Välkommen',
    logged_in_to: 'Du är inloggad på',
    seamless_onboarding_desc: 'En sömlös och strukturerad onboarding för nya medarbetare',
    get_started_now: 'Kom igång nu',
    continue: 'Fortsätt',
    remaining: 'återstår',
    benefits: 'Fördelar',
    why_use_platform: 'Varför använda vår onboardingplattform',
    personal_checklists: 'Personliga checklistor för varje medarbetare',
    buddy_system: 'Buddysystem för att stödja nya medarbetare',
    customizable_checklists: 'Anpassningsbara checklistor för organisationens behov',
    clear_progress_tracking: 'Tydlig uppföljning av framsteg',
    loading: 'Laddar...',
    // Checklist page
    your_onboarding_checklist: 'Din checklista',
    follow_steps_desc: 'Följ dessa steg för en smidig start på ditt nya jobb.',
    your_progress: 'Dina framsteg hittills',
    completed_progress_desc: 'Du har slutfört {progress}% av din checklista',
    completed_tasks: 'Slutförda uppgifter',
    of: 'av',
    contact_it_support: 'Kontakta CSF-IT',
    // Common
    close: 'Stäng',
    save: 'Spara',
    cancel: 'Avbryt',
    delete: 'Ta bort',
    edit: 'Redigera',
    add: 'Lägg till',
    remove: 'Ta bort',
    yes: 'Ja',
    no: 'Nej',
    // Admin & Super Admin pages
    organization_management: 'Organisationshantering',
    basic_information: 'Grundläggande information',
    manage_org_settings: 'Hantera organisationens grundläggande inställningar',
    organization_name: 'Organisationsnamn',
    organization_id: 'Organisation ID',
    created: 'Skapad',
    buddy_system_settings: 'Buddysystem-inställningar',
    enable_buddy_system: 'Aktivera buddysystem',
    buddy_help_new_employees: 'Låt erfarna medarbetare hjälpa nya anställda',
    users_in_organization: 'Användare i organisationen',
    manage_user_roles: 'Hantera användarroller och behörigheter',
    name: 'Namn',
    email: 'E-post',
    role: 'Roll',
    admin: 'Admin',
    super_admin: 'Super Admin',
    member_since: 'Medlem sedan',
    no_users_found: 'Inga användare hittades i denna organisation.',
    access_denied: 'Åtkomst nekad',
    no_organization_found: 'Ingen organisation hittades',
    not_linked_to_org: 'Du verkar inte vara kopplad till någon organisation.',
    database_management: 'Databashantering',
    full_crud_functionality: 'Fullständig CRUD-funktionalitet för alla entiteter',
    organizations: 'Organisationer',
    users: 'Användare',
    tasks: 'Uppgifter',
    create_new: 'Skapa ny',
    actions: 'Åtgärder',
    buddy_enabled: 'Buddy Aktiverad',
    user_count: 'Antal användare',
    title: 'Titel',
    description: 'Beskrivning',
    category: 'Kategori',
    buddy_task: 'Buddy-uppgift',
    link: 'Länk',
    order: 'Ordning',
    buddy_checklist_page: 'Buddy Checklista',
    buddy_function_disabled: 'Buddyfunktionen är inaktiverad för din organisation.',
    not_a_buddy: 'Du är inte en buddy.',
    tasks_to_complete_for_buddy: 'Uppgifter att slutföra för din buddy.',
    buddy_progress: 'Din buddyprogress',
    completed_buddy_tasks_desc: 'Du har slutfört {progress}% av buddyuppgifterna',
    completed_buddy_tasks: 'Slutförda buddyuppgifter',
    no_buddy_tasks_found: 'Inga buddyuppgifter hittades.',
    open_link: 'Öppna länk',
    // Auth pages
    sign_in_to_account: 'Logga in på ditt konto',
    enter_email_password: 'Ange dina inloggningsuppgifter för att komma åt ditt konto',
    password: 'Lösenord',
    sign_in: 'Logga in',
    signing_in: 'Loggar in...',
    sign_out_confirm: 'Bekräfta utloggning',
    confirm_sign_out: 'Är du säker på att du vill logga ut?',
    sign_out: 'Logga ut',
    signing_out: 'Loggar ut...',
    auth_error: 'Inloggningsfel',
    auth_error_desc: 'Ett fel uppstod under inloggningen. Försök igen.',
    try_again: 'Försök igen',
    // Error messages
    error_occurred: 'Ett fel uppstod',
    try_again_later: 'Försök igen senare',
    could_not_load_data: 'Kunde inte ladda data',
    could_not_update: 'Kunde inte uppdatera',
    could_not_create: 'Kunde inte skapa',
    could_not_delete: 'Kunde inte ta bort',
    // Admin page
    administration_panel: 'Administrationspanel',
    loading_admin_panel: 'Laddar administrationspanel...',
    onboarding_checklist: 'Onboarding Checklista',
    your_org_checklist: 'Din organisations checklista',
    categories: 'Kategorier',
    no_checklist: 'Ingen Checklista',
    create_first_checklist: 'Skapa din första checklista',
    creating: 'Skapar...',
    create_checklist: 'Skapa Checklista',
    edit_checklist: 'Redigera Checklista',
    buddy_tasks: 'Buddyuppgifter',
    buddy_tasks_desc: 'Uppgifter som ska utföras av din buddy',
    manage_categories_tasks: 'Hantera kategorier och uppgifter som nyanställda behöver slutföra.',
    employees: 'Medarbetare',
    manage_employees: 'Hantera medarbetare',
    manage_employees_and_buddy: 'Hantera medarbetare och buddy-tilldelningar',
    click_row_for_details: 'Klicka på en rad för detaljer.',
    progress: 'Progress',
    assigned: 'Tilldelad',
    assign_buddy: 'Tilldela buddy',
    no_employees_found: 'Inga medarbetare hittades',
    delete_employee_confirm: 'Ta bort medarbetare?',
    delete_employee_desc: 'Denna åtgärd kan inte ångras. Den valda medarbetaren och all tillhörande data kommer att tas bort permanent.',
    deleting: 'Tar bort...',
    assign_buddy_dialog: 'Tilldela buddy',
    select_employee_buddy: 'Välj en medarbetare som ska vara buddy för den valda medarbetaren.',
    select_buddy: 'Välj buddy',
    choose_buddy: 'Välj en buddy...',
    assign: 'Tilldela',
    saving: 'Sparar...',
    employee_details: 'Medarbetardetaljer',
    onboarding_status_buddy: 'Onboarding-status och buddy-hantering',
    start_date: 'Startdatum',
    unknown: 'Okänt',
    onboarding_progress: 'Onboarding Progress',
    total_progress: 'Totalt framsteg',
    completed_tasks_in_category: 'uppgifter',
    buddy_assignment: 'Buddytilldelning',
    no_buddy_assigned: 'Ingen buddy tilldelad',
    removing: 'Tar bort...',
    change_buddy: 'Byt buddy',
    select_new_buddy: 'Välj ny buddy...',
    change: 'Byt',
    changing: 'Byter...',
    could_not_load_employee_details: 'Kunde inte ladda medarbetardetaljer',
    configure_buddy: 'Konfigurera buddy-funktionen för din organisation',
    tasks_completed: 'slutförda uppgifter',
    tasks_completed_count: '{completed}/{total} slutförda uppgifter',
    recent_activity: 'Senaste aktivitet',
    save_changes: 'Spara ändringar',
    save_buddy_settings: 'Spara buddy-inställningar'
  },
  no: {
    welcome: 'Velkommen',
    home: 'Hjem',
    checklist: 'Sjekkliste',
    buddy_checklist: 'Buddy-sjekkliste',
    organization: 'Organisasjon',
    login: 'Logg inn',
    logout: 'Logg ut',
    theme: 'Tema',
    language: 'Språk',
    onboarding_platform: 'Onboarding Platform',
    platform_intro: 'Vår onboardingplattform hjelper nye medarbeidere med å komme i gang på en smidig og strukturert måte.',
    need_help: 'Trenger du hjelp?',
    support: 'Support',
    intranet: 'Intranettet',
    intranet_desc: 'Her finner du alt i XLENT consulting group',
    loading_organization: 'Laster organisasjon...',
    // Home page
    welcome_to_platform: 'Velkommen til onboarding-plattformen!',
    welcome_user: 'Velkommen',
    logged_in_to: 'Du er logget inn på',
    seamless_onboarding_desc: 'En sømløs og strukturert onboarding for nye ansatte',
    get_started_now: 'Kom i gang nå',
    continue: 'Fortsett',
    remaining: 'gjenstår',
    benefits: 'Fordeler',
    why_use_platform: 'Hvorfor bruke vår onboarding-plattform',
    personal_checklists: 'Personlige sjekklister for hver ansatt',
    buddy_system: 'Buddy-system for å støtte nye ansatte',
    customizable_checklists: 'Tilpassbare sjekklister for organisasjonens behov',
    clear_progress_tracking: 'Tydelig oppfølging av fremgang',
    loading: 'Laster...',
    // Checklist page
    your_onboarding_checklist: 'Din sjekkliste',
    follow_steps_desc: 'Følg disse trinnene for en jevn start på din nye jobb.',
    your_progress: 'Din fremgang så langt',
    completed_progress_desc: 'Du har fullført {progress}% av din sjekkliste',
    completed_tasks: 'Fullførte oppgaver',
    of: 'av',
    contact_it_support: 'Kontakt IT-support',
    // Common
    close: 'Lukk',
    save: 'Lagre',
    cancel: 'Avbryt',
    delete: 'Slett',
    edit: 'Rediger',
    add: 'Legg til',
    remove: 'Fjern',
    yes: 'Ja',
    no: 'Nei',
    // Admin & Super Admin pages
    organization_management: 'Organisasjonshåndtering',
    basic_information: 'Grunnleggende informasjon',
    manage_org_settings: 'Håndter organisasjonens grunnleggende innstillinger',
    organization_name: 'Organisasjonsnavn',
    organization_id: 'Organisasjons-ID',
    created: 'Opprettet',
    buddy_system_settings: 'Buddy-systeminnstillinger',
    enable_buddy_system: 'Aktiver buddy-system',
    buddy_help_new_employees: 'La erfarne medarbeidere hjelpe nye ansatte',
    users_in_organization: 'Brukere i organisasjonen',
    manage_user_roles: 'Håndter brukerroller og tillatelser',
    name: 'Navn',
    email: 'E-post',
    role: 'Rolle',
    admin: 'Admin',
    super_admin: 'Super Admin',
    member_since: 'Medlem siden',
    no_users_found: 'Ingen brukere funnet i denne organisasjonen.',
    access_denied: 'Tilgang nektet',
    no_organization_found: 'Ingen organisasjon funnet',
    not_linked_to_org: 'Du ser ikke ut til å være tilknyttet noen organisasjon.',
    database_management: 'Databasehåndtering',
    full_crud_functionality: 'Fullstendig CRUD-funksjonalitet for alle entiteter',
    organizations: 'Organisasjoner',
    users: 'Brukere',
    tasks: 'Oppgaver',
    create_new: 'Opprett ny',
    actions: 'Handlinger',
    buddy_enabled: 'Buddy Aktivert',
    user_count: 'Antall brukere',
    title: 'Tittel',
    description: 'Beskrivelse',
    category: 'Kategori',
    buddy_task: 'Buddy-oppgave',
    link: 'Lenke',
    order: 'Rekkefølge',
    buddy_checklist_page: 'Buddy Sjekkliste',
    buddy_function_disabled: 'Buddy-funksjonen er deaktivert for din organisasjon.',
    not_a_buddy: 'Du er ikke en buddy.',
    tasks_to_complete_for_buddy: 'Oppgaver å fullføre for din buddy.',
    buddy_progress: 'Din buddy-fremgang',
    completed_buddy_tasks_desc: 'Du har fullført {progress}% av buddy-oppgavene',
    completed_buddy_tasks: 'Fullførte buddy-oppgaver',
    no_buddy_tasks_found: 'Ingen buddy-oppgaver funnet.',
    open_link: 'Åpne lenke',
    // Auth pages
    sign_in_to_account: 'Logg inn på kontoen din',
    enter_email_password: 'Skriv inn påloggingsinformasjonen din for å få tilgang til kontoen',
    password: 'Passord',
    sign_in: 'Logg inn',
    signing_in: 'Logger inn...',
    sign_out_confirm: 'Bekreft utlogging',
    confirm_sign_out: 'Er du sikker på at du vil logge ut?',
    sign_out: 'Logg ut',
    signing_out: 'Logger ut...',
    auth_error: 'Innloggingsfeil',
    auth_error_desc: 'En feil oppstod under innlogging. Prøv igjen.',
    try_again: 'Prøv igjen',
    // Error messages
    error_occurred: 'En feil oppstod',
    try_again_later: 'Prøv igjen senere',
    could_not_load_data: 'Kunne ikke laste data',
    could_not_update: 'Kunne ikke oppdatere',
    could_not_create: 'Kunne ikke opprette',
    could_not_delete: 'Kunne ikke slette',
    // Admin page
    administration_panel: 'Administrasjonspanel',
    loading_admin_panel: 'Laster administrasjonspanel...',
    onboarding_checklist: 'Onboarding Sjekkliste',
    your_org_checklist: 'Din organisasjons sjekkliste',
    categories: 'Kategorier',
    no_checklist: 'Ingen Sjekkliste',
    create_first_checklist: 'Opprett din første sjekkliste',
    creating: 'Oppretter...',
    create_checklist: 'Opprett Sjekkliste',
    edit_checklist: 'Rediger Sjekkliste',
    buddy_tasks: 'Buddy-oppgaver',
    buddy_tasks_desc: 'Oppgaver som skal utføres av din buddy',
    manage_categories_tasks: 'Håndter kategorier og oppgaver som nyansatte må fullføre.',
    employees: 'Ansatte',
    manage_employees: 'Håndter ansatte',
    manage_employees_and_buddy: 'Håndter ansatte og buddy-tildelinger',
    click_row_for_details: 'Klikk på en rad for detaljer.',
    progress: 'Fremgang',
    assigned: 'Tildelt',
    assign_buddy: 'Tildel buddy',
    no_employees_found: 'Ingen ansatte funnet',
    delete_employee_confirm: 'Slett ansatt?',
    delete_employee_desc: 'Denne handlingen kan ikke angres. Den valgte ansatte og alle tilhørende data vil bli slettet permanent.',
    deleting: 'Sletter...',
    assign_buddy_dialog: 'Tildel buddy',
    select_employee_buddy: 'Velg en ansatt som skal være buddy for den valgte ansatte.',
    select_buddy: 'Velg buddy',
    choose_buddy: 'Velg en buddy...',
    assign: 'Tildel',
    saving: 'Lagrer...',
    employee_details: 'Ansattdetaljer',
    onboarding_status_buddy: 'Onboarding-status og buddy-håndtering',
    start_date: 'Startdato',
    unknown: 'Ukjent',
    onboarding_progress: 'Onboarding Fremgang',
    total_progress: 'Total fremgang',
    completed_tasks_in_category: 'oppgaver',
    buddy_assignment: 'Buddy-tildeling',
    no_buddy_assigned: 'Ingen buddy tildelt',
    removing: 'Fjerner...',
    change_buddy: 'Bytt buddy',
    select_new_buddy: 'Velg ny buddy...',
    change: 'Bytt',
    changing: 'Bytter...',
    could_not_load_employee_details: 'Kunne ikke laste ansattdetaljer',
    configure_buddy: 'Konfigurer buddy-funksjonalitet for din organisasjon',
    tasks_completed: 'oppgaver fullført',
    tasks_completed_count: '{completed}/{total} oppgaver fullført',
    recent_activity: 'Siste aktivitet',
    save_changes: 'Lagre endringer',
    save_buddy_settings: 'Lagre buddy-innstillinger'
  },
  en: {
    welcome: 'Welcome',
    home: 'Home',
    checklist: 'Checklist',
    buddy_checklist: 'Buddy Checklist',
    organization: 'Organization',
    login: 'Sign in',
    logout: 'Sign out',
    theme: 'Theme',
    language: 'Language',
    onboarding_platform: 'Onboarding Platform',
    platform_intro: 'Our onboarding platform helps new employees get started in a smooth and structured way.',
    need_help: 'Need help?',
    support: 'Support',
    intranet: 'Intranet',
    intranet_desc: 'Here you find everything within XLENT consulting group',
    loading_organization: 'Loading organization...',
    // Home page
    welcome_to_platform: 'Welcome to the onboarding platform!',
    welcome_user: 'Welcome',
    logged_in_to: 'You are logged in to',
    seamless_onboarding_desc: 'A seamless and structured onboarding for new employees',
    get_started_now: 'Get started now',
    continue: 'Continue',
    remaining: 'remaining',
    benefits: 'Benefits',
    why_use_platform: 'Why use our onboarding platform',
    personal_checklists: 'Personal checklists for each employee',
    buddy_system: 'Buddy system to support new employees',
    customizable_checklists: 'Customizable checklists for organizational needs',
    clear_progress_tracking: 'Clear progress tracking',
    loading: 'Loading...',
    // Checklist page
    your_onboarding_checklist: 'Your checklist',
    follow_steps_desc: 'Follow these steps for a smooth start to your new job.',
    your_progress: 'Your progress so far',
    completed_progress_desc: 'You have completed {progress}% of your checklist',
    completed_tasks: 'Completed tasks',
    of: 'of',
    contact_it_support: 'Contact IT support',
    // Common
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    yes: 'Yes',
    no: 'No',
    // Admin & Super Admin pages
    organization_management: 'Organization Management',
    basic_information: 'Basic Information',
    manage_org_settings: 'Manage the organization\'s basic settings',
    organization_name: 'Organization Name',
    organization_id: 'Organization ID',
    created: 'Created',
    buddy_system_settings: 'Buddy System Settings',
    enable_buddy_system: 'Enable buddy system',
    buddy_help_new_employees: 'Let experienced employees help new hires',
    users_in_organization: 'Users in organization',
    manage_user_roles: 'Manage user roles and permissions',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    admin: 'Admin',
    super_admin: 'Super Admin',
    member_since: 'Member since',
    no_users_found: 'No users found in this organization.',
    access_denied: 'Access denied',
    no_organization_found: 'No organization found',
    not_linked_to_org: 'You don\'t seem to be linked to any organization.',
    database_management: 'Database Management',
    full_crud_functionality: 'Full CRUD functionality for all entities',
    organizations: 'Organizations',
    users: 'Users',
    tasks: 'Tasks',
    create_new: 'Create new',
    actions: 'Actions',
    buddy_enabled: 'Buddy Enabled',
    user_count: 'User count',
    title: 'Title',
    description: 'Description',
    category: 'Category',
    buddy_task: 'Buddy task',
    link: 'Link',
    order: 'Order',
    buddy_checklist_page: 'Buddy Checklist',
    buddy_function_disabled: 'Buddy function is disabled for your organization.',
    not_a_buddy: 'You are not a buddy.',
    tasks_to_complete_for_buddy: 'Tasks to complete for your buddy.',
    buddy_progress: 'Your buddy progress',
    completed_buddy_tasks_desc: 'You have completed {progress}% of buddy tasks',
    completed_buddy_tasks: 'Completed buddy tasks',
    no_buddy_tasks_found: 'No buddy tasks found.',
    open_link: 'Open link',
    // Auth pages
    sign_in_to_account: 'Sign in to your account',
    enter_email_password: 'Enter your credentials to access your account',
    password: 'Password',
    sign_in: 'Sign in',
    signing_in: 'Signing in...',
    sign_out_confirm: 'Confirm sign out',
    confirm_sign_out: 'Are you sure you want to sign out?',
    sign_out: 'Sign out',
    signing_out: 'Signing out...',
    auth_error: 'Authentication error',
    auth_error_desc: 'An error occurred during sign in. Please try again.',
    try_again: 'Try again',
    // Error messages
    error_occurred: 'An error occurred',
    try_again_later: 'Try again later',
    could_not_load_data: 'Could not load data',
    could_not_update: 'Could not update',
    could_not_create: 'Could not create',
    could_not_delete: 'Could not delete',
    // Admin page
    administration_panel: 'Administration Panel',
    loading_admin_panel: 'Loading administration panel...',
    onboarding_checklist: 'Onboarding Checklist',
    your_org_checklist: 'Your organization\'s checklist',
    categories: 'Categories',
    no_checklist: 'No Checklist',
    create_first_checklist: 'Create your first checklist',
    creating: 'Creating...',
    create_checklist: 'Create Checklist',
    edit_checklist: 'Edit Checklist',
    buddy_tasks: 'Buddy tasks',
    buddy_tasks_desc: 'Tasks to be completed by your buddy',
    manage_categories_tasks: 'Manage categories and tasks that new employees need to complete.',
    employees: 'Employees',
    manage_employees: 'Manage employees',
    manage_employees_and_buddy: 'Manage employees and buddy assignments',
    click_row_for_details: 'Click on a row for details.',
    progress: 'Progress',
    assigned: 'Assigned',
    assign_buddy: 'Assign buddy',
    no_employees_found: 'No employees found',
    delete_employee_confirm: 'Delete employee?',
    delete_employee_desc: 'This action cannot be undone. The selected employee and all associated data will be permanently deleted.',
    deleting: 'Deleting...',
    assign_buddy_dialog: 'Assign buddy',
    select_employee_buddy: 'Select an employee to be buddy for the selected employee.',
    select_buddy: 'Select buddy',
    choose_buddy: 'Choose a buddy...',
    assign: 'Assign',
    saving: 'Saving...',
    employee_details: 'Employee Details',
    onboarding_status_buddy: 'Onboarding status and buddy management',
    start_date: 'Start date',
    unknown: 'Unknown',
    onboarding_progress: 'Onboarding Progress',
    total_progress: 'Total progress',
    completed_tasks_in_category: 'tasks',
    buddy_assignment: 'Buddy Assignment',
    no_buddy_assigned: 'No buddy assigned',
    removing: 'Removing...',
    change_buddy: 'Change buddy',
    select_new_buddy: 'Select new buddy...',
    change: 'Change',
    changing: 'Changing...',
    could_not_load_employee_details: 'Could not load employee details',
    configure_buddy: 'Configure buddy functionality for your organization',
    tasks_completed: 'tasks completed',
    tasks_completed_count: '{completed}/{total} tasks completed',
    recent_activity: 'Recent activity',
    save_changes: 'Save changes',
    save_buddy_settings: 'Save buddy settings'
  }
};

// Hook för att få översättningar
export function useTranslations(language: Language) {
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations['sv'][key] || key;

    // Interpolation för parametrar som {progress}
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }

    return translation;
  };

  return { t };
}

// Direkt översättningsfunktion
export function translate(language: Language, key: TranslationKey, params?: Record<string, string | number>): string {
  let translation = translations[language][key] || translations['sv'][key] || key;

  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(`{${param}}`, String(value));
    });
  }

  return translation;
}