import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class OptimizelyFindCluster implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Optimizely Nodes',
		name: 'optimizelyFindCluster',
		icon: { light: 'file:example.svg', dark: 'file:example.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{ $parameter["operation"] }}',
		description: 'Interact with Optimizely Find Cluster',
		defaults: {
			name: 'Optimizely Nodes',
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
				description: 'The ID of the Azure Subscription',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get Find Clusters',
						value: 'getFindClusters',
					},
					{
						name: 'Get FIND Cluster Status',
						value: 'getFindClusterStatus',
					},
				],
				default: 'getFindClusters',
			},
			{
				displayName: 'Name Filter (Prefix)',
				name: 'nameFilter',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['getFindClusters'],
					},
				},
				description: 'Only return resource groups whose names start with this string',
			},
			{
				displayName: 'Cluster Name (Resource Group)',
				name: 'resourceGroupName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getFindClusterStatus'],
					},
				},
			},
			{
				displayName: 'Master Node VM Name',
				name: 'vmName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getFindClusterStatus'],
					},
				},
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const subscriptionId = this.getNodeParameter('subscriptionId', itemIndex) as string;
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

				if (operation === 'getFindClusters') {
					// 2. Get Resource Groups
					const apiVersion = '2021-04-01';
					const options: IHttpRequestOptions = {
						method: 'GET',
						url: `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups`,
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
						qs: {
							'api-version': apiVersion,
						},
						json: true,
					};

					const response = await this.helpers.httpRequest(options);
					let resourceGroups = response.value || [];

					const nameFilter = this.getNodeParameter('nameFilter', itemIndex, '') as string;
					if (nameFilter) {
						resourceGroups = resourceGroups.filter((rg: { name: string }) =>
							rg.name && rg.name.toLowerCase().startsWith(nameFilter.toLowerCase())
						);
					}

					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(resourceGroups),
						{ itemData: { item: items[itemIndex].index ?? 0 } }
					);

					returnData.push(...executionData);
				} else if (operation === 'getFindClusterStatus') {
					const resourceGroupName = this.getNodeParameter('resourceGroupName', itemIndex) as string;
					const vmName = this.getNodeParameter('vmName', itemIndex) as string;

					// 2. Execute Run Command
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
				}
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
