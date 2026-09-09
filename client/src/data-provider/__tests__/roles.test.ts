import { renderHook, act } from '@testing-library/react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useUpdateAgentPermissionsMutation } from '../roles';
import { QueryKeys, dataService, agentPermissionsSchema } from 'aladin-data-provider';

// Mock dependencies
jest.mock('@tanstack/react-query');

jest.mock('aladin-data-provider', () => ({
  QueryKeys: {
    roles: 'roles'
  },
  dataService: {
    updateAgentPermissions: jest.fn(),
  },
  agentPermissionsSchema: {
    partial: jest.fn().mockReturnThis(),
    parse: jest.fn(),
  },
}));

const mockQueryClient = {
  invalidateQueries: jest.fn(),
};

const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;

describe('useUpdateAgentPermissionsMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue(mockQueryClient as any);
  });

  it('should call useMutation with the correct mutationFn and options', () => {
    // Setup mock for useMutation to just return what we expect
    const mockMutate = jest.fn();
    mockUseMutation.mockReturnValue({ mutate: mockMutate } as any);

    renderHook(() => useUpdateAgentPermissionsMutation());

    expect(mockUseMutation).toHaveBeenCalled();

    // Check mutationFn
    const mutationFn = mockUseMutation.mock.calls[0][0];
    expect(typeof mutationFn).toBe('function');

    const variables = {
      roleName: 'ADMIN',
      updates: { USE: true },
    };

    // Check if schema parse and dataService call are inside the mutationFn
    (mutationFn as Function)(variables);

    expect(agentPermissionsSchema.partial().parse).toHaveBeenCalledWith(variables.updates);
    expect(dataService.updateAgentPermissions).toHaveBeenCalledWith(variables);
  });

  it('should call invalidateQueries and onSuccess in the onSuccess callback', () => {
    mockUseMutation.mockReturnValue({} as any);
    const onSuccessMock = jest.fn();

    renderHook(() => useUpdateAgentPermissionsMutation({ onSuccess: onSuccessMock }));

    const options = mockUseMutation.mock.calls[0][1];
    expect(options).toBeDefined();

    const onSuccessFn = (options as any).onSuccess;
    expect(typeof onSuccessFn).toBe('function');

    const data = { name: 'ADMIN', permissions: {} };
    const variables = { roleName: 'ADMIN', updates: { USE: true } };
    const context = { foo: 'bar' };

    onSuccessFn(data, variables, context);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith([QueryKeys.roles, variables.roleName]);
    expect(onSuccessMock).toHaveBeenCalledWith(data, variables, context);
  });

  it('should call console.error and onError in the onError callback', () => {
    mockUseMutation.mockReturnValue({} as any);
    const onErrorMock = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderHook(() => useUpdateAgentPermissionsMutation({ onError: onErrorMock }));

    const options = mockUseMutation.mock.calls[0][1];
    expect(options).toBeDefined();

    const onErrorFn = (options as any).onError;
    expect(typeof onErrorFn).toBe('function');

    const error = new Error('Test error');
    const variables = { roleName: 'ADMIN', updates: { USE: true } };
    const context = { foo: 'bar' };

    onErrorFn(error, variables, context);

    expect(consoleSpy).toHaveBeenCalledWith('Failed to update agent permissions:', error);
    expect(onErrorMock).toHaveBeenCalledWith(error, variables, context);

    consoleSpy.mockRestore();
  });
});
