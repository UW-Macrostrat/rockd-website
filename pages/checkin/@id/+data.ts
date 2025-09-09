import { fetchAPIData } from "~/components/general";
import { rockdApiURL } from "~/settings";

export async function data(pageContext) {
    const id = parseInt(pageContext.urlParsed.pathname.split("/")[2]);
    const data = await fetch(
            `${rockdApiURL}/protected/checkins?checkin_id=${id}`
        ).then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });

    const comments = await fetch(
            `${rockdApiURL}/protected/comments?checkin_id=${id}`
        ).then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
    return { checkin: data.success.data[0], comments: comments.success.data };
}
