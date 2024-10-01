"use client";

import { ChangeEvent, FC, memo, ReactElement, useCallback } from "react";
import clsx from "clsx";

import Assertions from "@/app/(uptime)/components/Assertions";
import FormButtons from "@/app/(uptime)/components/FormButtons";
import PageLoader from "@/components/PageLoader";

import MonitorBaseInfo from "@/app/(uptime)/components/MonitorBaseInfo";
import { useTCPEdit } from "@/app/(uptime)/hooks/useTCPMonitor";
import MonitorItem from "@/app/(uptime)/components/MonitorItem";

import { EditMonitorProps } from "@/interfaces/monitor.interface";


const EditTCPMonitor: FC<EditMonitorProps> = ({params}): ReactElement => {
  const {
    loading,
    monitorInfo,
    setMonitorInfo,
    onHandleSubmit,
    notifications,
    validationErrors,
  } = useTCPEdit(params.monitorId);

  const handleResponseTimeChange = useCallback(
    (event: ChangeEvent) => {
      const value: string = (event.target as HTMLInputElement).value;
      setMonitorInfo((prev) => ({
        ...prev,
        responseTime: !isNaN(parseInt(value)) ? parseInt(value) : "",
      }));
    },
    [setMonitorInfo]
  );

  return (
    <>
      {loading ? (
        <PageLoader />
      ) : (
        <form
          action={onHandleSubmit}
          className="m-auto relative min-h-screen xl:container"
        >
          <div className="py-2 text-base lg:text-xl font-bold m-auto mt-4 w-[80%]">
            Edit TCP Monitor
          </div>
          <div className="p-6 m-auto mt-4 border w-[80%] bg-lightGray">
            <MonitorBaseInfo
              buttonsText={["TCP"]}
              urlLabel="Hostname"
              type="tcp"
              urlPlaceholder="Enter hostname"
              monitorInfo={monitorInfo}
              validationErrors={validationErrors}
              notifications={notifications}
              setMonitorInfo={setMonitorInfo}
            />
            <MonitorItem
              id="timeout"
              type="text"
              requiredIcon={true}
              topClass="mt-5"
              labelStart="Timeout (Default is 3 seconds)"
              inputValue={monitorInfo.timeout}
              placeholder="Request timeout"
              className={clsx(
                "bg-white border border-black text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5",
                {
                  "border border-red-400":
                    validationErrors!.timeout,
                }
              )}
              onChange={(event: ChangeEvent) => {
                const value: string = (event.target as HTMLInputElement).value;
                setMonitorInfo({
                  ...monitorInfo,
                  timeout: !isNaN(parseInt(value)) ? parseInt(value) : "",
                });
              }}
            />
            <Assertions>
              <MonitorItem
                id="responseTime"
                type="number"
                topClass="mb-4"
                labelStart="When response time is less than (Default is 2000ms)"
                inputValue={monitorInfo.responseTime}
                placeholder="Default is 2000 ms"
                onChange={handleResponseTimeChange}
              />
              <div className="mb-4">
                <div className="block mb-2 text-medium font-medium">
                  And connection is (Default is established)
                </div>
                <select
                  id="connection"
                  name="connection"
                  className="bg-white border border-black text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  value={monitorInfo.connection}
                  onChange={(event: ChangeEvent) => {
                    const value: string = (event.target as HTMLInputElement)
                      .value;
                    setMonitorInfo({ ...monitorInfo, connection: value });
                  }}
                >
                  <option value="none">None</option>
                  <option value="established">Established</option>
                  <option value="refused">Refused</option>
                </select>
              </div>
            </Assertions>
          </div>
          <FormButtons href="/status" buttonLabel="Update Monitor" />
        </form>
      )}
    </>
  );
};

export default memo(EditTCPMonitor);
