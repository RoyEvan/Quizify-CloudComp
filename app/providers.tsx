"use client";
import { SessionProvider } from 'next-auth/react'
import {ThemeProvider as NextThemesProvider} from "next-themes";
import { Provider } from 'react-redux';
import { AppStore, makeStore } from '@/lib/store/store';
import { useRef } from 'react';
import { HeroUIProvider } from '@heroui/react';

export function Providers({children}: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  return (
    <SessionProvider>
      <HeroUIProvider>
        <NextThemesProvider attribute="class" defaultTheme="dark">
          <Provider store={storeRef.current}>
            {children}
          </Provider>
        </NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}