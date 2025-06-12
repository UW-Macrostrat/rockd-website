import { fetchAPIDataOld } from "~/components/general";


export async function data() {
    const userData = await fetchAPIDataOld("/metrics");

    return { data: userData.success.data };
}