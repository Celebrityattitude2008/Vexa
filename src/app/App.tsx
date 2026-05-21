import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { ScanProvider } from './contexts/ScanContext';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ScanProvider>
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--background, #0d0d18)',
                border: '1px solid rgba(128,128,128,0.2)',
                color: 'var(--foreground, #f3f4f6)',
              },
            }}
          />
        </ScanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
