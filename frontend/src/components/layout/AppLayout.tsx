import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:block">
      <Sidebar />
      <div className="md:ml-[260px] flex-1 min-w-0 transition-all duration-300">
        <Topbar />
        <main className="p-3 sm:p-4 md:p-6 min-w-0 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
