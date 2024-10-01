import {
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { FetchResult, useMutation, useQuery } from "@apollo/client";

import { MonitorContext } from "@/context/MonitorContext";
import {
  IMonitorDocument,
  IMonitorErrorMessage,
  IUseUptime,
  monitorErrorMessage,
} from "@/interfaces/monitor.interface";
import { showErrorToast, showSuccessToast } from "@/utils/utils";

import {
  CREATE_MONITOR,
  GET_SINGLE_MONITOR,
  GET_USER_MONITORS,
  UPDATE_MONITOR,
} from "@/queries/status";
import { tcpSchemaValidation } from "../components/validations/tcp";

export const useTCPCreate = (): IUseUptime => {
  const {
    state: { user, notifications },
  } = useContext(MonitorContext);
  const [validationErrors, setValidationErrors] =
    useState<IMonitorErrorMessage>(monitorErrorMessage);
  const [isPending, startTransition] = useTransition();
  const [monitorInfo, setMonitorInfo] = useState<IMonitorDocument>({
    name: "",
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    userId: user?.id!,
    notificationId: 0,
    active: true,
    status: 0,
    frequency: 30,
    url: "",
    type: "tcp",
    alertThreshold: 0,
    connection: "",
    port: 0,
    timeout: 0,
    responseTime: 0,
  });
  const router = useRouter();
  const [createMonitor] = useMutation(CREATE_MONITOR, {
    update(cache, { data: { createMonitor } }) {
      const { getUserMonitors } = cache.readQuery({
        query: GET_USER_MONITORS,
        variables: { userId: `${user?.id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      const newMonitor = createMonitor.monitors[0];
      const monitors = [newMonitor, ...getUserMonitors.monitors];
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

  const updateMonitorValues = useCallback((): IMonitorDocument => {
    return {
      ...monitorInfo,
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      userId: user?.id!,
      connection:
        monitorInfo.connection === "none" || monitorInfo.connection === ""
          ? "established"
          : monitorInfo.connection,
      timeout:
        typeof monitorInfo.timeout === "number" && monitorInfo.timeout > 0
          ? monitorInfo.timeout
          : 3000,
      responseTime:
        parseInt(`${monitorInfo.responseTime}`) > 0
          ? JSON.stringify(monitorInfo.responseTime)
          : JSON.stringify(2000),
    };
  }, [monitorInfo, user?.id]);

  const onHandleSubmit = useCallback((): void => {
    startTransition(async () => {
      try {
        const resultSchema = tcpSchemaValidation(monitorInfo);
        setValidationErrors(resultSchema);
        if (!Object.values(resultSchema).length) {
          const updatedMonitor: IMonitorDocument = updateMonitorValues();
          const result: FetchResult = await createMonitor({
            variables: { monitor: updatedMonitor },
          });
          if (result) {
            showSuccessToast("Created TCP Monitor successfully.");
            router.push("/status");
          }
        }
      } catch {
        showErrorToast("Error creating TCP Monitor.");
      }
    });
  }, [createMonitor, monitorInfo, router, updateMonitorValues]);

  return {
    loading: isPending,
    monitorInfo,
    notifications,
    validationErrors,
    setMonitorInfo,
    onHandleSubmit,
  };
};

export const useTCPEdit = (monitorId: string): IUseUptime => {
  const {
    state: { user, notifications },
  } = useContext(MonitorContext);
  const [validationErrors, setValidationErrors] =
    useState<IMonitorErrorMessage>(monitorErrorMessage);
  const [isPending, startTransition] = useTransition();
  const { data: monitorData } = useQuery(GET_SINGLE_MONITOR, {
    fetchPolicy: "no-cache",
    variables: { monitorId },
  });

  const [monitorInfo, setMonitorInfo] = useState<IMonitorDocument>({
    name: "",
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    userId: user?.id!,
    notificationId: 0,
    // active: true,
    status: 0,
    frequency: 30,
    url: "",
    type: "tcp",
    alertThreshold: 0,
    connection: "",
    port: 0,
    timeout: 0,
    responseTime: 0,
  });
  const router = useRouter();
  const [updateMonitor] = useMutation(UPDATE_MONITOR);

  const updateMonitorValues = useCallback((): IMonitorDocument => {
    return {
      ...monitorInfo,
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      userId: user?.id!,
      connection:
        monitorInfo.connection === "none" || monitorInfo.connection === ""
          ? "established"
          : monitorInfo.connection,
      timeout:
        typeof monitorInfo.timeout === "number" && monitorInfo.timeout > 0
          ? monitorInfo.timeout
          : 3000,
      responseTime:
        parseInt(`${monitorInfo.responseTime}`) > 0
          ? JSON.stringify(monitorInfo.responseTime)
          : JSON.stringify(2000),
    };
  }, [monitorInfo, user?.id]);

  const onHandleSubmit = useCallback((): void => {
    startTransition(async () => {
      try {
        const resultSchema: IMonitorErrorMessage =
          tcpSchemaValidation(monitorInfo);
        setValidationErrors(resultSchema);
        if (!Object.values(resultSchema).length) {
          const updatedMonitor: IMonitorDocument = updateMonitorValues();
          const result: FetchResult = await updateMonitor({
            variables: {
              monitor: updatedMonitor,
              userId: updatedMonitor.userId,
              monitorId: updatedMonitor.id,
            },
          });
          if (result) {
            router.push("/status");
          }
          showSuccessToast("Updated TCP Monitor successfully.");
        }
      } catch {
        showErrorToast("Error updating TCP Monitor.");
      }
    });
  }, [updateMonitor, monitorInfo, router, updateMonitorValues]);

  useEffect(() => {
    if (monitorData) {
      const { monitors }: { monitors: IMonitorDocument[] } =
        monitorData.getSingleMonitor;
      setMonitorInfo({
        id: monitors[0]?.id,
        name: monitors[0]?.name,
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        userId: monitors[0]?.userId!,
        notificationId: parseInt(`${monitors[0]?.notifications?.id}`) ?? 0,
        status: monitors[0]?.status,
        frequency: monitors[0]?.frequency,
        url: monitors[0]?.url,
        type: monitors[0]?.type || "tcp",
        alertThreshold: monitors[0]?.alertThreshold,
        connection: monitors[0]?.connection,
        port: monitors[0]?.port,
        timeout: monitors[0]?.timeout,
        responseTime: monitors[0]?.responseTime,
      });
    }
  }, [monitorData]);

  return {
    loading: isPending,
    monitorInfo,
    notifications,
    validationErrors,
    setMonitorInfo,
    onHandleSubmit,
  };
};
