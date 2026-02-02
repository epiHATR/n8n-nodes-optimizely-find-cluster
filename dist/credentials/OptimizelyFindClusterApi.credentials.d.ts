import { ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class OptimizelyFindClusterApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: string;
    properties: INodeProperties[];
    test: {
        request: {
            baseURL: string;
            url: string;
        };
    };
}
