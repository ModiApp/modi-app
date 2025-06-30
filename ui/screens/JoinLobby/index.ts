import { MapProviderToProps } from "src/util";

import JoinLobbyScreenBase from "./Base";
import JoinLobbyProvider, { JoinLobbyContext } from "./Provider";

const JoinLobbyScreen = MapProviderToProps({
  Component: JoinLobbyScreenBase,
  Provider: JoinLobbyProvider,
  Context: JoinLobbyContext,
});

export default JoinLobbyScreen;
