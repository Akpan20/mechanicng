import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { store, persistor } from '@/store'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <HelmetProvider>
            <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
              <App />
              <Toaster
                position="bottom-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#13131a',
                    color: '#f0f0f0',
                    border: '1px solid #2a2a3e',
                    borderRadius: '12px',
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 600,
                  },
                  success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                  error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
              />
            </BrowserRouter>
          </HelmetProvider>
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
)