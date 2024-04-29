import RootPage from './root';
import Page from './Page';

export const AllRoutes = [
  { path: '*', element: <Page /> }
]

export const Routes = [
  {
    path: '/',
    element: <RootPage />,
    errorElement: <div>Error</div>,
    children: [
      ...AllRoutes,
    ],
  },
]