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
                displayName: 'Microsoft Authentication URL',
                name: 'authUrl',
                type: 'string',
                default: 'https://login.microsoftonline.com/',
            },
            {
                displayName: 'Application ID',
                name: 'applicationId',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Application Secret',
                name: 'applicationSecret',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
            },
            {
                displayName: 'Subscription ID',
                name: 'subscriptionId',
                type: 'string',
                default: '',
            },
        ];
        this.test = {
            request: {
                baseURL: '={{$credentials.authUrl}}',
                url: '',
            },
        };
    }
}
exports.OptimizelyFindClusterApi = OptimizelyFindClusterApi;
//# sourceMappingURL=OptimizelyFindClusterApi.credentials.js.map