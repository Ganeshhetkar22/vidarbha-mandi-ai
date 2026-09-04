// Static reference data for the 11 Vidarbha districts.
// Source: Government of Maharashtra district administration.
// Mandi names are real APMC markets operating in each district.

export const DISTRICTS = [
  { id: 'nagpur', name: 'Nagpur', nameMr: 'नागपूर', region: 'Nagpur' },
  { id: 'wardha', name: 'Wardha', nameMr: 'वर्धा', region: 'Nagpur' },
  { id: 'bhandara', name: 'Bhandara', nameMr: 'भंडारा', region: 'Nagpur' },
  { id: 'gondia', name: 'Gondia', nameMr: 'गोंदिया', region: 'Nagpur' },
  { id: 'chandrapur', name: 'Chandrapur', nameMr: 'चंद्रपूर', region: 'Nagpur' },
  { id: 'gadchiroli', name: 'Gadchiroli', nameMr: 'गडचिरोली', region: 'Nagpur' },
  { id: 'amravati', name: 'Amravati', nameMr: 'अमरावती', region: 'Amravati' },
  { id: 'akola', name: 'Akola', nameMr: 'अकोला', region: 'Amravati' },
  { id: 'buldhana', name: 'Buldhana', nameMr: 'बुलढाणा', region: 'Amravati' },
  { id: 'washim', name: 'Washim', nameMr: 'वाशिम', region: 'Amravati' },
  { id: 'yavatmal', name: 'Yavatmal', nameMr: 'यवतमाळ', region: 'Amravati' },
];

export const MANDIS = [
  // Nagpur
  { id: 'nagpur-apmc', name: 'Nagpur APMC', nameMr: 'नागपूर आवारा बाजार समिती', districtId: 'nagpur', distanceFromHQ: 0 },
  { id: 'nagpur-kalamna', name: 'Kalamna Market', nameMr: 'कळमना बाजार', districtId: 'nagpur', distanceFromHQ: 12 },
  { id: 'nagpur-katol', name: 'Katol Market', nameMr: 'काटोल बाजार', districtId: 'nagpur', distanceFromHQ: 55 },
  // Wardha
  { id: 'wardha-apmc', name: 'Wardha APMC', nameMr: 'वर्धा आवारा बाजार समिती', districtId: 'wardha', distanceFromHQ: 0 },
  { id: 'wardha-arvi', name: 'Arvi Market', nameMr: 'आरवी बाजार', districtId: 'wardha', distanceFromHQ: 42 },
  // Bhandara
  { id: 'bhandara-apmc', name: 'Bhandara APMC', nameMr: 'भंडारा आवारा बाजार समिती', districtId: 'bhandara', distanceFromHQ: 0 },
  { id: 'bhandara-tumsar', name: 'Tumsar Market', nameMr: 'तुमसर बाजार', districtId: 'bhandara', distanceFromHQ: 35 },
  // Gondia
  { id: 'gondia-apmc', name: 'Gondia APMC', nameMr: 'गोंदिया आवारा बाजार समिती', districtId: 'gondia', distanceFromHQ: 0 },
  { id: 'gondia-arjuni', name: 'Arjuni Morgaon Market', nameMr: 'अर्जुनी मोरगाव बाजार', districtId: 'gondia', distanceFromHQ: 40 },
  // Chandrapur
  { id: 'chandrapur-apmc', name: 'Chandrapur APMC', nameMr: 'चंद्रपूर आवारा बाजार समिती', districtId: 'chandrapur', distanceFromHQ: 0 },
  { id: 'chandrapur-warora', name: 'Warora Market', nameMr: 'वरोडा बाजार', districtId: 'chandrapur', distanceFromHQ: 38 },
  { id: 'chandrapur-ballarpur', name: 'Ballarpur Market', nameMr: 'बल्लारपूर बाजार', districtId: 'chandrapur', distanceFromHQ: 18 },
  // Gadchiroli
  { id: 'gadchiroli-apmc', name: 'Gadchiroli APMC', nameMr: 'गडचिरोली आवारा बाजार समिती', districtId: 'gadchiroli', distanceFromHQ: 0 },
  { id: 'gadchiroli-desaiganj', name: 'Desaiganj Market', nameMr: 'देसाईगंज बाजार', districtId: 'gadchiroli', distanceFromHQ: 45 },
  // Amravati
  { id: 'amravati-apmc', name: 'Amravati APMC', nameMr: 'अमरावती आवारा बाजार समिती', districtId: 'amravati', distanceFromHQ: 0 },
  { id: 'amravati-achalpur', name: 'Achalpur Market', nameMr: 'आचलपूर बाजार', districtId: 'amravati', distanceFromHQ: 48 },
  { id: 'amravati-morshi', name: 'Morshi Market', nameMr: 'मोरशी बाजार', districtId: 'amravati', distanceFromHQ: 35 },
  // Akola
  { id: 'akola-apmc', name: 'Akola APMC', nameMr: 'अकोला आवारा बाजार समिती', districtId: 'akola', distanceFromHQ: 0 },
  { id: 'akola-akot', name: 'Akot Market', nameMr: 'आकोट बाजार', districtId: 'akola', distanceFromHQ: 50 },
  { id: 'akola-murtizapur', name: 'Murtizapur Market', nameMr: 'मुर्तिजापूर बाजार', districtId: 'akola', distanceFromHQ: 42 },
  // Buldhana
  { id: 'buldhana-apmc', name: 'Buldhana APMC', nameMr: 'बुलढाणा आवारा बाजार समिती', districtId: 'buldhana', distanceFromHQ: 0 },
  { id: 'buldhana-khamgaon', name: 'Khamgaon Market', nameMr: 'खामगाव बाजार', districtId: 'buldhana', distanceFromHQ: 50 },
  { id: 'buldhana-mehkar', name: 'Mehkar Market', nameMr: 'मेहकर बाजार', districtId: 'buldhana', distanceFromHQ: 45 },
  // Washim
  { id: 'washim-apmc', name: 'Washim APMC', nameMr: 'वाशिम आवारा बाजार समिती', districtId: 'washim', distanceFromHQ: 0 },
  { id: 'washim-mangrulpir', name: 'Mangrulpir Market', nameMr: 'मांगरुळपीर बाजार', districtId: 'washim', distanceFromHQ: 30 },
  // Yavatmal
  { id: 'yavatmal-apmc', name: 'Yavatmal APMC', nameMr: 'यवतमाळ आवारा बाजार समिती', districtId: 'yavatmal', distanceFromHQ: 0 },
  { id: 'yavatmal-darwha', name: 'Darwha Market', nameMr: 'दरव्हा बाजार', districtId: 'yavatmal', distanceFromHQ: 40 },
  { id: 'yavatmal-pusad', name: 'Pusad Market', nameMr: 'पुसद बाजार', districtId: 'yavatmal', distanceFromHQ: 55 },
];

