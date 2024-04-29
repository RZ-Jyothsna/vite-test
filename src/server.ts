
import fs from 'node:fs'
import express, { Express, Request as EReq, Response } from "express";
import { ViteDevServer } from "vite";
import {
  createStaticRouter
} from "react-router-dom/server";
import {
  matchRoutes
} from "react-router-dom";
import type {
  StaticHandler, StaticHandlerContext,
  AgnosticDataRouteObject, AgnosticRouteMatch,
} from "@remix-run/router";
import path from 'node:path';
import { createIsbotFromList, isbotMatches, list } from "isbot";


// Constants
// const isProduction = process.env.NODE_ENV === 'production';
const isProduction = true;
const port = process.env.PORT || 5023;
const base = process.env.BASE || '/';
const buildFolder = path.resolve(process.cwd(), 'dist');
const clientBuildFolder = path.resolve(buildFolder, 'client');


const app: Express = express()
let vite: ViteDevServer;


// Bot detection
const ChromeLighthouseUserAgentStrings: string[] = [
  "mozilla/5.0 (macintosh; intel mac os x 10_15_7) applewebkit/537.36 (khtml, like gecko) chrome/94.0.4590.2 safari/537.36 chrome-lighthouse",
  "mozilla/5.0 (linux; android 7.0; moto g (4)) applewebkit/537.36 (khtml, like gecko) chrome/94.0.4590.2 mobile safari/537.36 chrome-lighthouse",
];
const uaPatternsToRemove = new Set<string>(
  ChromeLighthouseUserAgentStrings.map(isbotMatches).flat(),
);

const isbot = createIsbotFromList(
  list.filter((record) => uaPatternsToRemove.has(record) === false),
);


// Configure the server
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv(clientBuildFolder, { extensions: [] }))
}


const ssrManifest = isProduction
  ? fs.readFileSync(path.resolve(clientBuildFolder, '.vite/ssr-manifest.json'), 'utf8')
  : {}


// Define handler
app.use('*', async (req: EReq, res: Response) => {
  try {
    const url = req.originalUrl.replace(base, '')
    let serverParams: { render: any, routeHandler: StaticHandler }

    if (!isProduction) {
      // console.log('Template', template)
      serverParams = (await vite.ssrLoadModule('/src/entry-server.tsx')) as any
      // config = (await vite.ssrLoadModule('/src/Config.ts')) as any
    } else {
      // @ts-ignore
      serverParams = (await import(path.resolve(buildFolder, 'server/entry-server.js')))
    }

    const routeHandler = serverParams.routeHandler
    const routeMatches = matchRoutes(routeHandler.dataRoutes, `/${url}`)

    console.log("routeMatches", routeMatches)

    const fetchRequest = createFetchRequest(req);
    const context = (await routeHandler.query(fetchRequest)) as StaticHandlerContext;
    const router = createStaticRouter(routeHandler.dataRoutes, context);
    const assets = await getAssets(isProduction, routeMatches)


    await serverParams.render({
      url,
      ssrManifest,
      router,
      context,
      assets,
      req,
      res,
      isbot: isbot(req.get("user-agent")!),
      // isbot: true || isbot(req.get("user-agent")!),
    })
  } catch (e: any) {
    vite?.ssrFixStacktrace(e)
    console.log(e.stack)
    res.status(500).end(e.stack)
  }
})


function createFetchRequest(req: EReq) {
  const origin = `${req.protocol}://${req.get("host")}`;
  // Note: This had to take originalUrl into account for presumably vite's proxying
  const url = new URL(req.originalUrl || req.url, origin);

  const controller = new AbortController();
  req.on("close", () => controller.abort());

  const headers = new Headers();

  for (const [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  const init = {
    method: req.method,
    headers,
    signal: controller.signal,
    body: undefined,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }

  return new Request(url.href, init);
}


let manifestFile: Record<string, any> | null = null;
async function readManifest() {
  if (!manifestFile) {
    const raw = fs.readFileSync(path.resolve(clientBuildFolder, '.vite/manifest.json'), 'utf-8')
    manifestFile = JSON.parse(raw.toString())
  }
  return manifestFile
}

async function getAssets(
  isProd: boolean,
  routeMatches: AgnosticRouteMatch<string, AgnosticDataRouteObject>[] | null
) {
  if (!isProd) {
    return {
      bootstrapScripts: [],
      bootstrapModules: [
        '/@vite/client',
        '/src/entry-client.tsx',
      ],
      css: ['/src/css/reset.css', ],
    }
  }

  const manifest = await readManifest()

  const bootstrapScripts: string[] = []
  const bootstrapModules: string[] = []
  const css: string[] = []
  const lookupFiles = ['src/entry-client.tsx']

  if (routeMatches) {
    routeMatches.forEach((match) => {
      //@ts-ignore
      const element = match.route.element!
      if (
        element?.props?.filePath) {
        const filePath = './' + element.props.filePath
        let lookFile = path.resolve('/src/routes',  filePath)

        lookFile = lookFile.substring(1, lookFile.length)

        if (!lookFile.endsWith('.tsx') && !lookFile.endsWith('.ts') && !lookFile.endsWith('.js')) {
          lookFile = lookFile + '.tsx'
        }

        lookupFiles.push(lookFile)
      }
    })
  }

  const fixAssetPath = (file: string) => {
    if (!file.startsWith('/')){
      return '/' + file
    }
    return file
  }

  console.log('lookupFiles', lookupFiles)

  lookupFiles.forEach((lookupFile) => {
    if (manifest?.[lookupFile]) {
      bootstrapModules.push(fixAssetPath(manifest[lookupFile].file));
      css.push(...(manifest[lookupFile].css.map(fixAssetPath)));
    }
  })


  return {
    bootstrapScripts,
    bootstrapModules,
    css
  }
}

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})