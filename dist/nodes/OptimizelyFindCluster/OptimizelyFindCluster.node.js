"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizelyFindCluster = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class OptimizelyFindCluster {
    constructor() {
        this.description = {
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
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
        this.methods = {
            loadOptions: {
                async getVirtualMachines() {
                    const extractName = (idOrName) => idOrName.startsWith('/') ? idOrName.split('/').pop() || idOrName : idOrName;
                    const subscriptionId = extractName(this.getCurrentNodeParameter('subscriptionId'));
                    const resourceGroupName = extractName(this.getCurrentNodeParameter('resourceGroupName'));
                    const managementEndpoint = this.getCurrentNodeParameter('managementEndpoint').replace(/\/$/, '');
                    const apiVersion = this.getCurrentNodeParameter('apiVersion');
                    if (!subscriptionId || !resourceGroupName) {
                        return [];
                    }
                    try {
                        const credentials = await this.getCredentials('optimizelyFindClusterApi');
                        const tokenOptions = {
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
                        const options = {
                            method: 'GET',
                            url: `${managementEndpoint}/subscriptions/${encodeURIComponent(subscriptionId)}/resourceGroups/${encodeURIComponent(resourceGroupName)}/providers/Microsoft.Compute/virtualMachines`,
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                            },
                            qs: {
                                'api-version': apiVersion,
                            },
                            json: true,
                        };
                        const response = await this.helpers.httpRequest(options);
                        const vms = response.value || [];
                        return vms.map((item) => ({
                            name: item.name,
                            value: item.name,
                        }));
                    }
                    catch (error) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), error);
                    }
                },
            },
        };
    }
    async execute() {
        var _a, _b, _c, _d;
        const items = this.getInputData();
        const returnData = [];
        const operation = this.getNodeParameter('operation', 0);
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const extractName = (idOrName) => idOrName.startsWith('/') ? idOrName.split('/').pop() || idOrName : idOrName;
                const subscriptionId = extractName(this.getNodeParameter('subscriptionId', itemIndex));
                const managementEndpoint = this.getNodeParameter('managementEndpoint', itemIndex).replace(/\/$/, '');
                const apiVersion = this.getNodeParameter('apiVersion', itemIndex);
                const credentials = await this.getCredentials('optimizelyFindClusterApi', itemIndex);
                const tokenOptions = {
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
                    const options = {
                        method: 'GET',
                        url: `${managementEndpoint}/subscriptions/${encodeURIComponent(subscriptionId)}/resourcegroups`,
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        qs: {
                            'api-version': apiVersion,
                        },
                        json: true,
                    };
                    const response = await this.helpers.httpRequest(options);
                    let resourceGroups = response.value || [];
                    const nameFilter = this.getNodeParameter('nameFilter', itemIndex, '');
                    if (nameFilter) {
                        resourceGroups = resourceGroups.filter((rg) => rg.name && rg.name.toLowerCase().startsWith(nameFilter.toLowerCase()));
                    }
                    resourceGroups = resourceGroups.map((rg) => ({
                        ...rg,
                        subscriptionId,
                        clusterName: rg.name,
                    }));
                    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(resourceGroups), { itemData: { item: (_a = items[itemIndex].index) !== null && _a !== void 0 ? _a : 0 } });
                    returnData.push(...executionData);
                }
                else if (operation === 'getFindClusterStatus') {
                    const resourceGroupName = extractName(this.getNodeParameter('resourceGroupName', itemIndex));
                    const vmName = extractName(this.getNodeParameter('vmName', itemIndex));
                    const options = {
                        method: 'POST',
                        url: `${managementEndpoint}/subscriptions/${encodeURIComponent(subscriptionId)}/resourceGroups/${encodeURIComponent(resourceGroupName)}/providers/Microsoft.Compute/virtualMachines/${encodeURIComponent(vmName)}/runCommand`,
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        qs: {
                            'api-version': apiVersion,
                        },
                        body: {
                            commandId: 'RunShellScript',
                            script: [
                                'curl -s localhost:9200/_cluster/health',
                            ],
                            parameters: [],
                        },
                        json: true,
                    };
                    const response = await this.helpers.httpRequest(options);
                    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(response), { itemData: { item: (_b = items[itemIndex].index) !== null && _b !== void 0 ? _b : 0 } });
                    returnData.push(...executionData);
                }
                else if (operation === 'getFindClusterMasterNodes') {
                    const resourceGroupName = extractName(this.getNodeParameter('resourceGroupName', itemIndex));
                    const options = {
                        method: 'GET',
                        url: `${managementEndpoint}/subscriptions/${encodeURIComponent(subscriptionId)}/resourceGroups/${encodeURIComponent(resourceGroupName)}/providers/Microsoft.Compute/virtualMachines`,
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        qs: {
                            'api-version': apiVersion,
                        },
                        json: true,
                    };
                    const response = await this.helpers.httpRequest(options);
                    let vms = response.value || [];
                    vms = vms.filter((vm) => vm.name && vm.name.toLowerCase().includes('-master'));
                    vms = vms.map((vm) => ({
                        ...vm,
                        subscriptionId,
                        clusterName: resourceGroupName,
                    }));
                    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(vms), { itemData: { item: (_c = items[itemIndex].index) !== null && _c !== void 0 ? _c : 0 } });
                    returnData.push(...executionData);
                }
                else if (operation === 'runAzureVmCommand') {
                    const resourceGroupName = extractName(this.getNodeParameter('resourceGroupName', itemIndex));
                    const vmName = extractName(this.getNodeParameter('vmName', itemIndex));
                    const commandId = this.getNodeParameter('commandId', itemIndex);
                    const script = this.getNodeParameter('script', itemIndex);
                    const options = {
                        method: 'POST',
                        url: `${managementEndpoint}/subscriptions/${encodeURIComponent(subscriptionId)}/resourceGroups/${encodeURIComponent(resourceGroupName)}/providers/Microsoft.Compute/virtualMachines/${encodeURIComponent(vmName)}/runCommand`,
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        qs: {
                            'api-version': apiVersion,
                        },
                        body: {
                            commandId,
                            script: script.split('\n').map(l => l.trim()).filter(l => l.length > 0),
                            parameters: [],
                        },
                        json: true,
                    };
                    const response = await this.helpers.httpRequest(options);
                    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(response), { itemData: { item: (_d = items[itemIndex].index) !== null && _d !== void 0 ? _d : 0 } });
                    returnData.push(...executionData);
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
                }
                else {
                    if (error.context) {
                        error.context.itemIndex = itemIndex;
                        throw error;
                    }
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                        itemIndex,
                    });
                }
            }
        }
        return [returnData];
    }
}
exports.OptimizelyFindCluster = OptimizelyFindCluster;
//# sourceMappingURL=OptimizelyFindCluster.node.js.map