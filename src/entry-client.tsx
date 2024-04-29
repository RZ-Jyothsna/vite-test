import { StrictMode, useState } from 'react';
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter, BrowserRouter } from 'react-router-dom';
import App from './App.tsx'
import { Routes } from './pages/routes.tsx';
import 'vite/modulepreload-polyfill'
import { Config } from './Config.ts';
import { createApiClient } from './api/client';

const router = createBrowserRouter(Routes);

console.log("entry-client");

const ClientApp = () => {
  const config = Config

  const [apiClient] = useState(() => (createApiClient({
    url: config.apiUrl,
    accountKey: config.accountKey,
    apiKey: config.apiKey,
    cache: null,
    isSSR: false,
  })))

  const _app = (
    <App isSSR={false} apiClient={apiClient}>
      <RouterProvider router={router} />
      <BrowserRouter />
    </App>
  )

  if (config.strictMode) {
    return (
      <StrictMode>
        {_app}
      </StrictMode>
    )
  }

  return _app
}

ReactDOM.hydrateRoot(
  document.getElementById('root')!,
  <ClientApp />
)
