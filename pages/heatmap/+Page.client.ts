import h from "@macrostrat/hyper";
import { useAPIResult } from "@macrostrat/ui-components";
import { matomoToken } from "@macrostrat-web/settings"

export function Page() {   
    const data = useAPIResult('/api/matomo')

    console.log("Matomo API response:", data);

    return h("div", { className: "page-container" }, [
        h("div.heatmap-banner", 
            h("h3", "Heatmap")
        ),
        h("div.heatmap-container", 
            h("div.heatmap", { id: "heatmap" })
        ),
        h("div.footer", 
            h("p", "Footer content here")
        )
    ]);
}