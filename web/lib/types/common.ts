export interface Pagination {
  page: number;
  pagingCount: number;
  searchQuery?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}
