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
                displayName: 'Tenant ID',
                name: 'tenantId',
                type: 'string',
                default: '',
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
                url: '={{$credentials.tenantId}}/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: {
                    grant_type: 'client_credentials',
                    client_id: '={{$credentials.applicationId}}',
                    client_secret: '={{$credentials.applicationSecret}}',
                    resource: 'https://management.core.windows.net/',
                },
            },
        };
    }
}
exports.OptimizelyFindClusterApi = OptimizelyFindClusterApi;
//# sourceMappingURL=OptimizelyFindClusterApi.credentials.js.map