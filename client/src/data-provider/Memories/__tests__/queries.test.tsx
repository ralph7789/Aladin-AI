import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteMemoryMutation } from '../queries';

const mockDeleteMemory = jest.fn();

jest.mock(
  'aladin-data-provider',
  () => ({
    dataService: {
      deleteMemory: (...args: any[]) => mockDeleteMemory(...args),
    },
    QueryKeys: {
      memories: 'memories',
    },
    MutationKeys: {
      updateMemoryPreferences: 'updateMemoryPreferences',
    },
  }),
  { virtual: true },
);

describe('useDeleteMemoryMutation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should call dataService.deleteMemory with correct memoryId', async () => {
    mockDeleteMemory.mockResolvedValueOnce({});

    const { result } = renderHook(() => useDeleteMemoryMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('test-memory-id');
    });

    expect(mockDeleteMemory).toHaveBeenCalledWith('test-memory-id');
  });

  it('should invalidate memories query on success', async () => {
    mockDeleteMemory.mockResolvedValueOnce({});

    // Spy on invalidateQueries
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteMemoryMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('test-memory-id');
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith(['memories']);
  });

  it('should handle API errors correctly', async () => {
    const error = new Error('Failed to delete memory');
    mockDeleteMemory.mockRejectedValueOnce(error);

    // Spy on invalidateQueries
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteMemoryMutation(), { wrapper });

    let caughtError;
    try {
      await act(async () => {
        await result.current.mutateAsync('test-memory-id');
      });
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toEqual(error);
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });
});
