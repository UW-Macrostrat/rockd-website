import { render } from "vike/abort";
import { Environment, getEnvironment } from "~/settings";

export async function productionGuard(pageContext) {
  // Check an environment variable (use PUBLIC_ENV__ prefix if needed on client, or standard process.env on server)
  const env = getEnvironment();
  if (env != Environment.development) {
    throw render(403, "Access denied.");
  }
}
