import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryProvider, AppRouter} from '@/app';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  </StrictMode>,
);
