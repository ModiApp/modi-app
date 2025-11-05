import os from "os";

/**
 * Returns the home network IP address that the computer is connected to.
 * We expose the server on this IP address so that other devices on the home network can access it.
 * This function just figures it out so we can log it in development mode.
 */
export function getLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const addresses = interfaces[name];
    if (addresses) {
      for (const addr of addresses) {
        // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
        // Handle both string ('IPv4') and number (4) family formats
        const family = addr.family as string | number;
        const isIPv4 = family === 'IPv4' || family === 4;
        if (isIPv4 && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  return 'localhost'; // Fallback if no LAN IP found
}