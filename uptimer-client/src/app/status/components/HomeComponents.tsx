import {
  Dispatch,
  FC,
  FormEvent,
  memo,
  ReactElement,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
} from "react";

import {
  IMonitorDocument,
  IMonitorState,
  IPagination,
} from "@/interfaces/monitor.interface";
import HomeButtonGroup from "./HomeButtonGroup";
import Button from "@/components/Button";
import TextInput from "@/components/TextInput";
import clsx from "clsx";
import { FaBorderAll, FaPlay, FaPause, FaCheckCircle } from "react-icons/fa";
import HomeTable from "./HomeTable";
import HomeGrid from "./HomeGrid";
import { setLocalStorageItem } from "@/utils/utils";
import Paginate from "@/components/Paginate";

interface CreateUptimeButtonProps {
  monitorState: IMonitorState;
  setMonitorState: Dispatch<SetStateAction<IMonitorState>>;
}

export const CreateUptimeButton: FC<CreateUptimeButtonProps> = memo(
  ({ setMonitorState }): ReactElement => {
    const handleCreateClick = useCallback(() => {
      setMonitorState((prev) => ({ ...prev, showModal: true }));
    }, [setMonitorState]);

    return (
      <div className="h-[50%] flex flex-col items-center justify-center">
        <FaCheckCircle className="text-[60px] text-green-400" />
        <p className="text-base lg:text-lg py-2">You have no uptime tests.</p>
        <Button
          onClick={handleCreateClick}
          label="New Uptime Test"
          className="inline-flex items-center px-4 py-2 text-base font-medium text-white rounded bg-green-400"
        />
      </div>
    );
  }
);

CreateUptimeButton.displayName = "CreateUptimeButton";

interface ButtonGroupContainerProps {
  monitors: IMonitorDocument[];
  monitorState: IMonitorState;
  setMonitorState: Dispatch<SetStateAction<IMonitorState>>;
}

export const ButtonGroupContainer: FC<ButtonGroupContainerProps> = memo(
  ({
    // monitorState,
    monitors,
    setMonitorState,
  }): ReactElement => {
    const handleNewTestClick = useCallback(() => {
      setMonitorState((prev) => ({ ...prev, showModal: true }));
    }, [setMonitorState]);

    return (
      <div className="h-20 flex flex-col gap-y-3 mb-4 mt-2 md:items-center md:justify-between md:flex-row md:mb-0 md:mt-0">
        <HomeButtonGroup monitors={monitors} />
        <Button
          onClick={handleNewTestClick}
          label="New Uptime Test"
          className="inline-flex px-4 py-2 text-base font-medium text-white rounded bg-green-400 md:items-center"
        />
      </div>
    );
  }
);

ButtonGroupContainer.displayName = "ButtonGroupContainer";

interface RefreshButtonsProps {
  isRefreshed: boolean;
  view: "box" | "list";
  monitorsRef: IMonitorDocument[];
  monitors: IMonitorDocument[];
  setView: Dispatch<SetStateAction<"box" | "list">>;
  setMonitors: Dispatch<SetStateAction<IMonitorDocument[]>>;
  refreshMonitors: () => void;
  enableAutoRefresh: () => void;
}

let refreshed: boolean = false;
export const RefreshButtons: FC<RefreshButtonsProps> = memo(
  ({
    view,
    isRefreshed,
    refreshMonitors,
    setView,
    monitors,
    setMonitors,
    monitorsRef,
    enableAutoRefresh,
  }): ReactElement => {
    const hasActiveMonitors: boolean = useMemo(
      () => monitors.some((monitor: IMonitorDocument) => monitor.active),
      [monitors]
    );

    refreshed = isRefreshed;

    useEffect(() => {
      if (isRefreshed && !hasActiveMonitors) {
        refreshed = false;
        setLocalStorageItem("refresh", JSON.stringify(false));
      }
    }, [isRefreshed, hasActiveMonitors]);

    const handleSetView = useCallback(() => {
      const item = view === "box" ? "list" : "box";
      setLocalStorageItem("view", JSON.stringify(item));
      setView(item);
    }, [setView, view]);

    const handleFilterMonitor = useCallback(
      (event: FormEvent) => {
        const value: string = (event.target as HTMLInputElement).value;
        const results: IMonitorDocument[] = monitors.filter(
          (monitor: IMonitorDocument) => {
            return (
              monitor.name.toLowerCase().includes(value.toLowerCase()) ||
              monitor.type.toLowerCase().includes(value.toLowerCase())
            );
          }
        );
        setMonitors(!value || !results.length ? monitorsRef : results);
      },
      [monitors, monitorsRef, setMonitors]
    );

    return (
      <div className="h-44 flex flex-col items-start justify-start lg:flex-row lg:items-center lg:justify-between lg:h-20">
        <Button
          onClick={refreshMonitors}
          label="Refresh"
          className={clsx(
            "inline-flex items-center px-4 py-2 cursor-pointer text-base font-medium text-white rounded mb-3 lg:mb-0",
            {
              "cursor-none pointer-events-none bg-green-200": refreshed,
              "bg-green-400": !refreshed,
            }
          )}
        />
        <div className="flex flex-col justify-start gap-3 lg:flex-row lg:justify-end lg:w-full ">
          <div
            onClick={handleSetView}
            className="flex items-center gap-2 px-2 min-w-52 cursor-pointer rounded bg-[#9DFFE4]"
          >
            <FaBorderAll />
            <Button
              label={view === "box" ? "List View" : "Box View"}
              className="text-base font-bold px-4 py-2 lg:p-0"
            />
          </div>
          <div
            onClick={enableAutoRefresh}
            className="flex items-center gap-2 px-2 min-w-52 cursor-pointer rounded bg-[#9DFFE4]"
          >
            {!refreshed ? <FaPlay /> : <FaPause />}
            <Button
              label={
                !refreshed ? "Enable Auto Refresh" : "Disable Auto Refresh"
              }
              className="text-base font-bold px-4 py-2 lg:p-0"
            />
          </div>
          <div className="w-full lg:w-[30%]" onChange={handleFilterMonitor}>
            <TextInput
              type="text"
              name="search"
              className="border border-black text-gray-900 text-sm rounded-lg focus:ring-[#1e8dee] focus:border-[#1e8dee] block w-full p-2.5"
              placeholder="Search by name"
            />
          </div>
        </div>
      </div>
    );
  }
);

RefreshButtons.displayName = "RefreshButtons";

interface HomeTableWithPaginationProps {
  view: "box" | "list";
  limit: IPagination;
  autoRefreshLoading: boolean;
  monitors: IMonitorDocument[];
  updateLimit: (newLimit: IPagination) => void;
}

export const HomeTableWithPagination: FC<HomeTableWithPaginationProps> = memo(
  ({
    view,
    limit,
    autoRefreshLoading,
    monitors,
    updateLimit,
  }): ReactElement => {
    return (
      <>
        <div className="my-4">
          {view === "box" ? (
            <HomeTable
              limit={limit}
              monitors={monitors}
              autoRefreshLoading={autoRefreshLoading}
            />
          ) : (
            <HomeGrid
              limit={limit}
              monitors={monitors}
              autoRefreshLoading={autoRefreshLoading}
            />
          )}
        </div>
        <div className="my-4">
          {monitors.length > 0 ? (
            <Paginate
              updateLimit={updateLimit}
              length={monitors.length}
              defaultLimit={limit.end}
            />
          ) : (
            <></>
          )}
        </div>
      </>
    );
  }
);

HomeTableWithPagination.displayName = "HomeTableWithPagination";
