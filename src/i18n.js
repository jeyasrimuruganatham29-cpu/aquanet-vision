import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/common.json';
import hi from './locales/hi/common.json';
import ta from './locales/ta/common.json';
import te from './locales/te/common.json';
import kn from './locales/kn/common.json';
import ml from './locales/ml/common.json';
import bn from './locales/bn/common.json';
import mr from './locales/mr/common.json';

const resources = {
  en: { common: en },
  hi: { common: hi },
  ta: { common: ta },
  te: { common: te },
  kn: { common: kn },
  ml: { common: ml },
  bn: { common: bn },
  mr: { common: mr },
};

const ui = {
  en: {
    dashboardTitle: 'Dashboard', dashboardSubtitle: 'Processed CPCB water intelligence and national monitoring coverage',
    processedRecords: 'Processed records', statesCovered: 'States covered', districtsCovered: 'Districts covered', monitoringStations: 'Monitoring stations',
    riversCovered: 'Rivers covered', satelliteSamples: 'Satellite samples', qualityDistribution: 'Water quality class distribution',
    remoteSensing: 'Remote sensing layer', openAnalytics: 'Open analytics', inspectMap: 'Inspect national map', nationalMap: 'India monitoring map', openFullMap: 'Open full map',
    indiaAnalysis: 'India analysis', stateRanking: 'State-wise water quality ranking', searchState: 'Search a state', allStatuses: 'All statuses', score: 'Score', rank: 'Rank', state: 'State', meanWqi: 'Mean WQI', records: 'Records', status: 'Status',
    analyticsTitle: 'Water quality analytics', parameterAnalysis: 'Core parameter analysis', wqiTrajectory: 'Water Quality Index trajectory', phTrend: 'pH trend', doTrend: 'Dissolved oxygen trend', turbidityTrend: 'Turbidity trend', tdsTrend: 'TDS trend', bodTrend: 'BOD trend', codTrend: 'COD trend',
    predictionTitle: 'AI water quality prediction', predict: 'Predict water quality', confidence: 'Confidence', recommendation: 'Recommendation', reset: 'Reset defaults',
    modelComparison: 'Model comparison', accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', f1: 'F1 score', bestModel: 'Best model',
    reportsTitle: 'Reports', exportCsv: 'Export CSV', downloadPdf: 'Generate and download PDF', documentTitle: 'Document title', targetWaterBody: 'Target water body',
    aboutTitle: 'About AquaNet Vision', objectives: 'Objectives', methodology: 'Methodology', dataset: 'Dataset', team: 'Team', loading: 'Loading', error: 'Error',
  },
  hi: {
    dashboardTitle: 'डैशबोर्ड', dashboardSubtitle: 'प्रसंस्कृत CPCB जल डेटा और राष्ट्रीय निगरानी कवरेज', processedRecords: 'प्रसंस्कृत रिकॉर्ड', statesCovered: 'शामिल राज्य', districtsCovered: 'शामिल जिले', monitoringStations: 'निगरानी स्टेशन', riversCovered: 'शामिल नदियाँ', satelliteSamples: 'उपग्रह नमूने', qualityDistribution: 'जल गुणवत्ता वर्ग वितरण', remoteSensing: 'दूरसंवेदी परत', openAnalytics: 'विश्लेषण खोलें', inspectMap: 'राष्ट्रीय मानचित्र देखें', nationalMap: 'भारत निगरानी मानचित्र', openFullMap: 'पूरा मानचित्र खोलें', indiaAnalysis: 'भारत विश्लेषण', stateRanking: 'राज्यवार जल गुणवत्ता रैंकिंग', searchState: 'राज्य खोजें', allStatuses: 'सभी स्थिति', score: 'स्कोर', rank: 'रैंक', state: 'राज्य', meanWqi: 'औसत WQI', records: 'रिकॉर्ड', status: 'स्थिति', analyticsTitle: 'जल गुणवत्ता विश्लेषण', parameterAnalysis: 'मुख्य पैरामीटर विश्लेषण', wqiTrajectory: 'जल गुणवत्ता सूचकांक प्रवृत्ति', phTrend: 'pH प्रवृत्ति', doTrend: 'घुलित ऑक्सीजन प्रवृत्ति', turbidityTrend: 'गंदलापन प्रवृत्ति', tdsTrend: 'TDS प्रवृत्ति', bodTrend: 'BOD प्रवृत्ति', codTrend: 'COD प्रवृत्ति', predictionTitle: 'AI जल गुणवत्ता पूर्वानुमान', predict: 'जल गुणवत्ता पूर्वानुमान', confidence: 'विश्वास', recommendation: 'सिफारिश', reset: 'डिफ़ॉल्ट रीसेट', modelComparison: 'मॉडल तुलना', accuracy: 'सटीकता', precision: 'प्रिसिजन', recall: 'रिकॉल', f1: 'F1 स्कोर', bestModel: 'श्रेष्ठ मॉडल', reportsTitle: 'रिपोर्ट', exportCsv: 'CSV निर्यात', downloadPdf: 'PDF डाउनलोड करें', documentTitle: 'दस्तावेज़ शीर्षक', targetWaterBody: 'लक्षित जल निकाय', aboutTitle: 'AquaNet Vision के बारे में', objectives: 'उद्देश्य', methodology: 'कार्यप्रणाली', dataset: 'डेटासेट', team: 'टीम', loading: 'लोड हो रहा है', error: 'त्रुटि',
  },
  ta: {
    dashboardTitle: 'டாஷ்போர்டு', dashboardSubtitle: 'செயலாக்கப்பட்ட CPCB நீர் தரவு மற்றும் தேசிய கண்காணிப்பு', processedRecords: 'செயலாக்கப்பட்ட பதிவுகள்', statesCovered: 'உள்ள மாநிலங்கள்', districtsCovered: 'உள்ள மாவட்டங்கள்', monitoringStations: 'கண்காணிப்பு நிலையங்கள்', riversCovered: 'உள்ள ஆறுகள்', satelliteSamples: 'செயற்கைக்கோள் மாதிரிகள்', qualityDistribution: 'நீர் தர வகுப்பு விநியோகம்', remoteSensing: 'தொலை உணர்வு அடுக்கு', openAnalytics: 'பகுப்பாய்வைத் திற', inspectMap: 'தேசிய வரைபடத்தைப் பார்க்க', nationalMap: 'இந்திய கண்காணிப்பு வரைபடம்', openFullMap: 'முழு வரைபடத்தைத் திற', indiaAnalysis: 'இந்திய பகுப்பாய்வு', stateRanking: 'மாநில வாரியான நீர் தர தரவரிசை', searchState: 'மாநிலத்தைத் தேடு', allStatuses: 'அனைத்து நிலைகள்', score: 'மதிப்பெண்', rank: 'தரவரிசை', state: 'மாநிலம்', meanWqi: 'சராசரி WQI', records: 'பதிவுகள்', status: 'நிலை', analyticsTitle: 'நீர் தர பகுப்பாய்வு', parameterAnalysis: 'முக்கிய அளவுரு பகுப்பாய்வு', wqiTrajectory: 'நீர் தரக் குறியீட்டு போக்கு', phTrend: 'pH போக்கு', doTrend: 'கரைந்த ஆக்சிஜன் போக்கு', turbidityTrend: 'கலக்கம் போக்கு', tdsTrend: 'TDS போக்கு', bodTrend: 'BOD போக்கு', codTrend: 'COD போக்கு', predictionTitle: 'AI நீர் தர கணிப்பு', predict: 'நீர் தரத்தை கணிக்க', confidence: 'நம்பிக்கை', recommendation: 'பரிந்துரை', reset: 'இயல்புநிலையை மீட்டமை', modelComparison: 'மாதிரி ஒப்பீடு', accuracy: 'துல்லியம்', precision: 'துல்லியத்தன்மை', recall: 'மீட்டெடுப்பு', f1: 'F1 மதிப்பெண்', bestModel: 'சிறந்த மாதிரி', reportsTitle: 'அறிக்கைகள்', exportCsv: 'CSV ஏற்றுமதி', downloadPdf: 'PDF பதிவிறக்கு', documentTitle: 'ஆவணத் தலைப்பு', targetWaterBody: 'இலக்கு நீர்நிலை', aboutTitle: 'AquaNet Vision பற்றி', objectives: 'நோக்கங்கள்', methodology: 'முறை', dataset: 'தரவுத்தொகுப்பு', team: 'குழு', loading: 'ஏற்றுகிறது', error: 'பிழை',
  },
  te: { dashboardTitle: 'డాష్‌బోర్డ్', indiaAnalysis: 'భారత విశ్లేషణ', analyticsTitle: 'నీటి నాణ్యత విశ్లేషణ', predictionTitle: 'AI నీటి నాణ్యత అంచనా', modelComparison: 'మోడల్ పోలిక', reportsTitle: 'నివేదికలు', aboutTitle: 'AquaNet Vision గురించి', processedRecords: 'ప్రాసెస్ చేసిన రికార్డులు', statesCovered: 'కవర్ చేసిన రాష్ట్రాలు', records: 'రికార్డులు', searchState: 'రాష్ట్రాన్ని వెతకండి', status: 'స్థితి', score: 'స్కోర్', rank: 'ర్యాంక్', state: 'రాష్ట్రం', meanWqi: 'సగటు WQI', qualityDistribution: 'నీటి నాణ్యత వర్గ పంపిణీ', remoteSensing: 'రిమోట్ సెన్సింగ్ పొర', openAnalytics: 'విశ్లేషణ తెరవండి', inspectMap: 'జాతీయ మ్యాప్ చూడండి', exportCsv: 'CSV ఎగుమతి' },
  kn: { dashboardTitle: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', indiaAnalysis: 'ಭಾರತ ವಿಶ್ಲೇಷಣೆ', analyticsTitle: 'ನೀರಿನ ಗುಣಮಟ್ಟ ವಿಶ್ಲೇಷಣೆ', predictionTitle: 'AI ನೀರಿನ ಗುಣಮಟ್ಟ ಮುನ್ಸೂಚನೆ', modelComparison: 'ಮಾದರಿ ಹೋಲಿಕೆ', reportsTitle: 'ವರದಿಗಳು', aboutTitle: 'AquaNet Vision ಕುರಿತು', processedRecords: 'ಸಂಸ್ಕರಿಸಿದ ದಾಖಲೆಗಳು', statesCovered: 'ಒಳಗೊಂಡ ರಾಜ್ಯಗಳು', records: 'ದಾಖಲೆಗಳು', searchState: 'ರಾಜ್ಯ ಹುಡುಕಿ', status: 'ಸ್ಥಿತಿ', score: 'ಸ್ಕೋರ್', rank: 'ಶ್ರೇಣಿ', state: 'ರಾಜ್ಯ', meanWqi: 'ಸರಾಸರಿ WQI', qualityDistribution: 'ನೀರಿನ ಗುಣಮಟ್ಟ ವರ್ಗ ವಿತರಣೆ', remoteSensing: 'ದೂರ ಸಂವೇದಿ ಪದರ', openAnalytics: 'ವಿಶ್ಲೇಷಣೆ ತೆರೆಯಿರಿ', inspectMap: 'ರಾಷ್ಟ್ರೀಯ ನಕ್ಷೆ ನೋಡಿ', exportCsv: 'CSV ರಫ್ತು' },
  ml: { dashboardTitle: 'ഡാഷ്ബോർഡ്', indiaAnalysis: 'ഇന്ത്യ വിശകലനം', analyticsTitle: 'ജല ഗുണനിലവാര വിശകലനം', predictionTitle: 'AI ജല ഗുണനിലവാര പ്രവചനം', modelComparison: 'മോഡൽ താരതമ്യം', reportsTitle: 'റിപ്പോർട്ടുകൾ', aboutTitle: 'AquaNet Vision കുറിച്ച്', processedRecords: 'സംസ്‌കരിച്ച രേഖകൾ', statesCovered: 'ഉൾപ്പെട്ട സംസ്ഥാനങ്ങൾ', records: 'രേഖകൾ', searchState: 'സംസ്ഥാനം തിരയുക', status: 'നില', score: 'സ്കോർ', rank: 'റാങ്ക്', state: 'സംസ്ഥാനം', meanWqi: 'ശരാശരി WQI', qualityDistribution: 'ജല ഗുണനിലവാര വർഗ്ഗ വിതരണം', remoteSensing: 'റിമോട്ട് സെൻസിംഗ് പാളി', openAnalytics: 'വിശകലനം തുറക്കുക', inspectMap: 'ദേശീയ മാപ്പ് കാണുക', exportCsv: 'CSV കയറ്റുമതി' },
  bn: { dashboardTitle: 'ড্যাশবোর্ড', indiaAnalysis: 'ভারত বিশ্লেষণ', analyticsTitle: 'জলের মান বিশ্লেষণ', predictionTitle: 'AI জলমান পূর্বাভাস', modelComparison: 'মডেল তুলনা', reportsTitle: 'রিপোর্ট', aboutTitle: 'AquaNet Vision সম্পর্কে', processedRecords: 'প্রক্রিয়াজাত রেকর্ড', statesCovered: 'অন্তর্ভুক্ত রাজ্য', records: 'রেকর্ড', searchState: 'রাজ্য খুঁজুন', status: 'স্থিতি', score: 'স্কোর', rank: 'র‍্যাঙ্ক', state: 'রাজ্য', meanWqi: 'গড় WQI', qualityDistribution: 'জলের মান শ্রেণি বিতরণ', remoteSensing: 'রিমোট সেন্সিং স্তর', openAnalytics: 'বিশ্লেষণ খুলুন', inspectMap: 'জাতীয় মানচিত্র দেখুন', exportCsv: 'CSV রপ্তানি' },
  mr: { dashboardTitle: 'डॅशबोर्ड', indiaAnalysis: 'भारत विश्लेषण', analyticsTitle: 'पाणी गुणवत्ता विश्लेषण', predictionTitle: 'AI पाणी गुणवत्ता अंदाज', modelComparison: 'मॉडेल तुलना', reportsTitle: 'अहवाल', aboutTitle: 'AquaNet Vision विषयी', processedRecords: 'प्रक्रिया केलेल्या नोंदी', statesCovered: 'समाविष्ट राज्ये', records: 'नोंदी', searchState: 'राज्य शोधा', status: 'स्थिती', score: 'गुण', rank: 'क्रमांक', state: 'राज्य', meanWqi: 'सरासरी WQI', qualityDistribution: 'पाणी गुणवत्ता वर्ग वितरण', remoteSensing: 'रिमोट सेन्सिंग स्तर', openAnalytics: 'विश्लेषण उघडा', inspectMap: 'राष्ट्रीय नकाशा पहा', exportCsv: 'CSV निर्यात' },
};

Object.entries(ui).forEach(([language, values]) => {
  resources[language].common = { ...values, ...resources[language].common };
});

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('aquanet-language') || 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (language) => {
  localStorage.setItem('aquanet-language', language);
  document.documentElement.lang = language;
});

export default i18n;
