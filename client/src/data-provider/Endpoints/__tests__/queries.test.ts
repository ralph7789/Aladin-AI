import { renderHook } from '@testing-library/react';
import { useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'aladin-data-provider';
import store from '~/store';
import { useGetEndpointsQuery, useGetStartupConfig } from '../queries';

// Mock Recoil
jest.mock('recoil', () => {
  const actualRecoil = jest.requireActual('recoil');
  return {
    ...actualRecoil,
    useRecoilValue: jest.fn(),
  };
});

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

// Mock Data Provider
jest.mock('aladin-data-provider', () => ({
  ...jest.requireActual('aladin-data-provider'),
  QueryKeys: {
    endpoints: 'endpoints',
    startupConfig: 'startupConfig',
  },
  dataService: {
    getAIEndpoints: jest.fn(),
    getStartupConfig: jest.fn(),
  },
}));

// Mock Store
jest.mock('~/store', () => ({
  __esModule: true,
  default: {
    queriesEnabled: { key: 'queriesEnabled' },
  },
}));

describe('Endpoints queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({ data: 'mockData' });
  });

  describe('useGetEndpointsQuery', () => {
    it('should call useQuery with correct basic arguments and defaults', () => {
      (useRecoilValue as jest.Mock).mockReturnValue(true);

      renderHook(() => useGetEndpointsQuery());

      expect(useRecoilValue).toHaveBeenCalledWith(store.queriesEnabled);
      expect(useQuery).toHaveBeenCalledWith(
        [QueryKeys.endpoints],
        expect.any(Function),
        {
          staleTime: Infinity,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: false,
          enabled: true,
        }
      );
    });

    it('should call dataService.getAIEndpoints in query function', () => {
      (useRecoilValue as jest.Mock).mockReturnValue(true);

      renderHook(() => useGetEndpointsQuery());

      const queryFn = (useQuery as jest.Mock).mock.calls[0][1];
      queryFn();

      expect(dataService.getAIEndpoints).toHaveBeenCalled();
    });

    it('should pass provided config to useQuery and override defaults where applicable', () => {
      (useRecoilValue as jest.Mock).mockReturnValue(true);

      const customConfig = { staleTime: 1000, retry: 2 };
      renderHook(() => useGetEndpointsQuery(customConfig as any));

      expect(useQuery).toHaveBeenCalledWith(
        [QueryKeys.endpoints],
        expect.any(Function),
        expect.objectContaining({
          staleTime: 1000,
          retry: 2,
          refetchOnWindowFocus: false,
        })
      );
    });

    describe('enabled logic', () => {
      it('should be enabled when queriesEnabled is true and config.enabled is undefined', () => {
        (useRecoilValue as jest.Mock).mockReturnValue(true);
        renderHook(() => useGetEndpointsQuery());

        expect(useQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ enabled: true })
        );
      });

      it('should be disabled when config.enabled is false even if queriesEnabled is true', () => {
        (useRecoilValue as jest.Mock).mockReturnValue(true);
        renderHook(() => useGetEndpointsQuery({ enabled: false }));

        expect(useQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ enabled: false })
        );
      });

      it('should be disabled when queriesEnabled is false even if config.enabled is true', () => {
        (useRecoilValue as jest.Mock).mockReturnValue(false);
        renderHook(() => useGetEndpointsQuery({ enabled: true }));

        expect(useQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ enabled: false })
        );
      });

      it('should be disabled when both are false', () => {
        (useRecoilValue as jest.Mock).mockReturnValue(false);
        renderHook(() => useGetEndpointsQuery({ enabled: false }));

        expect(useQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ enabled: false })
        );
      });
    });
  });

  describe('useGetStartupConfig', () => {
    it('should call useQuery with correct basic arguments and defaults', () => {
      (useRecoilValue as jest.Mock).mockReturnValue(true);

      renderHook(() => useGetStartupConfig());

      expect(useRecoilValue).toHaveBeenCalledWith(store.queriesEnabled);
      expect(useQuery).toHaveBeenCalledWith(
        [QueryKeys.startupConfig],
        expect.any(Function),
        {
          staleTime: Infinity,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: false,
          enabled: true,
        }
      );
    });

    it('should call dataService.getStartupConfig in query function', () => {
      (useRecoilValue as jest.Mock).mockReturnValue(true);

      renderHook(() => useGetStartupConfig());

      const queryFn = (useQuery as jest.Mock).mock.calls[0][1];
      queryFn();

      expect(dataService.getStartupConfig).toHaveBeenCalled();
    });

    it('should pass provided config to useQuery and override defaults where applicable', () => {
      (useRecoilValue as jest.Mock).mockReturnValue(true);

      const customConfig = { staleTime: 5000, retry: false };
      renderHook(() => useGetStartupConfig(customConfig as any));

      expect(useQuery).toHaveBeenCalledWith(
        [QueryKeys.startupConfig],
        expect.any(Function),
        expect.objectContaining({
          staleTime: 5000,
          retry: false,
          refetchOnWindowFocus: false,
        })
      );
    });

    describe('enabled logic', () => {
      it('should be enabled when queriesEnabled is true and config.enabled is undefined', () => {
        (useRecoilValue as jest.Mock).mockReturnValue(true);
        renderHook(() => useGetStartupConfig());

        expect(useQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ enabled: true })
        );
      });

      it('should be disabled when config.enabled is false even if queriesEnabled is true', () => {
        (useRecoilValue as jest.Mock).mockReturnValue(true);
        renderHook(() => useGetStartupConfig({ enabled: false }));

        expect(useQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ enabled: false })
        );
      });

      it('should be disabled when queriesEnabled is false even if config.enabled is true', () => {
        (useRecoilValue as jest.Mock).mockReturnValue(false);
        renderHook(() => useGetStartupConfig({ enabled: true }));

        expect(useQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ enabled: false })
        );
      });
    });
  });
});
