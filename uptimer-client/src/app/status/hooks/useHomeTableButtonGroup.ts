import { MonitorContext } from "@/context/MonitorContext";
import { IMonitorDocument } from "@/interfaces/monitor.interface";
import {
  DELETE_MONITOR,
  GET_USER_MONITORS,
  TOGGLE_MONITOR,
} from "@/queries/status";
import { showErrorToast } from "@/utils/utils";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useCallback, useContext } from "react";

interface IUserHomeTableButtonGroupProps {
  toggleUserMonitor: () => Promise<void>;
  editMonitor: () => void;
  deleteUserMonitor: () => Promise<void>;
}

export const useHomeTableButtonGroup = ({
  monitor,
}: {
  monitor: IMonitorDocument;
}): IUserHomeTableButtonGroupProps => {
  const {
    state: { user },
    dispatch,
  } = useContext(MonitorContext);
  const [toggleMonitor] = useMutation(TOGGLE_MONITOR);
  const [deleteMonitor] = useMutation(DELETE_MONITOR, {
    update(cache, { data: { deleteMonitor } }) {
      const { getUserMonitors } = cache.readQuery({
        query: GET_USER_MONITORS,
        variables: { userId: `${user?.id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      const monitors = getUserMonitors.monitors.filter(
        (monitor: IMonitorDocument) =>
          parseInt(`${monitor.id}`) !== parseInt(deleteMonitor.id)
      );
      cache.writeQuery({
        query: GET_USER_MONITORS,
        variables: { userId: `${user?.id}` },
        data: {
          getUserMonitors: {
            __typename: "MonitorResponse",
            monitors,
          },
        },
      });
    },
  });
  const router = useRouter();

  const toggleUserMonitor = useCallback(async (): Promise<void> => {
    const active: boolean = !monitor.active;
    try {
      toggleMonitor({
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
  }, [monitor.active, monitor.id, monitor.name, monitor.userId, toggleMonitor]);

  const editMonitor = useCallback((): void => {
    if (monitor.active) {
      showErrorToast("Please pause monitor before editing.");
      return;
    }
    router.push(`/uptime/${monitor.type}/edit/${monitor.id}`);
  }, [monitor.active, monitor.id, monitor.type, router]);

  const deleteUserMonitor = useCallback(async (): Promise<void> => {
    if (monitor.active) {
      showErrorToast("Please pause monitor before deleting.");
      return;
    }
    try {
      const response = window.confirm("Are you sure you want to delete?");
      if (!response) {
        return;
      }
      await deleteMonitor({
        variables: {
          monitorId: `${monitor.id}`,
          userId: `${monitor.userId}`,
          type: monitor.type,
        },
      });
    } catch {
      showErrorToast("Error deleting monitor.");
    }
  }, [deleteMonitor, monitor.active, monitor.id, monitor.type, monitor.userId]);

  return {
    toggleUserMonitor,
    editMonitor,
    deleteUserMonitor,
  };
};
