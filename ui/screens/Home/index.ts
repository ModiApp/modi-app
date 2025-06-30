import { MapProviderToProps } from "src/util/MapProviderToProps";

import HomeScreenBase from "./Base";
import HomeScreenProvider, { HomeScreenContext } from "./Provider";

const HomeScreen = MapProviderToProps({
  Component: HomeScreenBase,
  Provider: HomeScreenProvider,
  Context: HomeScreenContext,
});

export default HomeScreen;
