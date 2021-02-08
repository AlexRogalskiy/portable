/*** UNDER NO CIRCUMSTANCES DO NOT EDIT THIS FILE. THIS FILE IS COPIED                                    ***/
/*** FROM OSS UI. ANY CHANGES TO BE MADE IN KUBEVIOUS OSS UI.                                             ***/
/*** SOURCE: ../parser.git/src/logic/parser-builder.ts                                                    ***/


import { ConcreteParserBuilder } from './processor/concrete/builder';
import { LogicParserBuilder } from './processor/logic/builder';
import { ScopeParserBuilder } from './processor/scope/builder';

export function ConcreteParser() : ConcreteParserBuilder
{
    return new ConcreteParserBuilder();
}

export function LogicParser() : LogicParserBuilder
{
    return new LogicParserBuilder();
}

export function ScopeParser() : ScopeParserBuilder
{
    return new ScopeParserBuilder();
}