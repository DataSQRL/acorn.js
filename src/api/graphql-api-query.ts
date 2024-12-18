import { APIQuery } from "./api-query";

export class GraphQLQuery implements APIQuery {
  constructor(public queryString: string) {}
}
