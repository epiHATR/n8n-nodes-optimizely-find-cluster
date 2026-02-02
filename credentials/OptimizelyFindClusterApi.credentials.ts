import {
    ICredentialType,
    INodeProperties,
    ICredentialTestRequest,
} from 'n8n-workflow';

export class OptimizelyFindClusterApi implements ICredentialType {
    name = 'optimizelyFindClusterApi';
    displayName = 'Optimizely Find Cluster API';
    documentationUrl = 'https://docs.optimizely.com';
    // @ts-expect-error Icon type mismatch in community nodes
    icon = 'file:example.svg';
    properties: INodeProperties[] = [
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
    test: ICredentialTestRequest = {
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
