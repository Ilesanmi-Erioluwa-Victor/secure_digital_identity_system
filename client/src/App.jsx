import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#182532',
              color: '#F7F9FC',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#16A34A',
                secondary: '#F7F9FC',
              },
            },
            error: {
              iconTheme: {
                primary: '#DC2626',
                secondary: '#F7F9FC',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
