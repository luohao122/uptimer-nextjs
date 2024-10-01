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

import { httpSchemaValidation } from "../components/validations/http";
import {
  CREATE_MONITOR,
  GET_SINGLE_MONITOR,
  GET_USER_MONITORS,
  UPDATE_MONITOR,
} from "@/queries/status";

export const useHttpCreate = (): IUseUptime => {
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
    method: "GET",
    type: "http",
    alertThreshold: 0,
    body: "",
    headers: "",
    httpAuthMethod: "",
    basicAuthUser: "",
    basicAuthPass: "",
    bearerToken: "",
    timeout: 10,
    redirects: 0,
    responseTime: 2000,
    statusCode: "",
    contentType: "",
    connection: "",
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
      statusCode:
        monitorInfo.statusCode!.length > 0
          ? JSON.stringify(monitorInfo.statusCode?.split(",").map(Number))
          : JSON.stringify([200]),
      responseTime:
        parseInt(`${monitorInfo.responseTime}`) > 0
          ? JSON.stringify(monitorInfo.responseTime)
          : JSON.stringify(2000),
      contentType:
        monitorInfo.contentType!.length > 0
          ? JSON.stringify(monitorInfo.contentType?.split(","))
          : "",
    };
  }, [monitorInfo, user?.id]);

  const onHandleSubmit = useCallback((): void => {
    startTransition(async () => {
      try {
        const resultSchema = httpSchemaValidation(monitorInfo);
        setValidationErrors(resultSchema);
        if (!Object.values(resultSchema).length) {
          const updatedMonitor: IMonitorDocument = updateMonitorValues();
          const result: FetchResult = await createMonitor({
            variables: { monitor: updatedMonitor },
          });
          if (result) {
            router.push("/status");
          }
          showSuccessToast("Created HTTP Monitor successfully.");
        }
      } catch {
        showErrorToast("Error creating HTTP Monitor.");
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

export const useHttpEdit = (monitorId: string): IUseUptime => {
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
    method: "GET",
    type: "http",
    alertThreshold: 0,
    body: "",
    headers: "",
    httpAuthMethod: "",
    basicAuthUser: "",
    basicAuthPass: "",
    bearerToken: "",
    timeout: 10,
    redirects: 0,
    responseTime: 2000,
    statusCode: "",
    contentType: "",
    connection: "",
  });
  const router = useRouter();
  const [updateMonitor] = useMutation(UPDATE_MONITOR);

  const updateMonitorValues = useCallback((): IMonitorDocument => {
    return {
      ...monitorInfo,
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      userId: user?.id!,
      statusCode:
        monitorInfo.statusCode!.length > 0
          ? JSON.stringify(monitorInfo.statusCode?.split(",").map(Number))
          : JSON.stringify([200]),
      responseTime:
        parseInt(`${monitorInfo.responseTime}`) > 0
          ? JSON.stringify(monitorInfo.responseTime)
          : JSON.stringify(2000),
      contentType:
        monitorInfo.contentType!.length > 0
          ? JSON.stringify(monitorInfo.contentType?.split(","))
          : "",
    };
  }, [monitorInfo, user?.id]);

  const onHandleSubmit = useCallback((): void => {
    startTransition(async () => {
      try {
        const resultSchema = httpSchemaValidation(monitorInfo);
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
          showSuccessToast("Updated HTTP Monitor successfully.");
        }
      } catch {
        showErrorToast("Error updating HTTP Monitor.");
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
        method: monitors[0]?.method?.toUpperCase(),
        type: monitors[0]?.type,
        alertThreshold: monitors[0]?.alertThreshold,
        body: monitors[0]?.body,
        headers: monitors[0]?.headers,
        httpAuthMethod: monitors[0]?.httpAuthMethod,
        basicAuthUser: monitors[0]?.basicAuthUser,
        basicAuthPass: monitors[0]?.basicAuthPass,
        bearerToken: monitors[0]?.bearerToken,
        timeout: monitors[0]?.timeout,
        redirects: monitors[0]?.redirects,
        responseTime: monitors[0]?.responseTime,
        statusCode: monitors[0]?.statusCode
          ? JSON.parse(monitors[0]?.statusCode).join(",")
          : "",
        contentType: monitors[0]?.contentType
          ? JSON.parse(monitors[0]?.contentType).join(",")
          : "",
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
