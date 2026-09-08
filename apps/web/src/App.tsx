import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './app/AppShell';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { SearchPage } from './pages/SearchPage';
import { ArtistPage } from './pages/ArtistPage';
import { AlbumPage } from './pages/AlbumPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { LibraryPage } from './pages/LibraryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/radio" element={<Navigate to="/browse" replace />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/album/:id" element={<AlbumPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/liked" element={<LibraryPage />} />
            <Route path="/library/history" element={<LibraryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
