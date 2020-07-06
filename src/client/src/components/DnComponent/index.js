/*** UNDER NO CIRCUMSTANCES DO NOT EDIT THIS FILE. THIS FILE IS COPIED                                    ***/
/*** FROM OSS UI. ANY CHANGES TO BE MADE IN KUBEVIOUS OSS UI.                                             ***/
/*** SOURCE: ../ui/src/src/components/DnComponent/index.js                                                ***/

import React, { Fragment } from 'react'
import _ from 'the-lodash'
import { parseDn } from '../../utils/naming-utils'
import { getNodeLogoUrl, prettyKind } from '../../utils/ui-utils'

import './styles.scss'

const DnComponent = ({ dn, options }) => {
    options = options || {};

    let dnParts = parseDn(dn)
    const lastPart = _.last(dnParts);

    if (options.relativeTo)
    {
        var parentDnParts = parseDn(options.relativeTo);
        while((dnParts.length > 0) && 
              (parentDnParts.length > 0) && 
              (dnParts[0].rn === parentDnParts[0].rn))
        {
            dnParts.shift();
            parentDnParts.shift();
        }
    }

    if (dnParts.length > 0) {
        if (dnParts[0].kind === 'root') {
            dnParts = dnParts.splice(1);
        }
    }

    return (
        <div className="dn-path">
            <img className="dn-logo" src={getNodeLogoUrl(lastPart.kind)} alt="logo" />
            {dnParts.map((item, index) => (
                <Fragment key={index}>
                    <span className="kind">{prettyKind(item.kind)}</span>
                    <span className="name">{item.name}</span>
                    {index !== dnParts.length - 1 && <span className="separator">&gt;</span>}
                    {index === dnParts.length - 1 && <div className="clearfix"/>}
                </Fragment>
            ))}
        </div>
    )
}

export default DnComponent
