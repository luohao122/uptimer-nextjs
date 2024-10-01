import { FC, memo, ReactElement, useCallback } from "react";
import { FaArrowDown, FaArrowUp, FaPlay } from "react-icons/fa";

import Button from "@/components/Button";
import { IMonitorDocument } from "@/interfaces/monitor.interface";

interface HomeButtonGroupProps {
  monitors: IMonitorDocument[];
}

const HomeButtonGroup: FC<HomeButtonGroupProps> = ({
  monitors,
}): ReactElement => {
  const count = useCallback(
    (type: "active" | "inactive" | "error") => {
      let sum = 0;

      if (type === "active") {
        sum = monitors.filter(
          (monitor: IMonitorDocument) => monitor.active && monitor.status === 0
        ).length;
      }

      if (type === "inactive") {
        sum = monitors.filter(
          (monitor: IMonitorDocument) => !monitor.active
        ).length;
      }

      if (type === "error") {
        sum = monitors.filter(
          (monitor: IMonitorDocument) => monitor.active && monitor.status === 1
        ).length;
      }

      return sum;
    },
    [monitors]
  );

  return (
    <div className="inline-flex" role="group">
      <Button
        label={count("active")}
        icon={<FaArrowUp className="mr-1" />}
        type="button"
        className="mr-1 inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded bg-green-400"
      />
      <Button
        label={count("error")}
        icon={<FaArrowDown className="mr-1" />}
        type="button"
        className="mr-1 inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded bg-red-400"
      />
      <Button
        label={count("inactive")}
        icon={<FaPlay className="mr-1" />}
        type="button"
        className="mr-1 inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded bg-yellow-400"
      />
    </div>
  );
};

export default memo(HomeButtonGroup);
