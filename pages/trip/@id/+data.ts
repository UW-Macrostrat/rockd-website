import { rockdApiURL } from "@macrostrat-web/settings";


export async function data(pageContext) {
    const data = await fetch(
        `${rockdApiURL}/trips/${pageContext.routeParams.id}?simple=true`
    ).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });

    const commentsData = await fetch(
        `${rockdApiURL}/protected/comments?trip_id=${pageContext.routeParams.id}`
    ).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });

    return { data, commentsData }
}