"use client";

import { MonitorContext } from "@/context/MonitorContext";
import { apolloPersistor } from "@/queries/apolloClient";
import { LOGOUT_USER } from "@/queries/auth";
import { useMutation } from "@apollo/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { memo, useContext, useEffect } from "react";

type NavigateProps = { to: string; type: "logout" };

const Navigate = ({ type, to }: NavigateProps): null => {
  const router: AppRouterInstance = useRouter();
  const { dispatch } = useContext(MonitorContext);
  const [logout, { client }] = useMutation(LOGOUT_USER);

  useEffect(() => {
    const handleLogout = async () => {
      if (type === "logout") {
        await logout();
        dispatch({
          type: "dataUpdate",
          payload: {
            user: null,
            notifications: [],
          },
        });
        await client.clearStore();
        await apolloPersistor?.purge();
      }
    };
    handleLogout();

    router.push(to);
  }, [dispatch, type, to, router, logout, client]);

  return null;
};

export default memo(Navigate);
