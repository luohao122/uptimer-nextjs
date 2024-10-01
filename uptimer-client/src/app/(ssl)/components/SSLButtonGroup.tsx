"use client";

import { FC, memo, ReactElement, useCallback } from "react";
import { FaArrowDown, FaArrowUp, FaExclamationTriangle } from "react-icons/fa";

import {
  ISSLInfo,
  ISSLMonitorDocument,
  sslDefaultInfoData,
} from "@/interfaces/ssl.interface";
import Button from "@/components/Button";

interface SSLButtonGroupProps {
  sslMonitors: ISSLMonitorDocument[];
}

const SSLButtonGroup: FC<SSLButtonGroupProps> = ({
  sslMonitors,
}): ReactElement => {
  const monitorInfoData = useCallback(
    (monitor: ISSLMonitorDocument): ISSLInfo =>
      monitor.info ? JSON.parse(monitor.info) : sslDefaultInfoData,
    []
  );

  const count = useCallback(
    (type: "success" | "danger" | "expiring soon") => {
      let sum = 0;
      if (type === "success") {
        sum = sslMonitors.filter(
          (monitor: ISSLMonitorDocument) =>
            monitorInfoData(monitor).type === "success"
        ).length;
      }
      if (type === "danger") {
        sum = sslMonitors.filter(
          (monitor: ISSLMonitorDocument) =>
            monitorInfoData(monitor).type === "danger" ||
            monitorInfoData(monitor).type === "expired"
        ).length;
      }
      if (type === "expiring soon") {
        sum = sslMonitors.filter(
          (monitor: ISSLMonitorDocument) =>
            monitorInfoData(monitor).type === "expiring soon"
        ).length;
      }

      return sum;
    },
    [monitorInfoData, sslMonitors]
  );

  return (
    <div className="inline-flex" role="group">
      <Button
        icon={<FaArrowUp className="mr-1" />}
        label={`Valid: ${count("success")}`}
        type="button"
        className="mr-1 inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded bg-green-400"
      />
      <Button
        icon={<FaExclamationTriangle className="mr-1" />}
        label={`Expiring soon: ${count("expiring soon")}`}
        type="button"
        className="mr-1 inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded bg-yellow-400"
      />
      <Button
        icon={<FaArrowDown className="mr-1" />}
        label={`Expired / Invalid: ${count("danger")}`}
        type="button"
        className="mr-1 inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded bg-red-400"
      />
    </div>
  );
};

export default memo(SSLButtonGroup);
