// Normalizes whatever shape the backend / fetch throws into one consistent
// { status, message, fieldErrors } object, so every form and toast in the
// app reads errors the same way regardless of which endpoint failed.
export function normalizeApiError(error) {
  if (!error) {
    return { status: 0, message: "Something went wrong. Please try again.", fieldErrors: {} };
  }

  // RTK Query network-level failure (no response at all)
  if (error.status === "FETCH_ERROR") {
    return {
      status: 0,
      message: "Can't reach the server. Check your connection and try again.",
      fieldErrors: {},
    };
  }

  const status = typeof error.status === "number" ? error.status : 0;
  const body = error.data ?? {};

  return {
    status,
    message: body.message || defaultMessageFor(status),
    fieldErrors: body.errors || body.fieldErrors || {},
  };
}

function defaultMessageFor(status) {
  switch (status) {
    case 400:
      return "That request wasn't valid. Check the form and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "That couldn't be found.";
    case 409:
      return "That conflicts with an existing record.";
    case 500:
      return "The server ran into a problem. Please try again shortly.";
    default:
      return "Something went wrong. Please try again.";
  }
}
