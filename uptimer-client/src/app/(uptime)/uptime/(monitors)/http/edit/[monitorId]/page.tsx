"use client";

import { ChangeEvent, FC, memo, ReactElement, useCallback } from "react";
import clsx from "clsx";

import HttpMonitorBaseInfo from "@/app/(uptime)/components/HttpMonitorBaseInfo";
import { useHttpEdit } from "@/app/(uptime)/hooks/useHttpMonitor";
import UptimeGroupButton from "@/components/UptimeGroupButton";

import { EXCLUDED_HTTP_METHODS, HTTP_METHODS } from "@/utils/utils";
import MonitorItem from "@/app/(uptime)/components/MonitorItem";
import Assertions from "@/app/(uptime)/components/Assertions";

import FormButtons from "@/app/(uptime)/components/FormButtons";
import PageLoader from "@/components/PageLoader";
import { EditMonitorProps } from "@/interfaces/monitor.interface";

const EditHttpMonitor: FC<EditMonitorProps> = ({ params }): ReactElement => {
  const {
    loading,
    monitorInfo,
    setMonitorInfo,
    onHandleSubmit,
    notifications,
    validationErrors,
  } = useHttpEdit(params.monitorId);

  const handleSelectHttpVerb = useCallback(
    (event: string) => {
      setMonitorInfo((prev) => ({ ...prev, method: event.toLowerCase() }));
    },
    [setMonitorInfo]
  );

  const handleHeaderChange = useCallback(
    (event: ChangeEvent) => {
      const value: string = (event.target as HTMLInputElement).value;
      setMonitorInfo((prev) => ({ ...prev, headers: JSON.stringify(value) }));
    },
    [setMonitorInfo]
  );

  const handleBodyChange = useCallback(
    (event: ChangeEvent) => {
      const value: string = (event.target as HTMLInputElement).value;
      setMonitorInfo((prev) => ({ ...prev, body: JSON.stringify(value) }));
    },
    [setMonitorInfo]
  );

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

  const handleStatusCodeChange = useCallback(
    (event: ChangeEvent) => {
      const value: string = (event.target as HTMLInputElement).value;
      setMonitorInfo((prev) => ({
        ...prev,
        statusCode: value,
      }));
    },
    [setMonitorInfo]
  );

  const handleContentTypeChange = useCallback(
    (event: ChangeEvent) => {
      const value: string = (event.target as HTMLInputElement).value;
      setMonitorInfo((prev) => ({
        ...prev,
        contentType: value,
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
            Add New HTTP Monitor
          </div>
          <div className="p-6 m-auto mt-4 border w-[80%] bg-lightGray">
            <HttpMonitorBaseInfo
              monitorInfo={monitorInfo}
              validationErrors={validationErrors}
              notifications={notifications}
              setMonitorInfo={setMonitorInfo}
            />
            <div className="mt-5">
              <UptimeGroupButton
                buttonsText={HTTP_METHODS}
                labelText="HTTP Verb"
                type="string"
                onClick={handleSelectHttpVerb}
                selectedItem={monitorInfo.method}
              />
            </div>
            <MonitorItem
              id="headers"
              type="textarea"
              topClass="mt-5"
              labelStart="Request Headers (optional)"
              className={clsx(
                "bg-white border border-black text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5",
                {
                  "border border-red-400": validationErrors!.headers,
                }
              )}
              labelEnd="Headers to be attached to your endpoint request."
              inputValue={monitorInfo.headers}
              placeholder="Example: {'key': value}. Key must always be in double quotes."
              onChange={handleHeaderChange}
            />
            <MonitorItem
              id="body"
              type="textarea"
              topClass="mt-5"
              labelStart="Request Body (optional)"
              className={clsx(
                "bg-white border border-black text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5",
                {
                  "pointer-events-none bg-gray opacity-5":
                    !EXCLUDED_HTTP_METHODS.includes(
                      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                      monitorInfo.method?.toUpperCase()!
                    ),
                  "border border-red-400": validationErrors!.body,
                }
              )}
              labelEnd="Body to be attached to your endpoint request."
              inputValue={monitorInfo.body}
              placeholder="Example: {'key': value}. Key must always be in double quotes."
              onChange={handleBodyChange}
            />
            <div className="mt-5">
              <label
                htmlFor="auth"
                className="block mb-2 text-medium font-medium text-gray-900"
              >
                Authentication (optional)
              </label>
              <select
                id="auth"
                name="auth"
                className={clsx(
                  "bg-white border border-black text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5",
                  {
                    "border border-red-400":
                      validationErrors!.basicAuthUser ||
                      validationErrors!.basicAuthPass,
                  }
                )}
                value={monitorInfo.httpAuthMethod}
                onChange={(event: ChangeEvent) => {
                  const value: string = (event.target as HTMLInputElement)
                    .value;
                  setMonitorInfo({ ...monitorInfo, httpAuthMethod: value });
                }}
              >
                <option value="none">None</option>
                <option value="basic">HTTP Basic Auth</option>
                <option value="token">Bearer Token</option>
              </select>
              {monitorInfo.httpAuthMethod &&
                monitorInfo.httpAuthMethod !== "none" && (
                  <div className="mt-4 border p-4">
                    {monitorInfo.httpAuthMethod === "basic" && (
                      <>
                        <MonitorItem
                          id="text"
                          type="username"
                          topClass="mb-2"
                          labelStart="Username"
                          className={clsx(
                            "bg-white border border-black text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5",
                            {
                              "border border-red-400":
                                validationErrors!.basicAuthUser,
                            }
                          )}
                          inputValue={monitorInfo.basicAuthUser}
                          placeholder="Username"
                          onChange={(event: ChangeEvent) => {
                            const value: string = (
                              event.target as HTMLInputElement
                            ).value;
                            setMonitorInfo({
                              ...monitorInfo,
                              basicAuthUser: value,
                            });
                          }}
                        />
                        <MonitorItem
                          id="password"
                          type="password"
                          topClass="mb-2"
                          labelStart="Password"
                          className={clsx(
                            "bg-white border border-black text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5",
                            {
                              "border border-red-400":
                                validationErrors!.basicAuthPass,
                            }
                          )}
                          inputValue={monitorInfo.basicAuthPass}
                          placeholder="Password"
                          onChange={(event: ChangeEvent) => {
                            const value: string = (
                              event.target as HTMLInputElement
                            ).value;
                            setMonitorInfo({
                              ...monitorInfo,
                              basicAuthPass: value,
                            });
                          }}
                        />
                      </>
                    )}
                    {monitorInfo.httpAuthMethod === "token" && (
                      <>
                        <MonitorItem
                          id="token"
                          type="text"
                          topClass="mb-2"
                          labelStart="Token"
                          className={clsx(
                            "bg-white border border-black text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5",
                            {
                              "border border-red-400":
                                validationErrors!.bearerToken,
                            }
                          )}
                          inputValue={monitorInfo.bearerToken}
                          placeholder="Bearer token"
                          onChange={(event: ChangeEvent) => {
                            const value: string = (
                              event.target as HTMLInputElement
                            ).value;
                            setMonitorInfo({
                              ...monitorInfo,
                              bearerToken: value,
                            });
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
            </div>
            <MonitorItem
              id="timeout"
              type="number"
              topClass="mt-5"
              labelStart="Request Timeout (Default is 10 seconds)"
              inputValue={monitorInfo.timeout}
              placeholder="Request timeout"
              onChange={(event: ChangeEvent) => {
                const value: string = (event.target as HTMLInputElement).value;
                setMonitorInfo({
                  ...monitorInfo,
                  timeout: !isNaN(parseInt(value)) ? parseInt(value) : "",
                });
              }}
            />
            <MonitorItem
              id="redirects"
              type="number"
              topClass="mt-5"
              labelStart="Maximum Redirects (Default is 0)"
              labelEnd="Maximum number of redirects to follow. Set to 0 to disable redirects."
              inputValue={monitorInfo.redirects}
              placeholder="Redirects"
              onChange={(event: ChangeEvent) => {
                const value: string = (event.target as HTMLInputElement).value;
                setMonitorInfo({
                  ...monitorInfo,
                  redirects: !isNaN(parseInt(value)) ? parseInt(value) : "",
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
              <MonitorItem
                id="status"
                type="textarea"
                topClass="mb-4"
                labelStart="And the status code is"
                labelEnd="Enter all codes and separate by comma."
                inputValue={monitorInfo.statusCode}
                placeholder="Enter all codes and separate by comma."
                onChange={handleStatusCodeChange}
              />
              <MonitorItem
                id="contentType"
                type="text"
                topClass="mb-4"
                labelStart="And header content-type should include (optional)"
                labelEnd="Enter all content-types and separate by comma."
                inputValue={monitorInfo.contentType}
                placeholder="Example: text/html; charset=utf8, application/json"
                onChange={handleContentTypeChange}
              />
            </Assertions>
          </div>
          <FormButtons href="/status" buttonLabel="Edit Monitor" />
        </form>
      )}
    </>
  );
};

export default memo(EditHttpMonitor);
