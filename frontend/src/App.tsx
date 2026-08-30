import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout/AppLayout';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { WorkspacePage } from './features/workspace/WorkspacePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/workspace/:cardId" element={<WorkspacePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster
          richColors
          closeButton
          position="bottom-right"
          toastOptions={{
            className: 'rounded-xl font-sans',
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
