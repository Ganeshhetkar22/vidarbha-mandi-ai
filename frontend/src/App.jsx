import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '@/hooks/languageContext';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { MandiPricesPage } from '@/pages/MandiPricesPage';
import { MandiComparisonPage } from '@/pages/MandiComparisonPage';
import { CropAnalysisPage } from '@/pages/CropAnalysisPage';
import { PricePredictionPage } from '@/pages/PricePredictionPage';
import { WeatherPage } from '@/pages/WeatherPage';
import { AboutPage } from '@/pages/AboutPage';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/mandi-prices" element={<MandiPricesPage />} />
            <Route path="/compare-mandis" element={<MandiComparisonPage />} />
            <Route path="/crop-analysis" element={<CropAnalysisPage />} />
            <Route path="/price-prediction" element={<PricePredictionPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
