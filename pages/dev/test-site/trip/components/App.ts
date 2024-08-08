import h from "@macrostrat/hyper";
import { usePageContext } from 'vike-react/usePageContext'

export function Page() {
    const pageContext = usePageContext();
    const val = 'urlPathname' in pageContext && pageContext.urlPathname
    return h("p", val);
}

export function App() {
    const pageContext = usePageContext();
    const path = 'urlPathname' in pageContext && pageContext.urlPathname

    if(path == "/dev/test-site/trip") {
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