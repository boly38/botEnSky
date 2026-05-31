/**
 * 📦 pnpm configuration file
 * Dependency overrides for botEnSky project
 * See: https://pnpm.io/pnpmfile
 */

module.exports = {
  hooks: {
    readPackage(pkg) {
      // Override dependencies
      if (!pkg.pnpm) {
        pkg.pnpm = {};
      }
      if (!pkg.pnpm.overrides) {
        pkg.pnpm.overrides = {};
      }

      Object.assign(pkg.pnpm.overrides, {
        "undici@<6.24.1": ">=6.24.1",
        "path-to-regexp": "8.4.1",
        "qs": "6.15.0",
        "picomatch": "2.3.2",
        "minimatch@^5.0.0": "5.1.8",
        "minimatch@^9.0.0": "9.0.7",
        "brace-expansion@^2.0.0": "2.0.3",
        "brace-expansion@^5.0.0": "5.0.5"
      });

      return pkg;
    }
  }
};

