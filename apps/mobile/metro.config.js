const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Monorepo roots for package hoisting
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const reactPath = path.resolve(projectRoot, 'node_modules/react');
const reactNativePath = path.resolve(projectRoot, 'node_modules/react-native');

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    extraNodeModules: {
      react: reactPath,
      'react-native': reactNativePath,
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react' || moduleName.startsWith('react/')) {
        const subPath = moduleName === 'react' ? '' : moduleName.replace('react/', '');
        const target = subPath ? path.resolve(reactPath, subPath) : reactPath;
        return context.resolveRequest(context, target, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
