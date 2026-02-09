import { createContext } from "react";

export const RouteContext = createContext({
  currentRoute: null,
  setCurrentRoute: () => {},
});
