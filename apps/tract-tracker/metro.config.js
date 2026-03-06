const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro can resolve hoisted packages
config.watchFolders = [monorepoRoot];

// Resolve modules from both the app folder and monorepo root node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
];

// Replace native-only modules with web stubs when bundling for web
const webStubs = {
    'react-native-maps': path.resolve(projectRoot, 'src/mocks/react-native-maps.web.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && webStubs[moduleName]) {
        return { filePath: webStubs[moduleName], type: 'sourceFile' };
    }
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

