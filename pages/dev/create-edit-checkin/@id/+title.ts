import type { PageContext } from "vike/types";

// The checkin's id, in the header trail and the browser tab
// (Rockd › Development › Edit checkins › 43766)
export default (pageContext: PageContext) => pageContext.routeParams.id;
