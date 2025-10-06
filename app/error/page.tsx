import Link from "next/link";

export default function ErrorPage(props: unknown) {
  const searchParams = (props as { searchParams?: { type?: string; message?: string; email?: string } })?.searchParams;
  const { type, message, email } = searchParams ?? {};

  // Define error types and their messages
  const errorMessages = {
    'beacon-not-found': {
      title: 'Account Not Found',
      description: `Your email address${email ? ` (${email})` : ''} was not found in our Beacon CRM system.`,
      action: 'Please contact an administrator to get your account set up.'
    },
    'beacon-invalid': {
      title: 'Invalid Account Data',
      description: 'Your account was found but contains invalid data.',
      action: 'Please contact support to resolve this issue.'
    },
    'no-organization': {
      title: 'No Organization Found',
      description: `You don't appear to be associated with any organization${email ? ` for ${email}` : ''}.`,
      action: 'Please contact your administrator to be added to an organization.'
    },
    'permission-denied': {
      title: 'Access Denied',
      description: 'You do not have permission to access this resource.',
      action: 'Please contact your administrator for access.'
    }
  };

  // Get the error info or fall back to custom message or default
  const errorInfo = errorMessages[type as keyof typeof errorMessages] || {
    title: 'Something went wrong!',
    description: message || 'An unexpected error occurred.',
    action: 'Please try again later or contact support if the issue persists.'
  };

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">{errorInfo.title}</h1>
        <p className="text-gray-700">{errorInfo.description}</p>
        <p className="text-gray-600">{errorInfo.action}</p>
        
        <div className="flex gap-4 justify-center mt-6">
          <Link
            href="/auth/login" 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 no-underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}