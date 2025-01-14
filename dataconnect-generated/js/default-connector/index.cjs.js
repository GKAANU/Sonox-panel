const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'sonox-panel',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

