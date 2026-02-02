import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
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
				displayName: 'Azure Management Endpoint',
				name: 'managementEndpoint',
				type: 'string',
				default: 'https://management.azure.com',
				required: true,
				description: 'The Azure Management API endpoint',
			},
			{
				displayName: 'Azure API Version',
				name: 'apiVersion',
				type: 'string',
				default: '2018-04-01',
				required: true,
				description: 'The API version to use for Azure requests',
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
					{
						name: 'Get Find Cluster Master Nodes',
						value: 'getFindClusterMasterNodes',
					},
					{
						name: 'Run Azure Virtual Machine Command',
						value: 'runAzureVmCommand',
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
						operation: ['getFindClusterStatus', 'getFindClusterMasterNodes', 'runAzureVmCommand'],
					},
				},
			},
			{
				displayName: 'Master Node Name or ID',
				name: 'vmName',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getVirtualMachines',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getFindClusterStatus', 'runAzureVmCommand'],
					},
				},
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Command ID',
				name: 'commandId',
				type: 'string',
				default: 'RunShellScript',
				required: true,
				displayOptions: {
					show: {
						operation: ['runAzureVmCommand'],
					},
				},
				description: 'The Azure Run Command ID (e.g., RunShellScript, RunPowerShellScript)',
			},
			{
				displayName: 'Script',
				name: 'script',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['runAzureVmCommand'],
					},
				},
				description: 'The script to run on the virtual machine. Multiple lines can be used.',
			},
		],
	};

	methods = {
		loadOptions: {
			async getVirtualMachines(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const subscriptionId = this.getCurrentNodeParameter('subscriptionId') as string;
				const resourceGroupName = this.getCurrentNodeParameter('resourceGroupName') as string;
				const managementEndpoint = (this.getCurrentNodeParameter('managementEndpoint') as string).replace(/\/$/, '');
				const apiVersion = this.getCurrentNodeParameter('apiVersion') as string;

				if (!subscriptionId || !resourceGroupName) {
					return [];
				}

				try {
					const credentials = await this.getCredentials('optimizelyFindClusterApi');

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
							resource: 'https://management.azure.com/',
						},
						json: true,
					};

					const tokenResponse = await this.helpers.httpRequest(tokenOptions);
					const accessToken = tokenResponse.access_token;

					// 2. Get Virtual Machines
					const options: IHttpRequestOptions = {
						method: 'GET',
						url: `${managementEndpoint}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines`,
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
						qs: {
							'api-version': apiVersion,
						},
						json: true,
					};

					const response = await this.helpers.httpRequest(options);
					const vms = response.value || [];

					return vms.map((item: { name: string }) => ({
						name: item.name,
						value: item.name,
					}));
				} catch (error) {
					throw new NodeOperationError(this.getNode(), error as Error);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const subscriptionId = this.getNodeParameter('subscriptionId', itemIndex) as string;
				const managementEndpoint = (this.getNodeParameter('managementEndpoint', itemIndex) as string).replace(/\/$/, '');
				const apiVersion = this.getNodeParameter('apiVersion', itemIndex) as string;
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
						resource: 'https://management.azure.com/',
					},
					json: true,
				};

				const tokenResponse = await this.helpers.httpRequest(tokenOptions);
				const accessToken = tokenResponse.access_token;

				if (operation === 'getFindClusters') {
					// 2. Get Resource Groups
					const options: IHttpRequestOptions = {
						method: 'GET',
						url: `${managementEndpoint}/subscriptions/${subscriptionId}/resourcegroups`,
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

					resourceGroups = resourceGroups.map((rg: Record<string, unknown>) => ({
						...rg,
						subscriptionId,
						clusterName: rg.name as string,
					}));

					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(resourceGroups),
						{ itemData: { item: items[itemIndex].index ?? 0 } }
					);

					returnData.push(...executionData);
				} else if (operation === 'getFindClusterStatus') {
					const resourceGroupName = this.getNodeParameter('resourceGroupName', itemIndex) as string;
					const vmName = this.getNodeParameter('vmName', itemIndex) as string;

					// 2. Execute Run Command (Targeting the Virtual Machine)
					const options: IHttpRequestOptions = {
						method: 'POST',
						url: `${managementEndpoint}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}/runCommand`,
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
						qs: {
							'api-version': apiVersion,
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
				} else if (operation === 'getFindClusterMasterNodes') {
					const resourceGroupName = this.getNodeParameter('resourceGroupName', itemIndex) as string;

					// 2. Get Virtual Machines
					const options: IHttpRequestOptions = {
						method: 'GET',
						url: `${managementEndpoint}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines`,
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
						qs: {
							'api-version': apiVersion,
						},
						json: true,
					};

					const response = await this.helpers.httpRequest(options);
					let vms = response.value || [];

					// Filter VMs containing "-master"
					vms = vms.filter((vm: { name: string }) =>
						vm.name && vm.name.toLowerCase().includes('-master')
					);

					vms = vms.map((vm: Record<string, unknown>) => ({
						...vm,
						subscriptionId,
						clusterName: resourceGroupName,
					}));

					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(vms),
						{ itemData: { item: items[itemIndex].index ?? 0 } }
					);

					returnData.push(...executionData);
				} else if (operation === 'runAzureVmCommand') {
					const resourceGroupName = this.getNodeParameter('resourceGroupName', itemIndex) as string;
					const vmName = this.getNodeParameter('vmName', itemIndex) as string;
					const commandId = this.getNodeParameter('commandId', itemIndex) as string;
					const script = this.getNodeParameter('script', itemIndex) as string;

					// 2. Execute Run Command
					const options: IHttpRequestOptions = {
						method: 'POST',
						url: `${managementEndpoint}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}/runCommand`,
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
						qs: {
							'api-version': apiVersion,
						},
						body: {
							commandId,
							script: script.split('\n'),
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
