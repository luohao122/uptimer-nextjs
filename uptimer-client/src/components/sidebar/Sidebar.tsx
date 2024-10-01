import Link from "next/link";
import { FC, memo, ReactElement, useCallback, useMemo } from "react";
import { FaLock, FaRegClock, FaTv, FaUser } from "react-icons/fa";

import SidebarMenu, { SubmenuTextProps } from "./SidebarMenu";
import { useRouter, useSearchParams } from "next/navigation";

const Sidebar: FC<{ type: "sidebar" | "header" }> = ({
  type,
}): ReactElement => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const openUptimeModal = useCallback((): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("open", JSON.stringify(true));
    router.push(`/status?${params}`);
  }, [router, searchParams]);

  const submenuTexts: SubmenuTextProps[] = useMemo(
    () => [
      { name: "All Tests", url: "/status" },
      { name: "New Uptime Test", onClick: openUptimeModal },
    ],
    [openUptimeModal]
  );

  const sslSubmenuTexts: SubmenuTextProps[] = useMemo(
    () => [
      { name: "All Tests", url: "/ssl" },
      { name: "New SSL Test", url: "/ssl/create" },
    ],
    []
  );

  const contactGroupSubmenuTexts: SubmenuTextProps[] = useMemo(
    () => [
      { name: "All Contact Groups", url: "/contact" },
      { name: "New Contact Group", url: "/contact/create" },
    ],
    []
  );

  return (
    <div className="h-[90%] w-full">
      {type === "sidebar" && (
        <div className="text-gray-100 text-xl">
          <div className="p-2 mt-1 flex items-center">
            <Link
              href="/status"
              className="relative z-10 px-2.5 flex items-center gap-2 cursor-pointer justify-center self-center text-2xl font-bold text-[#4aa1f3]"
            >
              <FaTv />
              Uptimer
            </Link>
            <i className="bi bi-x cursor-pointer ml-28 lg:hidden"></i>
          </div>
          <div className="my-2 border-b border-[#e5f3ff] h-[1px]"></div>
        </div>
      )}
      <SidebarMenu
        menuText="Uptime"
        icon={<FaRegClock />}
        submenuTexts={submenuTexts}
      />
      <SidebarMenu
        menuText="SSL"
        icon={<FaLock />}
        submenuTexts={sslSubmenuTexts}
      />
      <SidebarMenu
        menuText="Contact Groups"
        icon={<FaUser />}
        submenuTexts={contactGroupSubmenuTexts}
      />
    </div>
  );
};

export default memo(Sidebar);
