import h from "@macrostrat/hyper";
import { Button } from '@material-ui/core/Button'
import { StopContainer } from '../containers/StopContainer.js'
import { Image } from "../index";

export function Info() {
    h("div", { className: 'info-container'}, [
        h("div", { className: 'trip-meta'}, [
            h(Image, { src: Constants.ROCKD_API_URL + "/protected/gravatar/" + trip.person_id, className: 'profile-pic'}),
            h("div", { className: 'trip-meta-text'}, [
                h("p", { className: 'person-name'}, `${trip.first_name} ${trip.last_name}`),
                h("p", { className: 'edited'}, `Edited ${trip.updated.toString()}`)
            ])
        ]),
        h("h1", { className: 'trip-title'}, trip.name),
        h("p", { className: trip.description ? 'trip-description' : 'hidden'}, trip.description),
        h(Button, { className: 'download-kmz', size: "small", variant: "outlined", href: "https://rockd.org/api/v2/trips/" + trip.trip_id + "?format=kmz", target: "_blank"}, "Download KMZ"),
        trip.stops.map((s, i) => {
            return h(StopContainer, { key: s.stop_id, stop: s, idx: i + 1})
        })
    ]);
}