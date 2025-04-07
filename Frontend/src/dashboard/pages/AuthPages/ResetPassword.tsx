import ResetPasswordForm from '../../components/auth/ResetPasswordForm';


const ResetPassword = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">Reset Password</h2>
        <ResetPasswordForm />
      </div>
    </div>
  );
};

export default ResetPassword;