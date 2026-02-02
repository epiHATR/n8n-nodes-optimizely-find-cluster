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
				],
				default: 'getFindClusters',
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
				if (operation === 'getFindClusters') {
					const subscriptionId = this.getNodeParameter('subscriptionId', itemIndex) as string;
					const apiVersion = '2021-04-01'; // Common stable version for Resource Groups

					const options = {
						method: 'GET',
						url: `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups`,
						qs: {
							'api-version': apiVersion,
						},
						json: true,
					} as unknown as IHttpRequestOptions;

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'optimizelyFindClusterApi',
						options,
					);

					const resourceGroups = response.value || [];

					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(resourceGroups),
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
