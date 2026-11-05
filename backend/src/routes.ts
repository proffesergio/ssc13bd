/** Exact route matching keeps nested resource routes out of collection handlers. */
export function supportedRoute(method: string, path: string[]) {
  if (path.length === 1) {
    const routes: Record<string, string[]> = {
      config: ["GET"], overview: ["GET"], directory: ["GET"], sos: ["GET", "POST"],
      events: ["GET", "POST"], expenses: ["GET", "POST"], me: ["GET", "PATCH"],
      notifications: ["GET"], verification: ["GET", "POST"],
    };
    return routes[path[0]]?.includes(method) ?? false;
  }
  if (path.length === 2 && path[0] === "otp" && path[1] === "request") return method === "POST";
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(path[1] || "")) return false;
  if (path.length === 2) return ["sos", "notifications", "verification"].includes(path[0]) && method === "PATCH";
  if (path.length === 3 && path[0] === "sos" && path[2] === "responses") return ["GET", "POST"].includes(method);
  if (path.length === 3 && path[0] === "events" && path[2] === "photos") return ["GET", "POST"].includes(method);
  return path.length === 3 && path[0] === "events" && path[2] === "rsvp" && ["POST", "DELETE"].includes(method);
}
