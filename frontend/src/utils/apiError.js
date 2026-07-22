export function getApiError(err, fallback = "Something went wrong.") {
  const data = err?.response?.data;
  if (data?.msg) {
    if (data.error && !String(data.msg).includes(String(data.error))) {
      return `${data.msg} (${data.error})`;
    }
    return data.msg;
  }
  if (typeof data === "string") {
    if (data.includes("Cannot POST")) {
      return "Server route not found. Redeploy the backend on Render (latest GitHub code).";
    }
    if (data.length < 200) return data;
  }
  if (err?.response?.status === 404) {
    return "Server route not found. Redeploy the backend on Render (latest GitHub code).";
  }
  if (!err?.response) {
    return "Cannot reach server. Check REACT_APP_API_URL on Vercel and that Render backend is running.";
  }
  return fallback;
}
