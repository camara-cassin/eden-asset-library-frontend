import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  Dashboard,
  CreateAsset,
  EditAsset,
  AssetDetails,
  PublicBrowse,
  PublicAssetDetails,
  Login,
  Signup,
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
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/assets/new" element={<ProtectedRoute><CreateAsset /></ProtectedRoute>} />
              <Route path="/assets/:id/edit" element={<ProtectedRoute><EditAsset /></ProtectedRoute>} />
              <Route path="/assets/:id" element={<ProtectedRoute><AssetDetails /></ProtectedRoute>} />
              <Route path="/public" element={<PublicBrowse />} />
              <Route path="/public/:id" element={<PublicAssetDetails />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App
