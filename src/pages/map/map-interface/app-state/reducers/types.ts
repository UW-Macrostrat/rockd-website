import { CoreState, CoreAction } from "./core";
import { MapAction } from "./map";
import {
  ReduxRouterState,
  RouterActions,
} from "@lagunovsky/redux-react-router";

export type MenuAction = { type: "set-menu-page"; page: MenuPage | null };

export enum MenuPage {
  LAYERS = "layers",
  SETTINGS = "settings",
  ABOUT = "about",
  USAGE = "usage",
  CHANGELOG = "changelog",
  EXPERIMENTS = "experiments",
}

export type MenuState = {
  activePage: MenuPage | null;
};

export type AppState = {
  core: CoreState;
  router: ReduxRouterState;
  menu: MenuState;
};

type OverallActions = { type: "replace-state"; state: AppState };

export type AppAction =
  | CoreAction
  | MapAction
  | RouterActions
  | MenuAction
  | OverallActions;
export * from "./types";
