// @ts-check
const { getDefaultConfig } = require("expo/metro-config");

/** Metro / Expo dev server port (matches package.json scripts). */
const METRO_PORT = 5172;

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  port: METRO_PORT,
};

module.exports = config;
