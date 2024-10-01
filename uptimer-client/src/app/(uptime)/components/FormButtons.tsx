"use client";

import Button from "@/components/Button";
import Link from "next/link";
import { FC, memo, ReactElement } from "react";

interface FormButtonsProps {
  href: string;
  buttonLabel: string;
}

const FormButtons: FC<FormButtonsProps> = ({
  href,
  buttonLabel,
}): ReactElement => {
  return (
    <div className="flex m-auto my-6 justify-end gap-x-4 w-[80%]">
      <Link
        className="rounded bg-red-500 px-8 py-3 text-center text-sm font-bold text-white hover:bg-red-400 md:text-base md:py-3 focus:outline-none"
        href={href}
      >
        Cancel
      </Link>
      <Button
        type="submit"
        label={buttonLabel}
        className="rounded bg-sky-500 px-8 py-3 text-center text-sm font-bold text-white hover:bg-sky-400 md:text-base md:py-3 focus:outline-none"
      />
    </div>
  );
};

export default memo(FormButtons);
