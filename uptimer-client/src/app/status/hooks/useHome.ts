import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLazyQuery, useQuery, useSubscription } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";

import { MonitorContext } from "@/context/MonitorContext";
import {
  IMonitorDocument,
  IMonitorState,
  IUseHome,
} from "@/interfaces/monitor.interface";
import {
  ENABLE_AUTO_REFRESH,
  GET_USER_MONITORS,
  MONITORS_UPDATED,
} from "@/queries/status";

import { usePagination } from "@/utils/usePagination";
import {
  getLocalStorageItem,
  setLocalStorageItem,
  showErrorToast,
} from "@/utils/utils";

export const useHome = (): IUseHome => {
  const {
    state: { user },
  } = useContext(MonitorContext);
  const [monitors, setMonitors] = useState<IMonitorDocument[]>([]);
  const [monitorState, setMonitorState] = useState<IMonitorState>({
    showModal: false,
    enableRefresh: false,
    autoRefreshLoading: false,
  });
  const [view, setView] = useState<"box" | "list">("box");
  const monitorsRef = useRef<IMonitorDocument[]>([]);
  const autoMonitorsRef = useRef<IMonitorDocument[]>([]);
  const searchParams = useSearchParams();
  const [limit, updateLimit] = usePagination(0, 10);
  const params = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams]
  );
  const openModal = JSON.parse(`${params.get("open")}`);
  const router = useRouter();

  const { data, loading } = useQuery(GET_USER_MONITORS, {
    fetchPolicy: "network-only",
    variables: { userId: `${user?.id}` },
  });

  const [getUserMonitors] = useLazyQuery(GET_USER_MONITORS, {
    fetchPolicy: "network-only",
    variables: { userId: `${user?.id}` },
  });
  const [autoRefresh, { data: refreshData }] = useLazyQuery(
    ENABLE_AUTO_REFRESH,
    {
      fetchPolicy: "network-only",
    }
  );

  useSubscription(MONITORS_UPDATED, {
    onData: ({ client, data }) => {
      const { userId, monitors } = data.data.monitorsUpdated;
      if (userId === user?.id) {
        setMonitorState((prevState: IMonitorState) => ({
          ...prevState,
          autoRefreshLoading: true,
        }));
        autoMonitorsRef.current = monitors;
        client.cache.updateQuery({ query: GET_USER_MONITORS }, () => {
          return {
            getUserMonitors: {
              __typename: "MonitorResponse",
              monitors,
            },
          };
        });
      } else {
        setMonitorState((prevState: IMonitorState) => ({
          ...prevState,
          autoRefreshLoading: false,
        }));
      }
    },
  });

  const storageViewItem: "box" | "list" = getLocalStorageItem("view");
  const isRefreshed = JSON.parse(getLocalStorageItem("refresh"));
  const hasActiveMonitors: boolean = monitors.some(
    (monitor: IMonitorDocument) => monitor.active
  );

  const refreshMonitors = useCallback(async (): Promise<void> => {
    try {
      if (!hasActiveMonitors) {
        showErrorToast("There are no active monitors to refresh");
        return;
      }

      setMonitorState((prev) => ({ ...prev, autoRefreshLoading: true }));
      const result = await getUserMonitors();
      if (result) {
        monitorsRef.current = result.data.getUserMonitors.monitors;
        setMonitors(result.data.getUserMonitors.monitors);
        setMonitorState((prev) => ({ ...prev, autoRefreshLoading: false }));
      }
    } catch {
      showErrorToast("Failed to refresh monitors");
    }
  }, [getUserMonitors, hasActiveMonitors]);

  const enableAutoRefresh = useCallback(async (): Promise<void> => {
    try {
      if (!hasActiveMonitors) {
        showErrorToast("There are no active monitors to refresh");
        return;
      }
      await autoRefresh({
        variables: { userId: `${user?.id}`, refresh: !isRefreshed },
      });
      setMonitorState((prev) => ({ ...prev, enableRefresh: !isRefreshed }));
      setLocalStorageItem("refresh", JSON.stringify(!isRefreshed));
    } catch {
      showErrorToast("Failed to enable auto refresh");
    }
  }, [autoRefresh, hasActiveMonitors, isRefreshed, user?.id]);

  const closeUptimeModal = useCallback((): void => {
    params.delete("open");
    router.push(`/status?${params}`);
  }, [params, router]);

  useEffect(() => {
    if (!storageViewItem) {
      setLocalStorageItem("view", JSON.stringify("box"));
    }
    if (isRefreshed === null) {
      setLocalStorageItem("refresh", JSON.stringify(false));
      setMonitorState((prev) => ({ ...prev, enableRefresh: false }));
    } else {
      setMonitorState((prev) => ({ ...prev, enableRefresh: isRefreshed }));
    }
    setView(storageViewItem || "box");
  }, [isRefreshed, storageViewItem]);

  useEffect(() => {
    if (data && data.getUserMonitors) {
      monitorsRef.current = data.getUserMonitors.monitors;
      setMonitors(data.getUserMonitors.monitors);
    }
    if (refreshData && refreshData.autoRefresh) {
      setLocalStorageItem(
        "refresh",
        JSON.stringify(refreshData.autoRefresh.refresh)
      );
      setMonitorState((prevState: IMonitorState) => ({
        ...prevState,
        enableRefresh: refreshData.autoRefresh.refresh,
      }));
    }

    if (autoMonitorsRef.current.length) {
      autoMonitorsRef.current = [];
      setMonitorState((prevState: IMonitorState) => ({
        ...prevState,
        autoRefreshLoading: true,
      }));
    } else {
      setTimeout(() => {
        setMonitorState((prevState: IMonitorState) => ({
          ...prevState,
          autoRefreshLoading: false,
        }));
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, refreshData, autoMonitorsRef.current]);

  return {
    monitorState,
    monitors,
    limit,
    isRefreshed,
    autoMonitorsRef,
    monitorsRef,
    view,
    loading,
    setView,
    setMonitors,
    setMonitorState,
    refreshMonitors,
    enableAutoRefresh,
    closeUptimeModal,
    openModal,
    updateLimit,
  };
};
