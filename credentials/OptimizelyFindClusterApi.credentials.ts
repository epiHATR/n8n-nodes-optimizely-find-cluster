import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class OptimizelyFindClusterApi implements ICredentialType {
    name = 'optimizelyFindClusterApi';
    displayName = 'Optimizely Find Cluster API';
    documentationUrl = 'https://docs.optimizely.com';
    // @ts-expect-error Icon type mismatch in community nodes
    icon = 'file:example.svg';
    properties: INodeProperties[] = [
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
    test = {
        request: {
            baseURL: '={{$credentials.apiUrl}}',
            url: '/',
        },
    };
}
