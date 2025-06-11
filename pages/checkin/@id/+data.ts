import { rockdApiURL } from "@macrostrat-web/settings";


export async function data(pageContext) {
    const checkin = await fetch(
        `${rockdApiURL}/checkins?checkin_id=${pageContext.routeParams.id}`
    ).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json()[0];
    });

    return { checkin }
}