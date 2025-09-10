export function deletePins(str) {
  let previous = document.querySelectorAll(str);
  previous.forEach((marker) => {
    marker.remove();
  });
}