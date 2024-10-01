"use client";

import { ReactElement, ReactNode } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import LayoutBody from "@/components/LayoutBody";
import ProtectedRoute from "@/components/ProtectedRoute";

dayjs.extend(relativeTime);

const UptimeLayout = ({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement => {
  return (
    <ProtectedRoute>
      <LayoutBody>{children}</LayoutBody>
    </ProtectedRoute>
  );
};

export default UptimeLayout;
