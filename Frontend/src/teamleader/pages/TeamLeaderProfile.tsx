import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";
import UserMetaCard from "../../dashboard/components/UserProfile/UserMetaCard";
import UserInfoCard from "../../dashboard/components/UserProfile/UserInfoCard";
import UserAddressCard from "../../dashboard/components/UserProfile/UserAddressCard";
import PageMeta from "../../dashboard/components/common/PageMeta";

export default function TeamLeaderProfile() {
  return (
    <>
      <PageMeta
        title="Team Leader Profile | CodevisionPiweb"
        description="Team Leader profile page for CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Team Leader Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </>
  );
}


