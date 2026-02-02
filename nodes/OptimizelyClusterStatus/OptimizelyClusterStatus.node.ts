import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class OptimizelyClusterStatus implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Get Find Cluster Status',
        name: 'optimizelyClusterStatus',
        icon: { light: 'file:example.svg', dark: 'file:example.dark.svg' },
        group: ['input'],
        version: 1,
        description: 'Execute Azure Run Command to check cluster status',
        defaults: {
            name: 'Get Find Cluster Status',
        },
        inputs: [NodeConnectionTypes.Main],
        outputs: [NodeConnectionTypes.Main],
        credentials: [
            {
                name: 'optimizelyFindClusterApi',
                required: true,
            },
        ],
        usableAsTool: true,
        properties: [
            {
                displayName: 'Subscription ID',
                name: 'subscriptionId',
                type: 'string',
                default: '',
                required: true,
            },
            {
                displayName: 'Cluster Name (Resource Group)',
                name: 'resourceGroupName',
                type: 'string',
                default: '',
                required: true,
            },
            {
                displayName: 'Master Node VM Name',
                name: 'vmName',
                type: 'string',
                default: '',
                required: true,
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const subscriptionId = this.getNodeParameter('subscriptionId', itemIndex) as string;
                const resourceGroupName = this.getNodeParameter('resourceGroupName', itemIndex) as string;
                const vmName = this.getNodeParameter('vmName', itemIndex) as string;

                const credentials = await this.getCredentials('optimizelyFindClusterApi', itemIndex);

                // 1. Get Access Token
                const tokenOptions: IHttpRequestOptions = {
                    method: 'POST',
                    url: `${credentials.authUrl}${credentials.tenantId}/oauth2/token`,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: {
                        grant_type: 'client_credentials',
                        client_id: credentials.applicationId,
                        client_secret: credentials.applicationSecret,
                        resource: 'https://management.core.windows.net/',
                    },
                    json: true,
                };

                const tokenResponse = await this.helpers.httpRequest(tokenOptions);
                const accessToken = tokenResponse.access_token;

                // 2. Execute Run Command (checking Elasticsearch health as a default status check)
                const apiVersion = '2021-07-01';
                const options: IHttpRequestOptions = {
                    method: 'POST',
                    url: `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}/runCommand?api-version=${apiVersion}`,
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: {
                        commandId: 'RunShellScript',
                        script: [
                            'curl -s localhost:9200/_cluster/health',
                        ],
                    },
                    json: true,
                };

                const response = await this.helpers.httpRequest(options);

                const executionData = this.helpers.constructExecutionMetaData(
                    this.helpers.returnJsonArray(response),
                    { itemData: { item: items[itemIndex].index ?? 0 } }
                );

                returnData.push(...executionData);

            } catch (error) {
                if (this.continueOnFail()) {
                    items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
                } else {
                    if (error.context) {
                        error.context.itemIndex = itemIndex;
                        throw error;
                    }
                    throw new NodeOperationError(this.getNode(), error, {
                        itemIndex,
                    });
                }
            }
        }

        return [returnData];
    }
}
