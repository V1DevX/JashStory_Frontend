import React, { useState, useMemo, useEffect } from "react";
import { NavLink, Outlet, Navigate, useLocation, Link } from "react-router-dom"; // Добавил Link для breadcrumbs
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/loader/Loader"; // Убедитесь, что Loader тёмный (color="#a78bfa" или white)
import {
  Home,
  Users,
  FileText,
  Book,
  BookType,
  Tag,
  FolderOpen,
  Settings,
  LogOut,
  PlusCircle,
  Search,
  Bell,
  User,
  ChevronDown,
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon,
} from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Custom Breadcrumb (тёмный, использует Link для навигации)
const CustomBreadcrumb = ({ breadcrumbs }) => (
  <nav className="flex items-center space-x-2 text-sm font-medium text-gray-300 dark:text-gray-300 hidden md:flex"> {/* Скрыт на мобильных */}
    {breadcrumbs.map((crumb, index) => (
      <React.Fragment key={crumb.href}>
        <Link
          to={crumb.href}
          className="hover:text-purple-400 dark:hover:text-purple-400 transition-colors text-gray-300 dark:text-gray-300"
        >
          {crumb.name}
        </Link>
        {index < breadcrumbs.length - 1 && <span className="text-gray-500 dark:text-gray-500 mx-1">/</span>}
      </React.Fragment>
    ))}
  </nav>
);

const sideNavList = [
  { text: "Dashboard",  url: "/admin/dashboard",  icon: <Home       className="w-5 h-5" /> },
  { text: "Posts",      url: "/admin/posts",       icon: <BookType   className="w-5 h-5" /> },
  { text: "Tags",       url: "/admin/tags",        icon: <Tag        className="w-5 h-5" /> },
  { text: "Categories", url: "/admin/categories",  icon: <FolderOpen className="w-5 h-5" /> },
  { text: "Tests",      url: "/admin/tests",       icon: <FileText   className="w-5 h-5" /> },
  { text: "Users",      url: "/admin/users",       icon: <Users      className="w-5 h-5" /> },
  { text: "Settings",   url: "/admin/settings",    icon: <Settings   className="w-5 h-5" /> },
];

