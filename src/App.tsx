import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import {
  Dashboard,
  CreateAsset,
  EditAsset,
  AssetDetails,
  PublicBrowse,
  PublicAssetDetails,
} from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets/new" element={<CreateAsset />} />
            <Route path="/assets/:id/edit" element={<EditAsset />} />
            <Route path="/assets/:id" element={<AssetDetails />} />
            <Route path="/public" element={<PublicBrowse />} />
            <Route path="/public/:id" element={<PublicAssetDetails />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App
