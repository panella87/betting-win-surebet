import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { BWS_OPERATOR_COCKPIT_BROWSER_ROUTES, type BwsOperatorCockpitBrowserRoute } from '../api/contracts.js';
import type { BwsOperatorCockpitBrowserConfig } from './data-mode.js';
import { BwsOperatorCockpitShell } from './shell.js';

function createRouteElement(
  configuration: BwsOperatorCockpitBrowserConfig,
  route: BwsOperatorCockpitBrowserRoute,
) {
  return <BwsOperatorCockpitShell configuration={configuration} route={route} />;
}

export function createBwsOperatorCockpitBrowserRouter(
  configuration: BwsOperatorCockpitBrowserConfig,
) {
  return createBrowserRouter([
    ...BWS_OPERATOR_COCKPIT_BROWSER_ROUTES.map((route) => ({
      element: createRouteElement(configuration, route),
      path: route.path,
    })),
    {
      element: createRouteElement(configuration, BWS_OPERATOR_COCKPIT_BROWSER_ROUTES[0]),
      path: '*',
    },
  ]);
}

export function BwsOperatorCockpitBrowserRouter(props: Readonly<{
  configuration: BwsOperatorCockpitBrowserConfig;
}>) {
  const router = createBwsOperatorCockpitBrowserRouter(props.configuration);
  return <RouterProvider router={router} />;
}
