import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter, StaticRouterProvider, createStaticHandler } from "react-router-dom/server"
import { Request as EReq, Response as ERes } from "express"

import 'vite/modulepreload-polyfill'
import type {
  StaticHandlerContext, Router
} from "@remix-run/router";

import App from './App'
import { type IApiClient, createApiClient } from './api/client';
import { Config } from './Config'
import { StrictMode } from 'react';
import { Routes } from './pages/routes'

export const routeHandler = createStaticHandler(Routes)

interface RenderOptions {
  url: string
  context: StaticHandlerContext
  router: Router
  ssrManifest: any
  assets: {
    bootstrapScripts: string[],
    bootstrapModules: string[],
    css: string[],
  },
  req: EReq,
  res: ERes,
  isbot: boolean,
  config: typeof Config,
  apiClient?: IApiClient
}


export function RouteApp({ url, context, router, apiClient, config }: RenderOptions) {
  const _app = (
    <App isSSR apiClient={apiClient!}>
      <StaticRouterProvider router={router} context={context} />
      <StaticRouter location={`/${url}`} />
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


export function render({ assets, ...props }: RenderOptions) {
  const started = (new Date()).getTime();
  const url = props.url;
  const config = Config;
  const apiClient = createApiClient({
    url: config.apiUrl,
    accountKey: config.accountKey,
    apiKey: config.apiKey,
    cache: null,
    isSSR: true,
  })
  const Document = () => {

    return (
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          {/* <link rel="icon" type="image/svg+xml" href="/vite.svg" /> */}
          <link rel="icon" href="/rzFavIcon.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Roanuz</title>
          {config.isProduction && (
            <>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin='' />
            </>
          )}
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />

          {assets.bootstrapScripts.map((src, i) => (
            <script key={i} type="module" dangerouslySetInnerHTML={{ __html: src }} />
          ))}
          {assets.bootstrapModules.map((src) => (
            <script type="module" key={src} src={src} />
          ))}
          {assets.css.map((href) => (
            <link key={href} rel="stylesheet" href={href} />
          ))}
        </head>
        <body>
          <div id="root">
            <RouteApp
              {...props}
              assets={assets}
              config={config}
              apiClient={apiClient}
            />
          </div>
        </body>
      </html>
    )
  }

  const isbot = props.isbot
  const res = props.res
  let didError = false;
  let caughtError: any = null;

  const getStatusCode = () => {
    if (didError) {
      if (caughtError) {
        return 404;
      } else {
        return 500;
      }
    } else {
      return 200;
    }
  }

  const writePreResponse = () => {
    res.statusCode = getStatusCode();
    res.setHeader('Content-type', 'text/html');
  }
  const writePostResponse = () => {
    res.write('<script id="__ROANUZ_DS__" type="application/json">');
    res.write('</script>');
  }

  const { pipe, abort } = renderToPipeableStream(<Document />, {
    bootstrapModules: assets.bootstrapModules,

    onShellReady() {
      try {
        const ended = (new Date()).getTime();
        console.log(`\t [Render Shell] ${ended - started}ms ${url}`)
        if (!isbot) {
          writePreResponse();
          pipe(res);
          writePostResponse();
        }
      } catch (e) {
        console.log('Error in shell rendering:', e);
        console.error(e);
      }
    },

    onAllReady() {
      try {
        const ended = (new Date()).getTime();
        console.log(`\t [Render All] ${ended - started}ms ${url}`)
        if (isbot) {
          writePreResponse();
          pipe(res);
          writePostResponse();
        }
      } catch (e) {
        console.log('Error in shell rendering (All Ready):', e);
        console.error(e);
      }
    },

    onShellError(error: any) {
      res.statusCode = getStatusCode();
      console.error('Error in shell rendering:', error)
      res.setHeader('content-type', 'text/html');
      res.send('<h1>Something went wrong</h1>');
    },

    onError(error) {
      didError = true;
      caughtError = error;
      console.error(error);
      // logServerCrashReport(error);
    },
  });

  setTimeout(abort, 5000);
}