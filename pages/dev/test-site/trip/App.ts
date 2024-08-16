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
    let data = '';
    
    fetch("https://rockd.org/api/v2/trips/" + trip)
    .then(function(response) {
        return response.json();
    })
    .then(function(myJson) {
        data = myJson;
        data = data["success"]["data"][0];
        console.log(data);
        console.log(data["first_name"] + " " + data['last_name'] + " took a trip to " + data["name"]);
    });

    // change conidition to match total number of trips
    if(trip < 100) {
        console.log("Trip " + trip + " found");
        console.log(data["first_name"] + " " + data['last_name'] + " took a trip to " + data["name"]);
        return h("div", { className: 'error'}, [
            h("div", [
                h("h1", "Trip " + String(trip) + " found"),
                h("p", data["first_name"] + " " + data['last_name'] + " took a trip to " + data["name"]),
            ])
        ]);
    } else {
        console.log("Trip " + trip + " not found");
        console.log(data["first_name"] + " " + data['last_name'] + " took a trip to " + data["name"]);
        return h("div", { className: 'error'}, [
            h("div", [
                h("h1", "Trip " + String(trip) + " not found"),
                h("p", data["first_name"] + " " + data['last_name'] + " took a trip to " + data["name"]),
            ])
        ]);
    }
}

export function TripSearch() {
    const trip = searchClick();
    var searchBtn = h("a", {  className: "search-btn", type: "button", href: "/dev/test-site/trip?trip=3" }, "Search");

    return h(
        "div", { className: "trip-search" },[
            h("h1", { className: "trip-q" }, "Trip Search:"),
            h("input", {  className: "trip-input", type: "text", placeholder: "Enter Trip Number" }),
            searchBtn
        ]
    )
}

function searchClick() {
    return "5";
}

export function Trip() {
    return h("div", { className: 'trip-container'}, [
        h(App),
        h(TripSearch)
    ]);
}

async function fetchTrip() {
    const trip = getTrip();
    const response = await fetch("https://rockd.org/api/v2/trips/" + trip);
    const data = await response.json();
    return data;
}