import { MonitorContext } from "@/context/MonitorContext";
import { ISSLMonitorDocument, IUseSSLTable } from "@/interfaces/ssl.interface";
import {
  DELETE_SSL_MONITOR,
  GET_USER_SSL_MONITORS,
  TOGGLE_SSL_MONITOR,
} from "@/queries/sslStatus";
import { showErrorToast } from "@/utils/utils";
import { useMutation } from "@apollo/client";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useState } from "react";

export const useSSLTable = (): IUseSSLTable => {
  const {
    state: { user },
  } = useContext(MonitorContext);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectMonitor, setSelectMonitor] = useState<ISSLMonitorDocument>();
  const [toggleSSLMonitor] = useMutation(TOGGLE_SSL_MONITOR);
  const [deleteSSLMonitor] = useMutation(DELETE_SSL_MONITOR, {
    update(cache, { data: { deleteSSLMonitor } }) {
      const { getUserSSLMonitors } = cache.readQuery({
        query: GET_USER_SSL_MONITORS,
        variables: { userId: `${user?.id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      const sslMonitors = getUserSSLMonitors.sslMonitors.filter(
        (monitor: ISSLMonitorDocument) =>
          parseInt(`${monitor.id}`) !== parseInt(deleteSSLMonitor.id)
      );
      cache.writeQuery({
        query: GET_USER_SSL_MONITORS,
        variables: { userId: `${user?.id}` },
        data: {
          getUserSSLMonitors: {
            __typename: "SSLMonitorResponse",
            sslMonitors,
          },
        },
      });
    },
  });

  const router = useRouter();

  const formatSSLDate = (date: string): string => {
    if (date === "--" || !date) {
      return "--";
    }
    return dayjs(date).format("YYYY-MM-DD");
  };

  const toggleUserMonitor = useCallback(
    async (monitor: ISSLMonitorDocument): Promise<void> => {
      const active: boolean = !monitor.active;
      try {
        toggleSSLMonitor({
          variables: {
            monitor: {
              monitorId: monitor.id,
              userId: monitor.userId,
              name: monitor.name,
              active,
            },
          },
        });
      } catch {
        showErrorToast(`Error ${active ? "activating" : "pausing"} monitor.`);
      }
    },
    [toggleSSLMonitor]
  );

  const editMonitor = useCallback(
    (monitor: ISSLMonitorDocument): void => {
      if (monitor.active) {
        showErrorToast("Please pause monitor before editing.");
        return;
      } else {
        router.push(`/ssl/edit/${monitor.id}`);
      }
    },
    [router]
  );

  const deleteUserMonitor = useCallback(
    async (monitor: ISSLMonitorDocument): Promise<void> => {
      if (monitor.active) {
        showErrorToast("Please pause monitor before deleting.");
        return;
      }
      try {
        const response = window.confirm("Are you sure you want to delete?");
        if (response) {
          await deleteSSLMonitor({
            variables: {
              monitorId: monitor.id,
              userId: monitor.userId,
            },
          });
        }
      } catch {
        showErrorToast("Error deleting monitor.");
      }
    },
    [deleteSSLMonitor]
  );

  return {
    showModal,
    selectMonitor,
    setShowModal,
    setSelectedMonitor: setSelectMonitor,
    formatSSLDate,
    toggleUserMonitor,
    editMonitor,
    deleteUserMonitor,
  };
};
