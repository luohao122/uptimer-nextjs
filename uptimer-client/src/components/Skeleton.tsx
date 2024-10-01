"use client";

import { FC, memo, ReactElement } from "react";

const Skeleton: FC = (): ReactElement => {
  return (
    <>
      <li
        className="z-50 py-5 px-20 flex cursor-pointer items-center relative ml-auto justify-center rounded-full bg-[#f0f0f0]
text-white font-bold"
      ></li>
      <li
        className="z-50 py-5 px-20 flex cursor-pointer items-center relative ml-auto justify-center rounded-full bg-[#f0f0f0]
text-white font-bold"
      ></li>
    </>
  );
};

export default memo(Skeleton);
