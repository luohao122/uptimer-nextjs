"use client";

import { FC, memo, ReactElement } from "react";
import SSLHome from "../components/SSLHome";

const SSLPage: FC = (): ReactElement => {
  return (
    <>
      <SSLHome />
    </>
  );
};

export default memo(SSLPage);
