"use client";

import { FC, ReactElement, useCallback } from "react";
import {
  ButtonGroupContainer,
  CreateUptimeButton,
  HomeTableWithPagination,
  RefreshButtons,
} from "./HomeComponents";
import { useHome } from "../hooks/useHome";
import MonitorSelectionModal from "@/components/MonitorSelectionModal";
import HomeSkeleton from "./HomeSkeleton";

const Home: FC = (): ReactElement => {
  const {
    monitorState,
    monitors,
    limit,
    isRefreshed,
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
  } = useHome();

  const handleCloseMonitorModal = useCallback(() => {
    setMonitorState((prev) => ({ ...prev, showModal: false }));
    closeUptimeModal();
  }, [closeUptimeModal, setMonitorState]);

  return (
    <>
      {(monitorState.showModal || openModal) && (
        <MonitorSelectionModal onClose={handleCloseMonitorModal} />
      )}
      <div className="m-auto px-6 h-screen relative min-h-screen xl:container md:px-12 lg:px-6">
        {loading && <HomeSkeleton />}
        {!loading && monitors.length > 0 ? (
          <>
            <ButtonGroupContainer
              monitors={monitors}
              setMonitorState={setMonitorState}
              monitorState={monitorState}
            />
            <RefreshButtons
              view={view as "box" | "list"}
              isRefreshed={isRefreshed as boolean}
              monitorsRef={monitorsRef.current}
              monitors={monitors}
              setView={setView}
              setMonitors={setMonitors}
              refreshMonitors={refreshMonitors}
              enableAutoRefresh={enableAutoRefresh}
            />
            <HomeTableWithPagination
              view={view as "box" | "list"}
              limit={limit}
              autoRefreshLoading={monitorState.autoRefreshLoading}
              monitors={monitors}
              updateLimit={updateLimit}
            />
          </>
        ) : (
          <>
            {!loading && !monitors.length && (
              <>
                <CreateUptimeButton
                  monitorState={monitorState}
                  setMonitorState={setMonitorState}
                />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Home;
