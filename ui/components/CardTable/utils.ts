export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculatePlayerPositions(
  players: { playerId: string; username: string }[],
  radius: number,
  currentUserId: string
): { playerId: string; username: string; x: number; y: number; rotation: number }[] {
  const currentUserIndex = players.findIndex(
    (player) => player.playerId === currentUserId
  );
  const currentUserAngle = (currentUserIndex * 360) / players.length;
  const rotationDegrees = 90 - currentUserAngle;

  return players.map((player, index) => {
    const baseAngle = (index * 2 * Math.PI) / players.length;
    const rotatedAngle = baseAngle + degreesToRadians(rotationDegrees);
    const x = radius * Math.cos(rotatedAngle);
    const y = radius * Math.sin(rotatedAngle);
    return {
      x,
      y,
      rotation: radiansToDegrees(rotatedAngle) - 90,
      ...player,
    };
  });
} 