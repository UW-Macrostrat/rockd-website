import { rockdApiURL } from "@macrostrat-web/settings";


export async function data(pageContext) {
    const data = await fetch(
        `${rockdApiURL}/trips/${pageContext.routeParams.id}`
    ).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
    
    return { data}
}