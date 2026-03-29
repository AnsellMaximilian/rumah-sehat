export type SearchParamValue = string | string[] | undefined;

export type BaseListSearchParams = {
  page?: SearchParamValue;
  limit?: SearchParamValue;
  query?: SearchParamValue;
  sortBy?: SearchParamValue;
  sortOrder?: SearchParamValue;
};

export type ListSearchParams<T extends object> = BaseListSearchParams & T;
