import { fetchAPIDataOld } from "~/components/general";
import { rockdApiOldURL } from "~/settings";


export async function data() {
    const userData = await fetch(
        `${rockdApiOldURL}/metrics`
    ).then((res) => res.json()
    );

    return { data: userData.success.data };
}
