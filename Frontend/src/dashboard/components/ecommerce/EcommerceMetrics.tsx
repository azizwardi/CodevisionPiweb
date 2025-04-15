import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useState, useEffect } from "react";
import axios from "axios";

export default function EcommerceMetrics() {
  const [userCount, setUserCount] = useState<number>(0);
  const [projectCount, setProjectCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [projectLoading, setProjectLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [projectError, setProjectError] = useState<string>("");

  // Fetch user count
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:8000/api/user/showuser");
        console.log("User API response:", response.data);

        // Calculate user count
        const count = response.data.length;
        setUserCount(count);

        setError("");
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Unable to load user count");
      } finally {
        setLoading(false);
      }
    };

    fetchUserCount();
  }, []);

  // Fetch project count
  useEffect(() => {
    const fetchProjectCount = async () => {
      try {
        setProjectLoading(true);
        const response = await axios.get("http://localhost:8000/projects");
        console.log("Project API response:", response.data);

        // Calculate project count
        const count = response.data.length;
        setProjectCount(count);

        setProjectError("");
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjectError("Unable to load project count");
      } finally {
        setProjectLoading(false);
      }
    };

    fetchProjectCount();
  }, []);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Users
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></span>
              ) : error ? (
                <span className="text-error-500 text-sm">Error</span>
              ) : (
                userCount.toLocaleString()
              )}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Projects
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {projectLoading ? (
                <span className="inline-block w-16 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></span>
              ) : projectError ? (
                <span className="text-error-500 text-sm">Error</span>
              ) : (
                projectCount.toLocaleString()
              )}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
