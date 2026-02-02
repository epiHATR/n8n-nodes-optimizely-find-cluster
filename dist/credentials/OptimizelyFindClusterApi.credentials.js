"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizelyFindClusterApi = void 0;
class OptimizelyFindClusterApi {
    constructor() {
        this.name = 'optimizelyFindClusterApi';
        this.displayName = 'Optimizely Find Cluster API';
        this.documentationUrl = 'https://docs.optimizely.com';
        this.icon = 'file:example.svg';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
            },
            {
                displayName: 'API URL',
                name: 'apiUrl',
                type: 'string',
                default: 'https://api.optimizely.com',
            },
        ];
        this.test = {
            request: {
                baseURL: '={{$credentials.apiUrl}}',
                url: '/',
            },
        };
    }
}
exports.OptimizelyFindClusterApi = OptimizelyFindClusterApi;
//# sourceMappingURL=OptimizelyFindClusterApi.credentials.js.map