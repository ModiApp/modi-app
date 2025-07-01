import { MapProviderToProps } from "@/ui/util";
import LobbyScreenBase from "./Base";
import JoinLobbyProvider, { LobbyContext } from "./Provider";

const JoinLobbyScreen = MapProviderToProps({
  Component: LobbyScreenBase,
  Provider: JoinLobbyProvider,
  Context: LobbyContext,
});

export default JoinLobbyScreen;
