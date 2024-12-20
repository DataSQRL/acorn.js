import { GraphQLObjectType } from "graphql";
import { combineArgNameStrings } from "../../utils";

export class VisitContext {
  constructor(
    public schemaDefinition: string,
    public operationName: string,
    public prefix: string,
    public numArgs: number,
    public path: GraphQLObjectType[],
  ) {}

  public nested(
    schemaDefinition: string,
    fieldName: string,
    type: GraphQLObjectType,
    additionalArgs: number,
  ) {
    return new VisitContext(
      schemaDefinition,
      this.operationName + "." + fieldName,
      combineArgNameStrings(this.prefix, fieldName),
      this.numArgs + additionalArgs,
      [...this.path, type],
    );
  }
}
