import { h } from '@macrostrat/map-interface'
import { usePageContext } from 'vike-react/usePageContext'
import "./main.styl"
import { Image } from "../index"

function pageDoesntExist() {


  return h('div.error404', [
    h(Image, { src: "earth-crust.jpg", className: "error-image", width: "100%", height: "100%" }),
    h('div.error-text', [
      h('h1', "404"),
      h('h2', "The rock you are looking for doesn't exist. Keep digging."),
      h('div.buttons', [
        h('button', { onClick: () => history.back() }, "Go back"),
        h('a', { href: "/dev/test-site/" }, "Go home")
      ]),
    ])  
  ])
}

export function Page() {
  const pageContext = usePageContext()
 
  let msg: string // Message shown to the user
  const { abortReason, abortStatusCode } = pageContext
  if (abortReason?.notAdmin) {
    // Handle `throw render(403, { notAdmin: true })`
    msg = "You cannot access this page because you aren't an administrator."
  } else if (typeof abortReason === 'string') {
    // Handle `throw render(abortStatusCode, `You cannot access ${someCustomMessage}`)`
    msg = abortReason
  } else if (abortStatusCode === 403) {
    // Handle `throw render(403)`
    msg = "You cannot access this page because you don't have enough privileges."
  } else if (abortStatusCode === 401) {
    // Handle `throw render(401)`
    msg = "You cannot access this page because you aren't logged in. Please log in."
  } else {
    // Fallback error message
    msg = pageContext.is404 ?
      pageDoesntExist() :
      "Something went wrong. Try again (later)."
  }

  return h('div.error', msg)
}