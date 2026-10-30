// Vike pageContext
// As described in https://vike.dev/pageContext#typescript

import type {
  /*
          // When using Client Routing https://vike.dev/clientRouting
          PageContextBuiltInClientWithClientRouting as PageContextBuiltInClient
          /*
   */
  // For code loaded in client and server
  PageContextWithServerRouting as PageContext,
  // For code loaded in client only
  PageContextClientWithServerRouting as PageContextClient,
  // For code loaded in server only
  PageContextServer as PageContextServer,
} from "vike/types";

export type PageProps = Record<string, unknown>;
export type PageStyle = "home" | "content" | "fullscreen";

export type DocumentProps = {
  title?: string;
  description?: string;
  scripts?: string[];
};

type User = { groups: string[] };

declare global {
  namespace Vike {
    interface Config {
      description?: string;
      scripts?: string[];
      /** Layout from `pageLayouts` in `~/layouts`. */
      pageStyle?: PageStyle;
      /** Header controls a page (or subtree) hands to `SitePageHeader`. */
      headerActions?: React.ComponentType | null;
    }
    interface PageContext {
      pageProps?: PageProps;
      urlPathname: string;
      mdxContent?: string;
      environment: Record<string, string>;
      exports: {
        pageStyle?: PageStyle;
        documentProps?: DocumentProps;
      };
      // Refine type of pageContext.Page (it's `unknown` by default)
      //Page: () => React.ReactNode;
    }
  }
}

// Tell TypeScript this file isn't an ambient module:
export { PageContext, PageContextClient, PageContextServer };
