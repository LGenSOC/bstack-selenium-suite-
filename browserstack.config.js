const commonCapabilities = {
  //Updated variable names for BrowserStack credentials
  "browserstack.user": process.env.BROWSERSTACK_USERNAME,
  "browserstack.key": process.env.BROWSERSTACK_ACCESS_KEY,
  //
  projectName: "BSTACK Tech Challenge",
  buildName: "Tech Challenge Test Build",
  "browserstack.debug": true,
  "browserstack.networkLogs": true,
};

// --- ADDING NEW DIAGNOSTIC LINES HERE ---
//  Updated variable names in console.log for diagnostics
console.log("BrowserStack Config:");
console.log(
  "Username set:",
  process.env.BROWSERSTACK_USERNAME ? "*****" : "Not found"
);
console.log(
  "Access key set:",
  process.env.BROWSERSTACK_ACCESS_KEY ? "*****" : "Not found"
);
// --- ENDING NEW DIAGNOSTIC LINES ---

const capabilities = [];
// Configuration for Windows 10 Chrome
capabilities.push({
  ...commonCapabilities,
  os: "Windows",
  os_version: "10",
  browserName: "Chrome",
});

// Configuration for macOS Ventura Firefox
capabilities.push({
  ...commonCapabilities,
  os: "OS X",
  os_version: "Ventura",
  browserName: "Firefox",
});

// Configuration for Samsung Galaxy S22 (Real Mobile Device)
capabilities.push({
  ...commonCapabilities,
  device: "Samsung Galaxy S22",
  realMobile: "true",
  browserName: "Android", // Use "Android" for mobile browsers on real devices
});

module.exports = {
  capabilities,
};
// the end
