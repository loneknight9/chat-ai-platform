import type { LinksFunction, MetaFunction } from "react-router";

export namespace Route {
  export type MetaArgs = Parameters<MetaFunction>;
  export type LinksArgs = Parameters<LinksFunction>;
  export type ErrorBoundaryProps = {
    error: Error;
  };
}
