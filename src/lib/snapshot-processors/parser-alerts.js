/*** UNDER NO CIRCUMSTANCES DO NOT EDIT THIS FILE. THIS FILE IS COPIED                                    ***/
/*** FROM OSS UI. ANY CHANGES TO BE MADE IN KUBEVIOUS OSS UI.                                             ***/
/*** SOURCE: ../kubevious/src/lib/snapshot-processors/parser-alerts.js                                    ***/

module.exports = {
    order: 10,

    handler: ({logger, state}) => {

        for(var dn of state.getNodeDns())
        {
            processNode(dn);
        }

        /************/

        function processNode(dn)
        {
            var assets = state.getAssets(dn);
            for(var alert of assets.alerts)
            {
                alert.source = {
                    kind: 'parser'
                };
            }
        }
    }
}