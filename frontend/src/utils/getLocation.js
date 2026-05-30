export function getLiveLocation(callback) {
  if (!navigator.geolocation) {
    alert("Geolocation not supported!");
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      callback({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    },
    (err) => console.error(err),
    { enableHighAccuracy: true }
  );
}