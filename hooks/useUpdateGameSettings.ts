import { auth } from "@/config/firebase";
import { Alert } from "@/ui/components/AlertBanner";
import { useState } from "react";

interface UpdateGameSettingsPayload {
  initialLives: number;
}

interface UpdateGameSettingsResponse {
  success: boolean;
  initialLives: number;
}

async function updateGameSettingsApi(
  gameId: string,
  payload: UpdateGameSettingsPayload
): Promise<UpdateGameSettingsResponse> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/games/${gameId}/settings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text || `Failed to update game settings: ${response.statusText}`
    );
  }

  return response.json();
}

export function useUpdateGameSettings() {
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const updateSettings = async (
    gameId: string,
    payload: UpdateGameSettingsPayload
  ): Promise<number | null> => {
    if (!gameId) {
      Alert.error({ message: "Invalid game ID" });
      return null;
    }

    try {
      setIsUpdatingSettings(true);
      const result = await updateGameSettingsApi(gameId, payload);
      return result.initialLives;
    } catch (error) {
      console.error("useUpdateGameSettings: Error updating settings", error);
      Alert.error({ message: "Failed to update game settings." });
      return null;
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return { updateSettings, isUpdatingSettings };
}

