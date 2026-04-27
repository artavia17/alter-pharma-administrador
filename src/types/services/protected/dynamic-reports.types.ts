export interface SchemaColumn {
  label: string;
  type: "integer" | "string" | "date" | "datetime" | "boolean";
}

export interface SchemaEntity {
  label: string;
  columns: Record<string, SchemaColumn>;
  joinable_to: string[];
}

export type SchemaData = Record<string, SchemaEntity>;

export interface ReportField {
  entity: string;
  field: string;
  aggregate?: string;
  alias?: string;
}

export type FilterOperator =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "like"
  | "not like"
  | "in"
  | "not in"
  | "between"
  | "is null"
  | "is not null";

export interface ReportFilter {
  entity: string;
  field: string;
  operator: FilterOperator;
  value?: string | string[];
}

export interface ReportGroupBy {
  entity: string;
  field: string;
}

export interface ReportOrderBy {
  entity: string;
  field: string;
  aggregate?: string;
  direction: "asc" | "desc";
}

export interface ReportQueryParams {
  base_entity: string;
  fields: ReportField[];
  filters?: ReportFilter[];
  group_by?: ReportGroupBy[];
  order_by?: ReportOrderBy[];
  per_page?: number;
  page?: number;
}

export interface ReportMeta {
  total: number;
  per_page: number;
  page: number;
  last_page: number;
}

export interface ReportQueryResponse {
  status: number;
  message: string;
  data: {
    data: Record<string, any>[];
    meta: ReportMeta;
  };
}
