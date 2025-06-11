import { rockdApiURL } from "@macrostrat-web/settings";


export async function data(pageContext) {
    const checkin = await fetch(
        `${rockdApiURL}/protected/checkins?checkin_id=${pageContext.routeParams.id}`
    ).then((response) => {
        return response.json();
    });

    return { checkin: checkin.success.data[0] };
}