export const CROPS = [
  { id: 'soybean', name: 'Soybean', nameMr: 'सोयाबीन', category: 'Oilseed', unit: 'quintal', season: 'Kharif' },
  { id: 'cotton', name: 'Cotton', nameMr: 'कापूस', category: 'Cash Crop', unit: 'quintal', season: 'Kharif' },
  { id: 'tur', name: 'Tur (Arhar)', nameMr: 'तूर (हरभरा)', category: 'Pulse', unit: 'quintal', season: 'Kharif' },
  { id: 'paddy', name: 'Paddy', nameMr: 'धान', category: 'Cereal', unit: 'quintal', season: 'Kharif' },
  { id: 'wheat', name: 'Wheat', nameMr: 'गहू', category: 'Cereal', unit: 'quintal', season: 'Rabi' },
  { id: 'gram', name: 'Gram', nameMr: 'हरभरा (चना)', category: 'Pulse', unit: 'quintal', season: 'Rabi' },
  { id: 'jowar', name: 'Jowar', nameMr: 'ज्वारी', category: 'Cereal', unit: 'quintal', season: 'Kharif' },
  { id: 'maize', name: 'Maize', nameMr: 'मका', category: 'Cereal', unit: 'quintal', season: 'Kharif' },
  { id: 'groundnut', name: 'Groundnut', nameMr: 'भुईमूग', category: 'Oilseed', unit: 'quintal', season: 'Kharif' },
  { id: 'sunflower', name: 'Sunflower', nameMr: 'सूर्यफूल', category: 'Oilseed', unit: 'quintal', season: 'Kharif' },
  { id: 'moong', name: 'Moong', nameMr: 'मूग', category: 'Pulse', unit: 'quintal', season: 'Kharif' },
  { id: 'udid', name: 'Udid', nameMr: 'उडीद', category: 'Pulse', unit: 'quintal', season: 'Kharif' },
  { id: 'onion', name: 'Onion', nameMr: 'कांदा', category: 'Vegetable', unit: 'quintal', season: 'All' },
  { id: 'tomato', name: 'Tomato', nameMr: 'टोमॅटो', category: 'Vegetable', unit: 'quintal', season: 'All' },
  { id: 'orange', name: 'Orange', nameMr: 'संत्री', category: 'Fruit', unit: 'quintal', season: 'All' },
];

export const getDistrict = (id) => DISTRICTS.find((d) => d.id === id);
export const getMandi = (id) => MANDIS.find((m) => m.id === id);
export const getCrop = (id) => CROPS.find((c) => c.id === id);
export const getMandisByDistrict = (districtId) =>
  MANDIS.filter((m) => m.districtId === districtId);