const AdminLayout = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [warn, setWarn] = useState(null);
  const handleWarnAction = (action, message) => { // action type is function
    if (!message && warn !== message) {
      setWarn(null);
    } else { 
      action(); 
    }
  };

  // TODO: fix this useless code
  // // Принудительная активация тёмной темы при монтировании (чтобы избежать "белого")
  // useEffect(() => {
  //   // Удаляем светлую тему, если есть
  //   if (document.documentElement.classList.contains('light')) {
  //     document.documentElement.classList.remove('light');
  //   }
  //   // Добавляем тёмную тему
  //   document.documentElement.classList.add('dark');
    
  //   // Очистка при размонтировании (опционально, раскомментируйте если нужно)
  //   // return () => document.documentElement.classList.remove('dark');
  // }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 dark:bg-gray-900">
      <Loader size={48} color="#a78bfa" />
    </div>
  );
  if (user?.role > 2) return <Navigate to="/" replace />;

  const handleLogout = () => {
    const message = 'Are you sure you want to logout?'
    handleWarnAction(() => logout(), message);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Генерация breadcrumbs (useMemo для оптимизации)
  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const crumbs = [{ name: 'Admin', href: '/admin' }];
    
    let currentPath = '/admin';
    pathSegments.slice(1).forEach((segment) => {
      currentPath += `/${segment}`;
      crumbs.push({
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      });
    });

    return crumbs;
  }, [location.pathname]);

  // Классы для main content (динамический margin-left)
  const mainClasses = `flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out bg-gray-900 dark:bg-gray-900 md:ml-0
	${isCollapsed && window.innerWidth < 768 ? 'ml-0' : ''}`; // ml-0 на мобильных при коллапсе

  // Overlay для мобильных (conditional render)
  const isMobile = window.innerWidth < 768;
  const showOverlay = isCollapsed && isMobile;

  return (
    <div className="flex h-screen bg-gray-900 dark:bg-gray-900 text-gray-100 dark:text-gray-100 overflow-hidden"> {/* Явно тёмный фон */}
      {/* Mobile Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 md:hidden" // Более тёмный overlay
          onClick={toggleSidebar}
        />
      )}
      {warn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80">
          <div className="bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <p className="mb-4">{warn}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => logout() }
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes
              </Button>
              <Button onClick={() => setWarn(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 ease-in-out z-40 fixed md:relative h-full bg-gray-800 dark:bg-gray-800 text-gray-100 dark:text-gray-100 shadow-lg border-r border-gray-700 dark:border-gray-700 ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${showOverlay ? 'left-0' : ''}`}
        style={{ left: showOverlay ? '0' : undefined }}
      >
        {/* Logo/Header Sidebar */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700 dark:border-gray-700 flex-shrink-0 bg-gray-800 dark:bg-gray-800">
          {!isCollapsed && <NavLink className="font-bold text-xl text-purple-500 dark:text-purple-500 font-unbounded" to={'/'}>Jash_Story</NavLink>
          }
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="flex-shrink-0 text-gray-300 dark:text-gray-300 hover:bg-gray-700 dark:hover:bg-gray-700"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 mt-4 bg-gray-800 dark:bg-gray-800">
          <TooltipProvider>
            {sideNavList.map((item) => (
              <div key={item.text} className="relative ">
                <Tooltip delayDuration={500} align={"end"}>
                  <TooltipTrigger asChild>
                    <div className={isCollapsed ? 'flex justify-center' : 'flex items-center gap-3'}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center ${isCollapsed ? 'justify-center w-16' : 'gap-3 w-full px-3'} py-2 rounded-lg font-medium transition-all duration-200 group min-w-0 text-gray-300 dark:text-gray-300 ${
                            isActive
                              ? "bg-purple-600 dark:bg-purple-600 text-white shadow-md"
                              : "hover:bg-gray-700 dark:hover:bg-gray-700"
                          }`
                        }
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        {!isCollapsed && <span className="text-sm truncate text-gray-300 dark:text-gray-300">{item.text}</span>}
                      </NavLink>
                    </div>
                  </TooltipTrigger>
									{isCollapsed && 
										<TooltipContent side={"right"} className="bg-gray-800 dark:bg-gray-800 text-gray-100 dark:text-gray-100 border-gray-700 dark:border-gray-700">
											{item.text}
										</TooltipContent>
									}
                  
                </Tooltip>
              </div>
            ))}
          </TooltipProvider>
        </nav>

        {/* User Profile in Sidebar */}
        <div className="p-4 border-t border-gray-700 dark:border-gray-700 flex-shrink-0 bg-gray-800 dark:bg-gray-800">
          <Separator className="bg-gray-700 dark:bg-gray-700" />
          <div className="flex items-center gap-3 mt-3">
            <Avatar className="w-8 h-8 flex-shrink-0 bg-purple-600 dark:bg-purple-600">
              <AvatarFallback className="bg-purple-600 dark:bg-purple-600 text-white font-bold text-sm">
                {user.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 dark:text-gray-100 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-400 dark:text-gray-400 hover:text-red-400 dark:hover:text-red-400 hover:bg-gray-700 dark:hover:bg-gray-700 flex-shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={mainClasses}>
        {/* Prevent scroll under sidebar on mobile when open */}
        {showOverlay && <div className="md:hidden h-16 bg-gray-900 dark:bg-gray-900" />} {/* Тёмный spacer */}

        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 border-b border-gray-700 dark:border-gray-700 bg-gray-800 dark:bg-gray-800 text-gray-100 dark:text-gray-100 shadow-sm flex-shrink-0">
          {/* Left: Breadcrumbs + Search */}
          <div className="flex items-center gap-4 flex-1">
            
            <CustomBreadcrumb breadcrumbs={breadcrumbs} />

            
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 w-4 h-4" />
              <Input
                placeholder="Note: Search is disabled"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-700 dark:bg-gray-700 text-gray-100 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 border-gray-600 dark:border-gray-600 w-full" // Тёмный input
              />
            </div>
          </div>

          {/* Right: Notifications + Actions + Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Quick Action Button */}
            <Button 
              variant="outline" 
              className="hidden lg:flex items-center gap-2 bg-gray-700 dark:bg-gray-700 text-gray-100 dark:text-gray-100 border-gray-600 dark:border-gray-600 hover:bg-gray-600 dark:hover:bg-gray-600"
            >
              <PlusCircle className="w-4 h-4" />
              Quick Action
            </Button>

            {/* Notifications */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-gray-400 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-700">
                    <Bell className="w-5 h-5" />
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-600 dark:bg-red-600 rounded-full justify-center items-center text-white">
                      0
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-gray-800 dark:bg-gray-800 text-gray-100 dark:text-gray-100 border-gray-700 dark:border-gray-700">
                  Notifications (0 unread)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex gap-2 rounded-full bg-gray-700 dark:bg-gray-700 hover:bg-gray-600 dark:hover:bg-gray-600 pl-0">
                  <Avatar className="w-8 h-8 bg-purple-600 dark:bg-purple-600">
                    <AvatarFallback className="bg-purple-600 dark:bg-purple-600 text-white font-bold text-sm">
                      {user.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-100 dark:text-gray-100 truncate max-w-32">{user.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 truncate max-w-32">{getRoleName(user.role)}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 shrink-0 opacity-50 text-gray-400 dark:text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700 text-gray-100 dark:text-gray-100">
                <DropdownMenuLabel className="font-normal text-gray-100 dark:text-gray-100">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-gray-400 dark:text-gray-400">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700 dark:bg-gray-700" />
                <DropdownMenuItem className="cursor-pointer text-gray-100 dark:text-gray-100 hover:bg-gray-700 dark:hover:bg-gray-700">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-gray-100 dark:text-gray-100 hover:bg-gray-700 dark:hover:bg-gray-700">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700 dark:bg-gray-700" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 dark:text-red-400 focus:text-red-400 focus:bg-gray-700 dark:focus:bg-gray-700">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto bg-gray-900 dark:bg-gray-900 text-gray-100 dark:text-gray-100 relative custom-scrollbar">
          {/* Prevent body scroll on mobile when sidebar open */}
          {showOverlay && <div className="md:hidden fixed inset-0 pointer-events-none z-30 bg-gray-900 dark:bg-gray-900" />}
          <Outlet />
        </main>
      </div> 
    </div> 
  );
};

// Вспомогательная функция для роли
const getRoleName = (role) => {
  switch (role) {
    case 1: return "Admin";
    case 2: return "Editor";
    case 3: return "User ";
    default: return "Unknown";
  }
};

export default AdminLayout;
