import { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';
export declare class OptimizelyFindClusterApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: string;
    properties: INodeProperties[];
    test: ICredentialTestRequest;
}
