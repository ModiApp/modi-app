import { auth } from "@/config/firebase";
import { Alert } from "@/ui/components/AlertBanner";
import { useState } from "react";

interface UpdateGameSettingsParams {
  gameId: string;
  initialLives?: number;
}

async function updateGameSettingsApi(params: UpdateGameSettingsParams) {
  const { gameId, ...body } = params;
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/games/${gameId}/settings`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to update game settings: ${response.statusText}`);
  }
  return response.json() as Promise<{ success: boolean }>;
}

/**
 * A hook to update game settings while in the gathering-players state.
 *
 * Only the host of the game can update settings.
 */
export function useUpdateGameSettings() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSettings = async (params: UpdateGameSettingsParams) => {
    if (!params.gameId || params.gameId.trim().length === 0) {
      Alert.error({ message: "Invalid game ID" });
      return;
    }

    try {
      console.log("useUpdateGameSettings: Updating settings", params);
      setIsUpdating(true);

      const result = await updateGameSettingsApi(params);
      console.log("useUpdateGameSettings: Settings updated successfully:", result);
    } catch (error: any) {
      console.error("useUpdateGameSettings: Error updating settings:", error);
      Alert.error({ message: "Failed to update game settings. Please try again." });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateSettings,
    isUpdating,
  };
}

