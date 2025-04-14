import React from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

export default function MemberDashboard() {
  return (
    <div>
      <PageMeta
        title="Member Dashboard | CodevisionPiweb"
        description="Member Dashboard for CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Member Dashboard" />
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {/* Member specific widgets */}
        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="16"
              viewBox="0 0 22 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.0001 0.799805H2.00012C1.10012 0.799805 0.350121 1.54981 0.350121 2.44981V13.5498C0.350121 14.4498 1.10012 15.1998 2.00012 15.1998H20.0001C20.9001 15.1998 21.6501 14.4498 21.6501 13.5498V2.44981C21.6501 1.54981 20.9001 0.799805 20.0001 0.799805ZM20.0001 13.5498H2.00012V2.44981H20.0001V13.5498Z"
                fill=""
              />
              <path
                d="M11.0001 11.8999C12.2834 11.8999 13.3334 10.8499 13.3334 9.5666C13.3334 8.28325 12.2834 7.23325 11.0001 7.23325C9.71675 7.23325 8.66675 8.28325 8.66675 9.5666C8.66675 10.8499 9.71675 11.8999 11.0001 11.8999ZM11.0001 8.73325C11.4584 8.73325 11.8334 9.10825 11.8334 9.5666C11.8334 10.0249 11.4584 10.3999 11.0001 10.3999C10.5417 10.3999 10.1667 10.0249 10.1667 9.5666C10.1667 9.10825 10.5417 8.73325 11.0001 8.73325Z"
                fill=""
              />
              <path
                d="M17.3334 7.23325C18.6167 7.23325 19.6667 6.18325 19.6667 4.89992C19.6667 3.61659 18.6167 2.56659 17.3334 2.56659C16.0501 2.56659 15.0001 3.61659 15.0001 4.89992C15.0001 6.18325 16.0501 7.23325 17.3334 7.23325ZM17.3334 4.06659C17.7917 4.06659 18.1667 4.44159 18.1667 4.89992C18.1667 5.35825 17.7917 5.73325 17.3334 5.73325C16.8751 5.73325 16.5001 5.35825 16.5001 4.89992C16.5001 4.44159 16.8751 4.06659 17.3334 4.06659Z"
                fill=""
              />
              <path
                d="M4.66675 7.23325C5.95008 7.23325 7.00008 6.18325 7.00008 4.89992C7.00008 3.61659 5.95008 2.56659 4.66675 2.56659C3.38341 2.56659 2.33341 3.61659 2.33341 4.89992C2.33341 6.18325 3.38341 7.23325 4.66675 7.23325ZM4.66675 4.06659C5.12508 4.06659 5.50008 4.44159 5.50008 4.89992C5.50008 5.35825 5.12508 5.73325 4.66675 5.73325C4.20841 5.73325 3.83341 5.35825 3.83341 4.89992C3.83341 4.44159 4.20841 4.06659 4.66675 4.06659Z"
                fill=""
              />
            </svg>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                My Tasks
              </h4>
              <span className="text-sm font-medium">View your assigned tasks</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="20"
              height="22"
              viewBox="0 0 20 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.625 15.8748V12.9998C19.625 12.5873 19.2875 12.2498 18.875 12.2498H17.375V5.37484C17.375 5.14984 17.2625 4.92484 17.075 4.77484L14.075 1.77484C13.925 1.58734 13.7 1.47484 13.475 1.47484H3.125C2.7125 1.47484 2.375 1.81234 2.375 2.22484V12.2498H0.875C0.4625 12.2498 0.125 12.5873 0.125 12.9998V15.8748C0.125 16.2873 0.4625 16.6248 0.875 16.6248H2.375V17.7498C2.375 18.9998 3.375 19.9998 4.625 19.9998H15.125C16.375 19.9998 17.375 18.9998 17.375 17.7498V16.6248H18.875C19.2875 16.6248 19.625 16.2873 19.625 15.8748ZM15.875 5.74984V7.24984H14.375V5.74984H15.875ZM14.375 3.52484L15.875 4.99984H14.375V3.52484ZM3.875 2.97484H12.875V7.99984C12.875 8.41234 13.2125 8.74984 13.625 8.74984H16.625V12.2498H3.875V2.97484ZM15.875 17.7498C15.875 18.1623 15.5375 18.4998 15.125 18.4998H4.625C4.2125 18.4998 3.875 18.1623 3.875 17.7498V16.6248H15.875V17.7498ZM18.125 15.1248H1.625V13.7498H18.125V15.1248Z"
                fill=""
              />
              <path
                d="M7.375 11.4998H13.125C13.5375 11.4998 13.875 11.1623 13.875 10.7498C13.875 10.3373 13.5375 9.99979 13.125 9.99979H7.375C6.9625 9.99979 6.625 10.3373 6.625 10.7498C6.625 11.1623 6.9625 11.4998 7.375 11.4998Z"
                fill=""
              />
              <path
                d="M7.375 8.74979H13.125C13.5375 8.74979 13.875 8.41229 13.875 7.99979C13.875 7.58729 13.5375 7.24979 13.125 7.24979H7.375C6.9625 7.24979 6.625 7.58729 6.625 7.99979C6.625 8.41229 6.9625 8.74979 7.375 8.74979Z"
                fill=""
              />
              <path
                d="M7.375 6.00021H9.625C10.0375 6.00021 10.375 5.66271 10.375 5.25021C10.375 4.83771 10.0375 4.50021 9.625 4.50021H7.375C6.9625 4.50021 6.625 4.83771 6.625 5.25021C6.625 5.66271 6.9625 6.00021 7.375 6.00021Z"
                fill=""
              />
            </svg>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                My Projects
              </h4>
              <span className="text-sm font-medium">View your project assignments</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 2.99066 21.3813 3.85003 21.3813H18.1157C18.975 21.3813 19.8 21.0031 20.35 20.3844C20.9 19.7656 21.2094 18.9063 21.1063 18.0469ZM19.2157 19.3531C18.9407 19.6625 18.5625 19.8344 18.15 19.8344H3.85003C3.43753 19.8344 3.05941 19.6625 2.78441 19.3531C2.50941 19.0438 2.37191 18.6313 2.44066 18.2188L4.12503 3.43751C4.19378 2.71563 4.81253 2.16563 5.56878 2.16563H16.4313C17.1532 2.16563 17.7719 2.71563 17.875 3.43751L19.5938 18.2531C19.6282 18.6656 19.4907 19.0438 19.2157 19.3531Z"
                fill=""
              />
              <path
                d="M14.3345 5.29375C13.922 5.39688 13.647 5.80938 13.7501 6.22188C13.8532 6.63438 14.2657 6.90938 14.6782 6.80625C15.0907 6.70313 15.3657 6.29063 15.2626 5.87813C15.1595 5.46563 14.747 5.19063 14.3345 5.29375Z"
                fill=""
              />
              <path
                d="M15.4376 8.04063C15.0251 8.14375 14.7501 8.55625 14.8532 8.96875C14.9563 9.38125 15.3688 9.65625 15.7813 9.55313C16.1938 9.45 16.4688 9.0375 16.3657 8.625C16.2626 8.2125 15.8501 7.9375 15.4376 8.04063Z"
                fill=""
              />
              <path
                d="M11.0001 5.32497C10.5876 5.42809 10.3126 5.84059 10.4157 6.25309C10.5188 6.66559 10.9313 6.94059 11.3438 6.83747C11.7563 6.73434 12.0313 6.32184 11.9282 5.90934C11.8251 5.49684 11.4126 5.22184 11.0001 5.32497Z"
                fill=""
              />
              <path
                d="M11.0001 7.95626C10.5876 8.05938 10.3126 8.47188 10.4157 8.88438C10.5188 9.29688 10.9313 9.57188 11.3438 9.46875C11.7563 9.36563 12.0313 8.95313 11.9282 8.54063C11.8251 8.12813 11.4126 7.85313 11.0001 7.95626Z"
                fill=""
              />
              <path
                d="M11.0001 10.5876C10.5876 10.6907 10.3126 11.1032 10.4157 11.5157C10.5188 11.9282 10.9313 12.2032 11.3438 12.1001C11.7563 11.997 12.0313 11.5845 11.9282 11.172C11.8251 10.7595 11.4126 10.4845 11.0001 10.5876Z"
                fill=""
              />
              <path
                d="M8.55301 10.6218C8.14051 10.7249 7.86551 11.1374 7.96863 11.5499C8.07176 11.9624 8.48426 12.2374 8.89676 12.1343C9.30926 12.0312 9.58426 11.6187 9.48113 11.2062C9.37801 10.7937 8.96551 10.5187 8.55301 10.6218Z"
                fill=""
              />
              <path
                d="M8.55301 13.2532C8.14051 13.3563 7.86551 13.7688 7.96863 14.1813C8.07176 14.5938 8.48426 14.8688 8.89676 14.7657C9.30926 14.6626 9.58426 14.2501 9.48113 13.8376C9.37801 13.4251 8.96551 13.1501 8.55301 13.2532Z"
                fill=""
              />
              <path
                d="M14.3345 11.6532C13.922 11.7563 13.647 12.1688 13.7501 12.5813C13.8532 12.9938 14.2657 13.2688 14.6782 13.1657C15.0907 13.0626 15.3657 12.6501 15.2626 12.2376C15.1595 11.8251 14.747 11.5501 14.3345 11.6532Z"
                fill=""
              />
              <path
                d="M14.3345 14.2843C13.922 14.3874 13.647 14.7999 13.7501 15.2124C13.8532 15.6249 14.2657 15.8999 14.6782 15.7968C15.0907 15.6937 15.3657 15.2812 15.2626 14.8687C15.1595 14.4562 14.747 14.1812 14.3345 14.2843Z"
                fill=""
              />
              <path
                d="M11.0001 13.2532C10.5876 13.3563 10.3126 13.7688 10.4157 14.1813C10.5188 14.5938 10.9313 14.8688 11.3438 14.7657C11.7563 14.6626 12.0313 14.2501 11.9282 13.8376C11.8251 13.4251 11.4126 13.1501 11.0001 13.2532Z"
                fill=""
              />
            </svg>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                Time Tracking
              </h4>
              <span className="text-sm font-medium">Track your work hours</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="18"
              viewBox="0 0 22 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751ZM7.18418 2.05626C8.45605 2.05626 9.52168 3.05313 9.52168 4.29063C9.52168 5.52813 8.49043 6.52501 7.18418 6.52501C5.87793 6.52501 4.84668 5.52813 4.84668 4.29063C4.84668 3.05313 5.9123 2.05626 7.18418 2.05626Z"
                fill=""
              />
              <path
                d="M15.8124 9.6875C17.6687 9.6875 19.1468 8.24375 19.1468 6.42188C19.1468 4.6 17.6343 3.15625 15.8124 3.15625C13.9905 3.15625 12.478 4.6 12.478 6.42188C12.478 8.24375 13.9905 9.6875 15.8124 9.6875ZM15.8124 4.7375C16.8093 4.7375 17.5999 5.49375 17.5999 6.45625C17.5999 7.41875 16.8093 8.175 15.8124 8.175C14.8155 8.175 14.0249 7.41875 14.0249 6.45625C14.0249 5.49375 14.8155 4.7375 15.8124 4.7375Z"
                fill=""
              />
              <path
                d="M15.9843 10.0313H15.6749C14.6437 10.0313 13.6468 10.3406 12.7874 10.8563C11.8593 9.61876 10.3812 8.79376 8.73115 8.79376H5.67178C2.85303 8.82814 0.618652 11.0625 0.618652 13.8469V16.3219C0.618652 16.975 1.13428 17.4906 1.7874 17.4906H20.2468C20.8999 17.4906 21.4499 16.9406 21.4499 16.2875V13.8469C21.4155 11.7344 19.0999 10.0313 15.9843 10.0313ZM2.16553 15.9438V13.8469C2.16553 11.9219 3.74678 10.3406 5.67178 10.3406H8.73115C10.6562 10.3406 12.2374 11.9219 12.2374 13.8469V15.9438H2.16553V15.9438ZM19.8687 15.9438H13.7499V13.8469C13.7499 13.2969 13.6468 12.7469 13.4749 12.2313C14.0937 11.7844 14.8499 11.5781 15.6405 11.5781H15.9499C18.0968 11.5781 19.8343 12.7125 19.8343 13.8469V15.9438H19.8687Z"
                fill=""
              />
            </svg>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                Team Communication
              </h4>
              <span className="text-sm font-medium">Connect with your team</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member specific content */}
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-8">
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
              My Task List
            </h4>
            
            <div className="flex flex-col">
              <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
                <div className="p-2.5 xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Task
                  </h5>
                </div>
                <div className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Due Date
                  </h5>
                </div>
                <div className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Priority
                  </h5>
                </div>
                <div className="hidden p-2.5 text-center sm:block xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Status
                  </h5>
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
                <div className="flex items-center gap-3 p-2.5 xl:p-5">
                  <p className="text-black dark:text-white">Create user interface mockups</p>
                </div>

                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-black dark:text-white">Jun 15, 2023</p>
                </div>

                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-meta-1">High</p>
                </div>

                <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                  <p className="inline-flex rounded-full bg-warning bg-opacity-10 py-1 px-3 text-sm font-medium text-warning">
                    In Progress
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
                <div className="flex items-center gap-3 p-2.5 xl:p-5">
                  <p className="text-black dark:text-white">Fix login page bug</p>
                </div>

                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-black dark:text-white">Jun 20, 2023</p>
                </div>

                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-meta-3">Medium</p>
                </div>

                <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                  <p className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">
                    Completed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
              Team Announcements
            </h4>
            
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full">
                <img src="/images/user/owner.jpg" alt="User" />
              </div>
              <div>
                <h5 className="font-medium text-black dark:text-white">
                  Team Meeting
                </h5>
                <p className="text-sm">Tomorrow at 10:00 AM</p>
              </div>
            </div>
            
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full">
                <img src="/images/user/owner.jpg" alt="User" />
              </div>
              <div>
                <h5 className="font-medium text-black dark:text-white">
                  Project Deadline
                </h5>
                <p className="text-sm">Friday, June 15</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
