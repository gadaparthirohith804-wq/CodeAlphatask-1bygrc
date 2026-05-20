import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'EN' | 'HI' | 'TE' | 'TA' | 'KN';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const translations: Record<LanguageCode, Record<string, string>> = {
  EN: {
    searchPlaceholder: 'Search for next-gen cyberpunk gear...',
    catalog: 'Catalog',
    cart: 'Cart',
    profile: 'My Profile',
    orders: 'Orders Log',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    deliverTo: 'Deliver to',
    refineNode: 'Refine Node',
    clearAll: 'Clear All',
    categories: 'Categories',
    priceBudget: 'Price Budget',
    brandsFilter: 'Brands Filter',
    customerRating: 'Customer Rating',
    assuredOnly: 'Assured Only',
    excludeOutOfStock: 'Exclude Out of Stock',
    addToCart: 'Add to Cart',
    freeDelivery: 'Free Delivery',
    yourCart: 'Your Cart',
    checkout: 'Proceed to Checkout',
    emptyCart: 'Your Cart is Empty',
    viewSpecs: 'View Specs',
    soldOut: 'Sold Out',
    refinements: 'Refinements',
    showing: 'Showing',
    products: 'products',
    of: 'of',
    allCategories: 'All Categories',
    priceLowHigh: 'Price: Low to High',
    priceHighLow: 'Price: High to Low',
    topRated: 'Top Rated',
    grid: 'grid',
    list: 'list',
    welcome: 'Welcome to Aetheria',
    subWelcome: 'Discover the future of tech. Premium gear for the modern explorer.',
    exploreCatalog: 'Explore Catalog',
    featuredProducts: 'Featured Products',
    ratingsCountSuffix: 'global ratings',
    itemsLeft: 'items left!',
    only: 'Only'
  },
  HI: {
    searchPlaceholder: 'नेक्स्ट-जेन साइबरपंक गियर खोजें...',
    catalog: 'कैटलॉग',
    cart: 'कार्ट',
    profile: 'मेरी प्रोफाइल',
    orders: 'ऑर्डर सूची',
    signOut: 'साइन आउट',
    signIn: 'साइन इन',
    deliverTo: 'डिलिवरी यहां',
    refineNode: 'फ़िल्टर करें',
    clearAll: 'सभी साफ करें',
    categories: 'श्रेणियाँ',
    priceBudget: 'मूल्य बजट',
    brandsFilter: 'ब्रांड फ़िल्टर',
    customerRating: 'ग्राहक रेटिंग',
    assuredOnly: 'सुनिश्चित केवल',
    excludeOutOfStock: 'स्टॉक से बाहर हटाएं',
    addToCart: 'कार्ट में जोड़ें',
    freeDelivery: 'मुफ़्त डिलीवरी',
    yourCart: 'आपकी कार्ट',
    checkout: 'चेकआउट करें',
    emptyCart: 'आपकी कार्ट खाली है',
    viewSpecs: 'विवरण देखें',
    soldOut: 'बिक गया',
    refinements: 'लागू फ़िल्टर',
    showing: 'दिखा रहा है',
    products: 'उत्पाद',
    of: 'का',
    allCategories: 'सभी श्रेणियाँ',
    priceLowHigh: 'कीमत: कम से अधिक',
    priceHighLow: 'कीमत: अधिक से कम',
    topRated: 'शीर्ष रेटेड',
    grid: 'ग्रिड',
    list: 'सूची',
    welcome: 'एथेरिया में आपका स्वागत है',
    subWelcome: 'तकनीक के भविष्य की खोज करें। आधुनिक खोजकर्ता के लिए प्रीमियम गियर।',
    exploreCatalog: 'कैटलॉग देखें',
    featuredProducts: 'विशेष रुप से प्रदर्शित उत्पाद',
    ratingsCountSuffix: 'वैश्विक रेटिंग',
    itemsLeft: 'बचे हैं!',
    only: 'केवल'
  },
  TE: {
    searchPlaceholder: 'నెక్స్ట్-జెన్ సైబర్‌పంక్ గేర్ కోసం వెతకండి...',
    catalog: 'కాటలాగ్',
    cart: 'కార్ట్',
    profile: 'నా ప్రొఫైల్',
    orders: 'ఆర్డర్ల లాగ్',
    signOut: 'సైన్ అవుట్',
    signIn: 'సైన్ ఇన్',
    deliverTo: 'కి డెలివరీ చేయండి',
    refineNode: 'ఫిల్టర్లు',
    clearAll: 'అన్నీ క్లియర్ చేయి',
    categories: 'వర్గాలు',
    priceBudget: 'ధర బడ్జెట్',
    brandsFilter: 'బ్రాండ్ల ఫిల్టర్',
    customerRating: 'వినియోగదారు రేటింగ్',
    assuredOnly: 'అష్యూర్డ్ మాత్రమే',
    excludeOutOfStock: 'స్టాక్ లేనివి మినహాయించు',
    addToCart: 'కార్ట్‌లో చేర్చు',
    freeDelivery: 'ఉచిత డెలివరీ',
    yourCart: 'మీ కార్ట్',
    checkout: 'చెక్అవుట్‌కు వెళ్లండి',
    emptyCart: 'మీ కార్ట్ ఖాళీగా ఉంది',
    viewSpecs: 'వివరాలు చూడు',
    soldOut: 'అయిపోయింది',
    refinements: 'ఫిల్టర్లు',
    showing: 'చూపిస్తోంది',
    products: 'వస్తువులు',
    of: 'యొక్క',
    allCategories: 'అన్ని వర్గాలు',
    priceLowHigh: 'ధర: తక్కువ నుండి ఎక్కువ',
    priceHighLow: 'ధర: ఎక్కువ నుండి తక్కువ',
    topRated: 'టాప్ రేటింగ్',
    grid: 'గ్రిడ్',
    list: 'జాబితా',
    welcome: 'ఏథెరియాకు స్వాగతం',
    subWelcome: 'సాంకేతికత యొక్క భవిష్యత్తును కనుగొనండి. ఆధునిక అన్వేషకుల కోసం ప్రీమియం గేర్.',
    exploreCatalog: 'కాటలాగ్ అన్వేషించండి',
    featuredProducts: 'ప్రత్యేక ఉత్పత్తులు',
    ratingsCountSuffix: 'గ్లోబల్ రేటింగ్‌లు',
    itemsLeft: 'వస్తువులు మాత్రమే ఉన్నాయి!',
    only: 'కేవలం'
  },
  TA: {
    searchPlaceholder: 'நெக்ஸ்ட்-ஜென் சைபர்பங்க் கியர் தேடுக...',
    catalog: 'கேடலாக்',
    cart: 'வண்டி',
    profile: 'என் சுயவிவரம்',
    orders: 'ஆர்டர்கள் பதிவு',
    signOut: 'வெளியேறு',
    signIn: 'உள்நுழைக',
    deliverTo: 'டெலிவரி செய்ய',
    refineNode: 'வடிகட்டுதல்',
    clearAll: 'அனைத்தையும் நீக்கு',
    categories: 'வகைகள்',
    priceBudget: 'விலை பட்ஜெட்',
    brandsFilter: 'பிராண்டுகள் வடிகட்டி',
    customerRating: 'வாடிக்கையாளர் மதிப்பீடு',
    assuredOnly: 'உறுதியளிக்கப்பட்டவை மட்டும்',
    excludeOutOfStock: 'இருப்பு இல்லாதவற்றை விலக்கு',
    addToCart: 'வண்டியில் சேர்',
    freeDelivery: 'இலவச டெலிவரி',
    yourCart: 'உங்கள் வண்டி',
    checkout: 'செக்அவுட் செய்ய தொடரவும்',
    emptyCart: 'உங்கள் வண்டி காலியாக உள்ளது',
    viewSpecs: 'விவரங்களைக் காண்க',
    soldOut: 'விற்றுத் தீர்ந்தது',
    refinements: 'வடிகட்டிகள்',
    showing: 'காண்பிக்கிறது',
    products: 'தயாரிப்புகள்',
    of: 'இல்',
    allCategories: 'அனைத்து பிரிவுகள்',
    priceLowHigh: 'விலை: குறைவு முதல் அதிகம்',
    priceHighLow: 'விலை: அதிகம் முதல் குறைவு',
    topRated: 'சிறந்த மதிப்பீடு',
    grid: 'கட்டம்',
    list: 'பட்டியல்',
    welcome: 'ஏதெரியாவிற்கு வரவேற்கிறோம்',
    subWelcome: 'தொழில்நுட்பத்தின் எதிர்காலத்தைக் கண்டறியவும். நவீன எக்ஸ்ப்ளோரருக்கான பிரீமியம் கியர்.',
    exploreCatalog: 'கேடலாக்கை ஆராயுங்கள்',
    featuredProducts: 'சிறப்பு தயாரிப்புகள்',
    ratingsCountSuffix: 'உலகளாவிய மதிப்பீடுகள்',
    itemsLeft: 'பொருட்கள் மட்டுமே உள்ளன!',
    only: 'மட்டும்'
  },
  KN: {
    searchPlaceholder: 'ನೆಕ್ಸ್ಟ್-ಜೆನ್ ಸೈಬರ್‌ಪಂಕ್ ಗೇರ್‌ಗಾಗಿ ಹುಡುಕಿ...',
    catalog: 'ಕ್ಯಾಟಲಾಗ್',
    cart: 'ಕಾರ್ಟ್',
    profile: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    orders: 'ಆರ್ಡರ್ ಲಾಗ್',
    signOut: 'ಸೈನ್ ಔಟ್',
    signIn: 'ಸೈನ್ ಇನ್',
    deliverTo: 'ಡೆಲಿವರಿ ವಿಳಾಸ',
    refineNode: 'ಫಿಲ್ಟರ್ ಮಾಡಿ',
    clearAll: 'ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ',
    categories: 'ವರ್ಗಗಳು',
    priceBudget: 'ಬಜೆಟ್ ಬೆಲೆ',
    brandsFilter: 'ಬ್ರ್ಯಾಂಡ್‌ಗಳು',
    customerRating: 'ಗ್ರಾಹಕರ ರೇಟಿಂಗ್',
    assuredOnly: 'ಅಶ್ಯೂರ್ಡ್ ಮಾತ್ರ',
    excludeOutOfStock: 'ಲಭ್ಯವಿಲ್ಲದ ಉತ್ಪನ್ನಗಳನ್ನು ಹೊರತುಪಡಿಸಿ',
    addToCart: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
    freeDelivery: 'ಉಚಿತ ಡೆಲಿವರಿ',
    yourCart: 'ನಿಮ್ಮ ಕಾರ್ಟ್',
    checkout: 'ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
    emptyCart: 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ',
    viewSpecs: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
    soldOut: 'ಖಾಲಿಯಾಗಿದೆ',
    refinements: 'ಫಿಲ್ಟರ್‌ಗಳು',
    showing: 'ತೋರಿಸಲಾಗುತ್ತಿದೆ',
    products: 'ಉತ್ಪನ್ನಗಳು',
    of: 'ರಷ್ಟು',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    priceLowHigh: 'ಬೆಲೆ: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚಿಗೆ',
    priceHighLow: 'ಬೆಲೆ: ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆಗೆ',
    topRated: 'ಹೆಚ್ಚು ರೇಟ್ ಮಾಡಲಾದ',
    grid: 'ಗ್ರಿಡ್',
    list: 'ಪಟ್ಟಿ',
    welcome: 'ಐಥೀರಿಯಾಕ್ಕೆ ಸುಸ್ವಾಗತ',
    subWelcome: 'ತಂತ್ರಜ್ಞಾನದ ಭವಿಷ್ಯವನ್ನು ಅನ್ವೇಷಿಸಿ. ಆಧುನಿಕ ಅನ್ವೇಷಕರಿಗೆ ಪ್ರೀಮಿಯಂ ಗೇರ್.',
    exploreCatalog: 'ಕ್ಯಾಟಲಾಗ್ ಅನ್ವೇಷಿಸಿ',
    featuredProducts: 'ವಿಶೇಷ ಉತ್ಪನ್ನಗಳು',
    ratingsCountSuffix: 'ಜಾಗತಿಕ ರೇಟಿಂಗ್‌ಗಳು',
    itemsLeft: 'ವಸ್ತುಗಳು ಮಾತ್ರ ಇವೆ!',
    only: 'ಕೇವಲ'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('EN');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as LanguageCode;
    if (storedLang && ['EN', 'HI', 'TE', 'TA', 'KN'].includes(storedLang)) {
      setLanguageState(storedLang);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const langDict = translations[language];
    return langDict[key] || translations['EN'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
