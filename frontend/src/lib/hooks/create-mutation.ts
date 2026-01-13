'use client';

import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Options for creating a mutation hook
 */
interface CreateMutationOptions<TData, TVariables> {
  /** The mutation function to execute */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Static query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
  /** Function to get additional query keys to invalidate based on variables */
  getInvalidateKeys?: (variables: TVariables) => QueryKey[];
  /** Optional success callback */
  onSuccess?: (data: TData, variables: TVariables) => void;
}

/**
 * Factory function to create mutation hooks with automatic query invalidation
 *
 * Reduces boilerplate for CRUD mutations by handling:
 * - QueryClient acquisition
 * - Query invalidation on success
 * - Optional success callbacks
 *
 * @example
 * // Simple mutation with static invalidation
 * export const useCreateTask = createMutation({
 *   mutationFn: (data: CreateTaskRequest) => tasksApi.createTask(data),
 *   invalidateKeys: [['tasks']],
 * });
 *
 * @example
 * // Mutation with dynamic invalidation based on variables
 * export const useUpdateTask = createMutation({
 *   mutationFn: ({ id, data }) => tasksApi.updateTask(id, data),
 *   invalidateKeys: [['tasks']],
 *   getInvalidateKeys: (variables) => [['task', variables.id]],
 * });
 */
export function createMutation<TData, TVariables>({
  mutationFn,
  invalidateKeys = [],
  getInvalidateKeys,
  onSuccess,
}: CreateMutationOptions<TData, TVariables>) {
  return function useMutationHook() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn,
      onSuccess: (data, variables) => {
        // Invalidate static keys
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });

        // Invalidate dynamic keys based on variables
        if (getInvalidateKeys) {
          const dynamicKeys = getInvalidateKeys(variables);
          dynamicKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }

        // Call custom success handler
        onSuccess?.(data, variables);
      },
    });
  };
}
