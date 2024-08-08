import h from "@macrostrat/hyper";

export function Info() {
    h("div", { className: 'info-container'}, [
        h("div", { className: 'trip-meta'}, [
            h("img", { src: Constants.ROCKD_API_URL + "/protected/gravatar/" + trip.person_id, className: 'profile-pic'}),
            h("div", { className: 'trip-meta-text'}, [
                h("p", { className: 'person-name'}, `${trip.first_name} ${trip.last_name}`),
                h("p", { className: 'edited'}, `Edited ${trip.updated.toString()}`)
            ])
        ]),
    ]);
}