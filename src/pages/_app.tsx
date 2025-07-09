import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { TaskProvider } from '@/context/task-context';
import { MainLayout } from '@/components/MainLayout';
import { Toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/router';
import '@/app/globals.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Head>
          <title>TaskFlow</title>
          <meta name="description" content="A Google-themed task management app" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <AuthProvider>
        <TaskProvider>
          {router.pathname === '/login' ? (
            <Component {...pageProps} />
          ) : (
            <MainLayout>
              <Component {...pageProps} />
            </MainLayout>
          )}
          <Toaster />
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
