"use client";

import { FC, memo, ReactElement, useCallback, useContext } from "react";
import clsx from "clsx";
import { FaCircleNotch, FaArrowDown, FaArrowUp, FaPlay } from "react-icons/fa";

import {
  HomeTableProps,
  IMonitorDocument,
} from "@/interfaces/monitor.interface";
import HomeTableButtonGroup from "./HomeTableButtonGroup";
import HealthBar from "@/components/HealthBar";
import { convertFrequency, timeFromNow } from "@/utils/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { MonitorContext } from "@/context/MonitorContext";

const DEFAULT_DURATION = 24;

const HomeTable: FC<HomeTableProps> = ({
  monitors,
  limit,
  autoRefreshLoading,
}): ReactElement => {
  const { dispatch } = useContext(MonitorContext);
  const searchParams = useSearchParams();
  const router = useRouter();

  const navigateToStatusPage = useCallback(
    (monitor: IMonitorDocument): void => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("active", JSON.stringify(monitor.active));
      router.push(
        `/uptime/view/${monitor.type}/${monitor.id}/${DEFAULT_DURATION}?${params}`
      );
      dispatch({
        type: 'monitor',
        payload: monitor
      })
    },
    [dispatch, router, searchParams]
  );

  return (
    <div className="relative overflow-x-auto mt-10 lg:mt-0">
      {autoRefreshLoading ? (
        <div className="bg-white/[0.8] flex justify-center items-center z-50 left-0 top-0 absolute h-full w-full">
          <FaCircleNotch
            className="animate-spin h-10 w-10 mr-3"
            size={40}
            color="#50b5ff"
          />
        </div>
      ) : (
        <></>
      )}
      <table className="w-full text-sm text-left rtl:text-right text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">
              Status
            </th>
            <th scope="col" className="px-6 py-3">
              Type
            </th>
            <th scope="col" className="px-6 py-3">
              Name
            </th>
            <th scope="col" className="px-6 py-3 w-[15%]">
              Uptime
            </th>
            <th scope="col" className="px-6 py-3 w-[15%]">
              Frequency
            </th>
            <th scope="col" className="px-6 py-3">
              Last Modified
            </th>
            <th scope="col" className="px-6 py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {monitors
            .slice(limit.start, limit.end)
            .map((monitor: IMonitorDocument, index: number) => (
              <tr
                key={monitor.id}
                className={`${index % 2 !== 0 ? "bg-white" : "bg-[#f8f8fa]"}`}
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                >
                  <button
                    type="button"
                    className={clsx(
                      "mr-1 inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded",
                      {
                        "bg-yellow-400": !monitor.active,
                        "bg-green-400": monitor.active && monitor.status === 0,
                        "bg-red-400": monitor.active && monitor.status === 1,
                      }
                    )}
                  >
                    {monitor.active ? (
                      <>
                        {monitor.status === 1 ? <FaArrowDown /> : <FaArrowUp />}
                      </>
                    ) : (
                      <FaPlay />
                    )}
                  </button>
                </th>
                <td className="px-6 py-4">{monitor.type.toUpperCase()}</td>
                <td
                  onClick={() => navigateToStatusPage(monitor)}
                  className="px-6 py-4 text-[#1e8dee] font-medium cursor-pointer max-w-[270px] whitespace-nowrap text-ellipsis truncate"
                >
                  {monitor.name}
                </td>
                <td className="px-6 py-5 flex gap-3">
                  <div className="w-8">{monitor.uptime}%</div>
                  <HealthBar heartBeats={monitor.heartbeats!} size="small" />
                </td>
                <td className="px-6 py-5">
                  {convertFrequency(monitor.frequency)}
                </td>
                <td className="px-6 py-4 max-w-[270px] whitespace-nowrap text-ellipsis truncate">
                  {monitor.lastChanged ? (
                    <>{timeFromNow(`${monitor.lastChanged}`)}</>
                  ) : (
                    "None"
                  )}
                </td>
                <td className="px-6 py-4">
                  <HomeTableButtonGroup monitor={monitor} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(HomeTable);
