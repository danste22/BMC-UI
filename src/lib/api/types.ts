export interface APIResponse<T> {
  response: {
    result: T;
  }[];
}
