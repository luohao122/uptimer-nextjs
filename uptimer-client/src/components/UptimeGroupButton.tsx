"use client";

import { IFrequency } from "@/interfaces/uptime.interface";
import { FC, memo, ReactElement, useCallback, useState } from "react";

export type UptimeButtonItem = string | IFrequency;

interface UptimeGroupButtonProps {
  buttonsText: UptimeButtonItem[];
  labelText: string;
  type: string;
  selectedItem?: string;
  onClick?: (data: string) => void;
}

const UptimeGroupButton: FC<UptimeGroupButtonProps> = ({
  buttonsText,
  labelText,
  type,
  selectedItem,
  onClick,
}): ReactElement => {
  const [active, setActive] = useState<string>("");

  const setSelectedItem = useCallback(
    (data: string | IFrequency, active: string): string => {
      if (
        type === "string" &&
        typeof data === "string" &&
        (active === data.toLowerCase() ||
          selectedItem?.toLowerCase() === data.toLowerCase())
      ) {
        return "bg-[#e4f3ff]";
      }
      if (
        type === "object" &&
        typeof data !== "string" &&
        (active === `${data.value}`.toLowerCase() ||
          selectedItem?.toLowerCase() === `${data.value}`.toLowerCase())
      ) {
        return "bg-[#e4f3ff]";
      }

      return "";
    },
    [selectedItem, type]
  );

  return (
    <div className="flex flex-col">
      <label
        htmlFor="group"
        className="block mb-2 text-medium font-medium text-gray-900"
      >
        {labelText}
      </label>
      <div className="flex flex-wrap gap-y-6">
        {buttonsText.map((data: string | IFrequency, index: number) => (
          <div
            key={`${index + Math.random() + new Date().toISOString()}`}
            className="flex shadow-sm"
            role="group"
          >
            <div
              className={`mr-2 inline-flex cursor-pointer items-center px-4 py-2 text-xs font-medium text-black rounded border border-black hover:bg-[#e4f3ff] ${setSelectedItem(
                data,
                active
              )}`}
              onClick={() => {
                if (type === "string" && typeof data === "string") {
                  onClick!(data);
                  setActive(data.toString().toLowerCase());
                }
                if (type !== "string" && typeof data !== "string") {
                  onClick!(`${data.value}`);
                  setActive(`${data.value}`.toLowerCase());
                }
              }}
            >
              {type === "string" && typeof data === "string"
                ? data
                : typeof data !== "string"
                ? data.name
                : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(UptimeGroupButton);
