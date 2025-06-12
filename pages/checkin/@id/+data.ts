import { fetchAPIData } from "~/components/general";

export async function data(pageContext) {
    const id = pageContext.routeParams.id;
    const checkin = await fetchAPIData(`/protected/checkins?checkin_id=${id}`)

    return { checkin: checkin.success.data[0] };
}