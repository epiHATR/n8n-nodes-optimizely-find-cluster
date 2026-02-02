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
    }
    async execute() {
        var _a;
        const items = this.getInputData();
        const returnData = [];
        const operation = this.getNodeParameter('operation', 0);
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                if (operation === 'getFindClusters') {
                    const subscriptionId = this.getNodeParameter('subscriptionId', itemIndex);
                    const apiVersion = '2021-04-01';
                    const options = {
                        method: 'GET',
                        url: `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups`,
                        qs: {
                            'api-version': apiVersion,
                        },
                        json: true,
                    };
                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'optimizelyFindClusterApi', options);
                    const resourceGroups = response.value || [];
                    const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(resourceGroups), { itemData: { item: (_a = items[itemIndex].index) !== null && _a !== void 0 ? _a : 0 } });
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