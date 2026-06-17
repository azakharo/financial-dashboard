import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryProvider, AppRouter} from '@/app';
import {Agentation} from 'agentation';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AppRouter />

      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryProvider>
    <Agentation />
  </StrictMode>,
);
