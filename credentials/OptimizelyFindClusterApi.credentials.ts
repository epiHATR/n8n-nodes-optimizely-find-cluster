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
    test = {
        request: {
            baseURL: '={{$credentials.authUrl}}',
            url: '',
        },
    };
}
