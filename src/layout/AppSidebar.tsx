import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  TableIcon,
  UserIcon,
  DocumentCurrency,
  GlobeAmericas,
  GroupIcon
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { hasAnyModuleAccess } from "../helper/permissionsHelper";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  externalUrl?: string; // URL externa para abrir en nueva pestaña
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  requiredModules?: string[]; // Módulos requeridos para mostrar este item
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Inicio",
    subItems: [
      { name: "Reportes de compras", path: "/" },
      { name: "Reportes de canjes", path: "/reportes/canjes" },
      { name: "Pacientes - Productos", path: "/reportes/pacientes-productos" },
    ],
    // Inicio siempre visible para todos
  },
  {
    icon: <UserIcon />,
    name: "Accesos",
    subItems: [
      { name: "Módulos", path: "/modulos" },
      { name: "Usuarios", path: "/modulos/usuarios" },
    ],
    requiredModules: ["users"], // Requiere módulo de usuarios
  },
  {
    icon: <GlobeAmericas />,
    name: "Localizaciones",
    subItems: [
      { name: "Paises", path: "/localizaciones/paises" },
      { name: "Ciudades/Provincias", path: "/localizaciones/ciudades" },
      { name: "Municipios/Cantones", path: "/localizaciones/municipios" },
    ],
    requiredModules: ["countries"], // Requiere módulo de países
  },
  {
    icon: <DocumentCurrency />,
    name: "Doctores",
    subItems: [
      { name: "Nuestros doctores", path: "/doctores" },
      { name: "Especialidades", path: "/doctores/especialidades" },
    ],
    requiredModules: ["doctors"], // Requiere módulo de doctores
  },
  {
    icon: <TableIcon />,
    name: "Farmacias",
    subItems: [
      { name: "Cadenas/Independientes", path: "/farmaceuticas" },
      { name: "Sucursales", path: "/farmaceuticas/sucursales" },
    ],
    requiredModules: ["pharmacies"], // Requiere módulo de farmacias
  },
  {
    icon: <BoxCubeIcon />,
    name: "Medicamentos",
    subItems: [
      { name: "Productos", path: "/medicamentos/productos" },
      { name: "Presentación", path: "/medicamentos/presentacion" },
    ],
    requiredModules: ["products"], // Requiere módulo de productos
  },
  {
    icon: <GroupIcon />,
    name: "Pacientes",
    path: "/pacientes",
    requiredModules: ["users"], // Requiere módulo de usuarios
  },
  {
    icon: <ListIcon />,
    name: "Transacciones",
    path: "/transacciones",
    requiredModules: ["users"], // Requiere módulo de usuarios
  },
  {
    icon: <BoxCubeIcon />,
    name: "Distribuidores",
    path: "/distribuidores",
    requiredModules: ["users"], // Requiere módulo de usuarios
  },
  {
    icon: <DocumentCurrency />,
    name: "Bonos",
    path: "/bonos",
    requiredModules: ["users"], // Requiere módulo de usuarios
  },
  {
    icon: <TableIcon />,
    name: "Portal Distribuidores",
    externalUrl: "https://alter-pharma-distribuidores.vercel.app/auth/sign-in",
    requiredModules: ["distributors"], // Requiere módulo de distribuidores
  },
  // {
  //   icon: <CalenderIcon />,
  //   name: "Calendar",
  //   path: "/calendar",
  // },
  // {
  //   name: "Forms",
  //   icon: <ListIcon />,
  //   subItems: [{ name: "Form Elements", path: "/form-elements" }],
  // },
  // {
  //   name: "Tables",
  //   icon: <TableIcon />,
  //   subItems: [{ name: "Basic Tables", path: "/basic-tables" }],
  // },
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Blank Page", path: "/blank" },
  //     { name: "404 Error", path: "/error-404" },
  //   ],
  // },
];

const othersItems: NavItem[] = [
  // {
  //   icon: <PieChartIcon />,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart" },
  //     { name: "Bar Chart", path: "/bar-chart" },
  //   ],
  // },
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "UI Elements",
  //   subItems: [
  //     { name: "Alerts", path: "/alerts" },
  //     { name: "Avatar", path: "/avatars" },
  //     { name: "Badge", path: "/badge" },
  //     { name: "Buttons", path: "/buttons" },
  //     { name: "Images", path: "/images" },
  //     { name: "Videos", path: "/videos" },
  //   ],
  // }
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    name: string;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                name: nav.name,
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

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.name}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (name: string, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.name === name
      ) {
        return null;
      }
      return { type: menuType, name };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => {
    // Filtrar items según permisos del usuario
    const filteredItems = items.filter(nav => {
      // Si no requiere módulos, siempre mostrar (ej: Inicio)
      if (!nav.requiredModules || nav.requiredModules.length === 0) {
        return true;
      }
      // Verificar si el usuario tiene acceso a alguno de los módulos requeridos
      return hasAnyModuleAccess(nav.requiredModules);
    });

    return (
      <ul className="flex flex-col gap-4">
        {filteredItems.map((nav) => (
          <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(nav.name, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.name === nav.name
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
                  openSubmenu?.type === menuType && openSubmenu?.name === nav.name
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
                    openSubmenu?.name === nav.name
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : nav.externalUrl ? (
            <a
              href={nav.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="menu-item group menu-item-inactive"
            >
              <span className="menu-item-icon-size menu-item-icon-inactive">
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span className="menu-item-text">{nav.name}</span>
                  <svg
                    className="ml-auto w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </>
              )}
            </a>
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
                subMenuRefs.current[`${menuType}-${nav.name}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.name === nav.name
                    ? `${subMenuHeight[`${menuType}-${nav.name}`]}px`
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
  };

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
        className={`py-0 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/alter-pharma.webp"
                alt="Logo"
                width={150}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/alter-pharma.webp"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : ('')}
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
                  <HorizontaLDots className="size-6 mt-5" />
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

export default AppSidebar;
