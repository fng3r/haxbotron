/**
 * Base repository interface
 */
export interface IRepository<T> {
  create(data: T): Promise<void>;
  read(id: string): Promise<T | null>;
  update(data: T): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Result type for operations that might fail
 */
export type RepositoryResult<T> = 
  | { success: true; data: T }
  | { success: false; error: Error };

/**
 * Helper to create success result
 */
export function success<T>(data: T): RepositoryResult<T> {
  return { success: true, data };
}

/**
 * Helper to create error result
 */
export function failure<T>(error: Error): RepositoryResult<T> {
  return { success: false, error };
}
