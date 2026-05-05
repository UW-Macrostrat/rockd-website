import { rockdApiOldURL } from "~/settings";

export async function data() {
  const res = await fetch(`${rockdApiOldURL}/metrics`);

  if (!res.ok) {
    throw new Error(`Failed to fetch Rockd metrics: ${res.status}`);
  }

  const userData = await res.json();

  return { data: userData.success.data };
}
