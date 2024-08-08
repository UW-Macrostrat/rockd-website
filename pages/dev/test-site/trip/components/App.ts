import h from "@macrostrat/hyper";
import MapContainer from '../containers/MapContainer'
import InfoContainer from '../containers/InfoContainer'

export function App() {
    if(1 != 1) {
        return h("div", { className: 'error'}, [
            h("div", [
                h("h1", "Trip found")
            ])
        ]);
    } else {
        return h("div", { className: 'error'}, [
            h("div", [
                h("h1", "Trip not found")
            ])
        ]);
    }
}