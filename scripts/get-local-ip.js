#!/usr/bin/env node
/**
 * Cross-platform script to get the local network IP address.
 * Works on macOS, Linux, and Windows.
 */
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  // Common interface names across platforms
  const interfaceNames = [
    'en0',      // macOS WiFi
    'en1',      // macOS Ethernet
    'eth0',     // Linux
    'wlan0',    // Linux WiFi
    'Ethernet', // Windows
    'Wi-Fi',    // Windows
  ];
  
  // Try known interface names first
  for (const name of interfaceNames) {
    const iface = interfaces[name];
    if (iface) {
      const ipv4 = iface.find(addr => addr.family === 'IPv4' && !addr.internal);
      if (ipv4) {
        return ipv4.address;
      }
    }
  }
  
  // Fallback: search all interfaces for a non-internal IPv4 address
  for (const [name, addrs] of Object.entries(interfaces)) {
    const ipv4 = addrs?.find(addr => addr.family === 'IPv4' && !addr.internal);
    if (ipv4) {
      return ipv4.address;
    }
  }
  
  // Last resort: localhost
  return 'localhost';
}

console.log(getLocalIP());
