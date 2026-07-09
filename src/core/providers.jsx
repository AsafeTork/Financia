import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalErrorBoundary } from '../shared/GlobalErrorBoundary.jsx';

var queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30 * 1000 },
    mutations: { retry: 0 },
  },
});

export default function Providers({ children }) {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <GlobalErrorBoundary>
          {children}
        </GlobalErrorBoundary>
      </QueryClientProvider>
    </HashRouter>
  );
}
