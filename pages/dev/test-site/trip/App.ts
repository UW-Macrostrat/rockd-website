import { isDetailPanelRouteInternal } from "#/map/map-interface/app-state";
import h from "@macrostrat/hyper";
import { usePageContext } from 'vike-react/usePageContext'

function getTrip() {
    const pageContext = usePageContext();
    const trip = 'urlParsed' in pageContext && pageContext.urlParsed.search.trip;
    return parseInt(trip);
}

export function App() {
    const trip = getTrip();
    if(trip < 100) {
        console.log("Trip " + trip + " found");
        return h("div", { className: 'error'}, [
            h("div", [
                h("h1", "Trip " + trip + " found")
            ])
        ]);
    } else {
        console.log("Trip " + trip + " not found");
        return h("div", { className: 'error'}, [
            h("div", [
                h("h1", "Trip " + trip + " not found")
            ])
        ]);
    }
}

export function TripSearch() {
    return h(
        "div", { className: "trip-search" },[
            h("h1", { className: "trip-q" }, "Trip Search:"),
            h("input", {  className: "trip-input", type: "text", placeholder: "Enter Trip Number" }),
            h("a", {  className: "search-btn", type: "button", href: "/dev/test-site/trip?trip=3" }, "Search")
        ]
    )
}

function searchClick() {
    
}
