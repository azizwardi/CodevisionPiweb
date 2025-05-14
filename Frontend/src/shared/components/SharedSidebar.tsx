import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

// Import icons
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  UserCircleIcon,
  ChatIcon,
} from "../../dashboard/icons";

// Define the NavItem type
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

interface SharedSidebarProps {
  role: "admin" | "TeamLeader" | "Member";
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  setIsHovered: (isHovered: boolean) => void;
}

const SharedSidebar: React.FC<SharedSidebarProps> = ({
  role,
  isExpanded,
  isMobileOpen,
  isHovered,
  setIsHovered,
}) => {
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Function to check if a path is active
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Get navigation items based on user role
  const getNavItems = (): NavItem[] => {
    console.log("Generating navigation items for role:", role);

    // Different base items for each role
    if (role === "admin") {
      return [
        {
          icon: <GridIcon />,
          name: "Dashboard",
          path: "/dashboard",
        },
        {
          icon: <CalenderIcon />,
          name: "Calendar",
          path: "/calendar",
        },
        {
          icon: <UserCircleIcon />,
          name: "User Profile",
          path: "/profile",
        },
        {
          name: "Project Management",
          icon: <ListIcon />,
          path: "/form-elements",
        },
        {
          name: "Task Management",
          icon: <ListIcon />,
          subItems: [{ name: "Task List", path: "/tasks" }],
        },
        {
          name: "User Management",
          icon: <UserCircleIcon />,
          path: "/basic-tables",
        },
        {
          name: "Assistant IA",
          icon: <ChatIcon />,
          path: "/assistant",
        },
      ];
    } else if (role === "TeamLeader") {
      return [
        {
          icon: <GridIcon />,
          name: "Dashboard",
          path: "/team-leader-dashboard",
        },
        {
          icon: <CalenderIcon />,
          name: "Calendar",
          path: "/team-leader/calendar",
        },
        {
          icon: <UserCircleIcon />,
          name: "User Profile",
          path: "/team-leader/profile",
        },
        {
          name: "Project Management",
          icon: <ListIcon />,
          path: "/team-leader/projects",
        },
        {
          name: "Task Management",
          icon: <ListIcon />,
          subItems: [
            { name: "Task List", path: "/team-leader/tasks" },
            { name: "AI Task Assignment", path: "/team-leader/tasks/auto-assign" },
          ],
        },
        {
          name: "My Team",
          icon: <UserCircleIcon />,
          path: "/team-leader/team",
        },
        {
          name: "Team Chat",
          icon: <ChatIcon />,
          path: "/team-leader/team-chat",
        },
        {
          name: "Reports",
          icon: <ListIcon />,
          path: "/team-leader/reports",
        },
        {
          name: "Assistant IA",
          icon: <ChatIcon />,
          path: "/team-leader/assistant",
        },
        {
          name: "Quiz Participation",
          icon: <ListIcon />,
          path: "/team-leader/quiz-participation",
        },
      ];
    } else { // Member
      return [
        {
          icon: <GridIcon />,
          name: "Dashboard",
          path: "/member-dashboard",
        },
        {
          icon: <CalenderIcon />,
          name: "Calendar",
          path: "/member/calendar",
        },
        {
          icon: <UserCircleIcon />,
          name: "User Profile",
          path: "/member/profile",
        },
        {
          name: "Project Management",
          icon: <ListIcon />,
          path: "/member/projects",
        },
        {
          name: "Task Management",
          icon: <ListIcon />,
          subItems: [{ name: "Task List", path: "/member/tasks" }],
        },

        {
          name: "Team Chat",
          icon: <ChatIcon />,
          path: "/member/team-chat",
        },
        {
          name: "Assistant IA",
          icon: <ChatIcon />,
          path: "/member/assistant",
        },
        {
          name: "Quiz Participation",
          icon: <ListIcon />,
          path: "/member/quiz-participation",
        },
      ];
    }
  };

  // Get navigation items
  const navItems = getNavItems();

  // Effect to update active submenu based on URL
  useEffect(() => {
    let submenuMatched = false;
    // Only check main items
    ["main"].forEach((menuType) => {
      const items = getNavItems();
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  // Effect to update submenu height
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  // Handle submenu toggle
  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    // Only handle main menu items
    if (menuType === "main") {
      setOpenSubmenu((prevOpenSubmenu) => {
        if (
          prevOpenSubmenu &&
          prevOpenSubmenu.type === menuType &&
          prevOpenSubmenu.index === index
        ) {
          return null;
        }
        return { type: menuType, index };
      });
    }
  };

  // Render menu items
  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              type="button"
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="text-xl font-bold text-brand-500 hover:text-brand-600 transition-colors duration-200">
          Codevision
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default SharedSidebar;
