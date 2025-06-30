import LobbyScreenBase from "./Base";
import JoinLobbyProvider, { LobbyContext } from "./Provider";
import { MapProviderToProps } from "src/util";

const JoinLobbyScreen = MapProviderToProps({
  Component: LobbyScreenBase,
  Provider: JoinLobbyProvider,
  Context: LobbyContext,
});

export default JoinLobbyScreen;
