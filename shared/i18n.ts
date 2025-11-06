/**
 * Internationalization (i18n) Service
 * Supports multiple languages for TourismOS platform
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  zh: '中文',
};

// Translation keys and default English values
export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Common
    'common.welcome': 'Welcome',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.bookings': 'Bookings',
    'nav.offerings': 'Offerings',
    'nav.marketing': 'Marketing',
    'nav.analytics': 'Analytics',
    'nav.team': 'Team',
    'nav.settings': 'Settings',
    'nav.publicSite': 'Public Site',
    'nav.aiChatbot': 'AI Chatbot',
    
    // Dashboard
    'dashboard.totalBookings': 'Total Bookings',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.pendingBookings': 'Pending Bookings',
    'dashboard.confirmedBookings': 'Confirmed Bookings',
    'dashboard.todaysBookings': "Today's Bookings",
    'dashboard.upcomingBookings': 'Upcoming Bookings',
    
    // Bookings
    'bookings.title': 'Bookings',
    'bookings.create': 'Create Booking',
    'bookings.customerName': 'Customer Name',
    'bookings.customerEmail': 'Customer Email',
    'bookings.bookingDate': 'Booking Date',
    'bookings.status': 'Status',
    'bookings.paymentStatus': 'Payment Status',
    'bookings.totalAmount': 'Total Amount',
    
    // Offerings
    'offerings.title': 'Offerings',
    'offerings.create': 'Create Offering',
    'offerings.name': 'Name',
    'offerings.description': 'Description',
    'offerings.price': 'Price',
    'offerings.duration': 'Duration',
    'offerings.capacity': 'Capacity',
    'offerings.location': 'Location',
    
    // Settings
    'settings.title': 'Settings',
    'settings.businessInfo': 'Business Information',
    'settings.businessName': 'Business Name',
    'settings.businessType': 'Business Type',
    'settings.description': 'Description',
    'settings.location': 'Location',
    'settings.contact': 'Contact Information',
    'settings.phone': 'Phone',
    'settings.email': 'Email',
    'settings.website': 'Website',
  },
  
  es: {
    // Common
    'common.welcome': 'Bienvenido',
    'common.loading': 'Cargando...',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.bookings': 'Reservas',
    'nav.offerings': 'Ofertas',
    'nav.marketing': 'Marketing',
    'nav.analytics': 'Análisis',
    'nav.team': 'Equipo',
    'nav.settings': 'Configuración',
    'nav.publicSite': 'Sitio Público',
    'nav.aiChatbot': 'Chatbot IA',
    
    // Dashboard
    'dashboard.totalBookings': 'Total de Reservas',
    'dashboard.totalRevenue': 'Ingresos Totales',
    'dashboard.pendingBookings': 'Reservas Pendientes',
    'dashboard.confirmedBookings': 'Reservas Confirmadas',
    'dashboard.todaysBookings': 'Reservas de Hoy',
    'dashboard.upcomingBookings': 'Próximas Reservas',
    
    // Bookings
    'bookings.title': 'Reservas',
    'bookings.create': 'Crear Reserva',
    'bookings.customerName': 'Nombre del Cliente',
    'bookings.customerEmail': 'Email del Cliente',
    'bookings.bookingDate': 'Fecha de Reserva',
    'bookings.status': 'Estado',
    'bookings.paymentStatus': 'Estado de Pago',
    'bookings.totalAmount': 'Monto Total',
    
    // Offerings
    'offerings.title': 'Ofertas',
    'offerings.create': 'Crear Oferta',
    'offerings.name': 'Nombre',
    'offerings.description': 'Descripción',
    'offerings.price': 'Precio',
    'offerings.duration': 'Duración',
    'offerings.capacity': 'Capacidad',
    'offerings.location': 'Ubicación',
    
    // Settings
    'settings.title': 'Configuración',
    'settings.businessInfo': 'Información del Negocio',
    'settings.businessName': 'Nombre del Negocio',
    'settings.businessType': 'Tipo de Negocio',
    'settings.description': 'Descripción',
    'settings.location': 'Ubicación',
    'settings.contact': 'Información de Contacto',
    'settings.phone': 'Teléfono',
    'settings.email': 'Email',
    'settings.website': 'Sitio Web',
  },
  
  fr: {
    // Common
    'common.welcome': 'Bienvenue',
    'common.loading': 'Chargement...',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.bookings': 'Réservations',
    'nav.offerings': 'Offres',
    'nav.marketing': 'Marketing',
    'nav.analytics': 'Analytique',
    'nav.team': 'Équipe',
    'nav.settings': 'Paramètres',
    'nav.publicSite': 'Site Public',
    'nav.aiChatbot': 'Chatbot IA',
    
    // Add more French translations...
  },
  
  de: {
    // Common
    'common.welcome': 'Willkommen',
    'common.loading': 'Laden...',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.create': 'Erstellen',
    'common.search': 'Suchen',
    'common.filter': 'Filtern',
    'common.export': 'Exportieren',
    'common.import': 'Importieren',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.bookings': 'Buchungen',
    'nav.offerings': 'Angebote',
    'nav.marketing': 'Marketing',
    'nav.analytics': 'Analytik',
    'nav.team': 'Team',
    'nav.settings': 'Einstellungen',
    'nav.publicSite': 'Öffentliche Seite',
    'nav.aiChatbot': 'KI-Chatbot',
    
    // Add more German translations...
  },
  
  // Placeholder for other languages
  it: {},
  pt: {},
  ja: {},
  zh: {},
};

/**
 * Get translated text for a key
 */
export function t(key: string, language: SupportedLanguage = 'en'): string {
  return translations[language][key] || translations.en[key] || key;
}

/**
 * Get user's preferred language from browser or settings
 */
export function getUserLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
    if (browserLang in SUPPORTED_LANGUAGES) {
      return browserLang;
    }
  }
  return 'en';
}

/**
 * Format currency based on language
 */
export function formatCurrency(amount: number, language: SupportedLanguage = 'en'): string {
  const locales: Record<SupportedLanguage, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-PT',
    ja: 'ja-JP',
    zh: 'zh-CN',
  };

  return new Intl.NumberFormat(locales[language], {
    style: 'currency',
    currency: 'USD', // Could be made dynamic based on business settings
  }).format(amount / 100);
}

/**
 * Format date based on language
 */
export function formatDate(date: Date, language: SupportedLanguage = 'en'): string {
  const locales: Record<SupportedLanguage, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-PT',
    ja: 'ja-JP',
    zh: 'zh-CN',
  };

  return new Intl.DateTimeFormat(locales[language], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
